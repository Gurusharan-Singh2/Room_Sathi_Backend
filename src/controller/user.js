// user model

import User  from "../models/user.js";
import {catchAsyncError} from '../utils/catchAsyncError.js'
import ErrorHandler from "../utils/error.js";
 import {checkOtpRestrictions,sendOtpByEmail, trackOtpRequests} from '../utils/authHelper.js'
import redis from "../config/redis.js";
import { hashPassword } from "../utils/passwordUtils.js";
import { generateToken } from "../utils/generateToken.js";

export const registerUser = catchAsyncError(async (req, res, next) => {
  const { username, email, password} = req.body;

  if (!username || !email || !password ) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  
  const existingUser = await User.findOne({
    $or: [{ email}]
  });

  if(existingUser){
    return next(new ErrorHandler("User already exist !!!!",400))
  }

    await checkOtpRestrictions(email);
    await trackOtpRequests(email);
    await sendOtpByEmail(username, email);

    res.status(200).json({ success: true, message: "OTP sent for signup." });
});


export const verifyOtp=catchAsyncError(async(req,res,next)=>{
    const { username, email, password,otp} = req.body;
     if (!username || !email || !password || !otp ) {
    return next(new ErrorHandler("All fields are required", 400));
  }

const MAX_ATTEMPTS = 5;

const savedOtp = await redis.get(`otp:${email}`);
if (!savedOtp || savedOtp !== otp) {
  const failedKey = `otp_failed:${email}`;
  const failedAttempts = parseInt((await redis.get(failedKey)) || "0") + 1;

  await redis.set(failedKey, failedAttempts, "EX", 1800);

  const remainingAttempts = MAX_ATTEMPTS - failedAttempts;

  if (failedAttempts >= MAX_ATTEMPTS) {
    await redis.set(`otp_lock:${email}`, "true", "EX", 1800);
    return res.status(403).json({ 
      success: false, 
      message: "Account locked due to multiple failed attempts." 
    });
  }

  return res.status(401).json({ 
    success: false, 
    message: `Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.` 
  });
}


    await redis.del(`otp:${email}`);
    await redis.del(`otp_failed:${email}`);
    await redis.del(`otp_request_count:${email}`);


    const hashed = await hashPassword(password);
    const newUser = await User.create({ username, email, password:hashed });

    const token = generateToken({ id:newUser._id, email, name: username });


    const userInfo={
       "username": newUser.username,
        "email": newUser.email,
        "role": newUser.role,
        "_id": newUser._id
    }

   res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      token,
     userInfo
    });



})





//   try {
    
    
//     const { name, email, phone, otp } = req.body;
//     const identifier = phone || email;

//     if (!identifier || !otp) {
//       return res.status(400).json({ success: false, message: "OTP and email/phone are required." });
//     }

//     const savedOtp = await redis.get(`otp:${identifier}`);
//     if (!savedOtp || savedOtp !== otp) {
//       const failedKey = `otp_failed:${identifier}`;
//       const failedAttempts = parseInt((await redis.get(failedKey)) || "0") + 1;
//       await redis.set(failedKey, failedAttempts, "EX", 1800);
//       if (failedAttempts >= 5) {
//         await redis.set(`otp_lock:${identifier}`, "true", "EX", 1800);
//         return res.status(403).json({ success: false, message: "Account locked due to multiple failed attempts." });
//       }

//       return res.status(401).json({ success: false, message: "Invalid OTP." });
//     }

//     await redis.del(`otp:${identifier}`);
//     await redis.del(`otp_failed:${identifier}`);
//     await redis.del(`otp_request_count:${identifier}`);

  
   

//     const token = generateToken({ userId, phone, email, name: finalName });

//     res.status(200).json({
//       success: true,
//       message: "OTP verified successfully.",
//       token,
//       userId,
//       name: finalName,
//       phone:phone
//     });
//   } catch (err) {
//     next(err);
//   }
// };