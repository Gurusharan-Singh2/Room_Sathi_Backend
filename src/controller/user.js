// user model

import User  from "../models/user.js";
import {catchAsyncError} from '../utils/catchAsyncError.js'
import ErrorHandler from "../utils/error.js";
 import {checkOtpRestrictions} from '../utils/authHelper.js'
import { sendOtpByEmail, trackOtpRequests } from "../utils/AuthHelper.js";

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