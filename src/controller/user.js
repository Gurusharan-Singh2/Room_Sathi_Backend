// user model

import User  from "../models/user.js";
import {catchAsyncError} from '../utils/catchAsyncError.js'
import ErrorHandler from "../utils/error.js";
 import {checkOtpRestrictions,sendOtpByEmail, trackOtpRequests} from '../utils/authHelper.js'
import redis from "../config/redis.js";
import { hashPassword } from "../utils/passwordUtils.js";
import { generateToken } from "../utils/generateToken.js";
import { getSignedUrlFromB2, uploadToB2 } from "../utils/b2.js";


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


export const verifyOtp = catchAsyncError(async (req, res, next) => {
  const { username, email, password, otp } = req.body;
  const file = req.file; 

  if (!username || !email || !password || !otp) {
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
        message: "Account locked due to multiple failed attempts.",
      });
    }

    return res.status(401).json({
      success: false,
      message: `Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.`,
    });
  }

 
  await redis.del(`otp:${email}`);
  await redis.del(`otp_failed:${email}`);
  await redis.del(`otp_request_count:${email}`);

  let imageKey = null;
  let imageUrl = null;
  if (file) {
    imageKey = `users/${Date.now()}-${file.originalname}`;
    await uploadToB2({
      key: imageKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    imageUrl = await getSignedUrlFromB2(imageKey);
  }

  const hashed = await hashPassword(password);
  const newUser = await User.create({
    username,
    email,
    password: hashed,
    image: imageKey, 
  });

  const token = generateToken({ id: newUser._id, email, name: username });

  const userInfo = {
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    _id: newUser._id,
    image: imageUrl, 
  };

  res.status(200).json({
    success: true,
    message: "OTP verified successfully.",
    token,
    userInfo,
  });
});

export const getSignedProfile = catchAsyncError(async (req, res, next) => {
  const { userId } = req.body || {};


  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "userId is required",
    });
  }

  const existingUser = await User.findById(userId).select("-password -tokens");
  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  let signedUrl = null;
  if (existingUser.image) {
    signedUrl = await getSignedUrlFromB2(existingUser.image);
  }

  res.status(200).json({
    success: true,
    user: {
      ...existingUser.toObject(),
      signedUrl,
    },
  });
});

