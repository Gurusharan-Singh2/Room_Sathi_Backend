// user model
import crypto from "crypto";
import User  from "../models/user.js";
import {catchAsyncError} from '../utils/catchAsyncError.js'
import ErrorHandler from "../utils/error.js";
 import {checkOtpRestrictions,sendOtpByEmail, trackOtpRequests} from '../utils/authHelper.js'
import redis from "../config/redis.js";
import { hashPassword,comparePassword } from "../utils/passwordUtils.js";
import { generateToken } from "../utils/generateToken.js";
import { getSignedUrlFromB2, uploadToB2 } from "../utils/b2.js";
import { sendEmail } from "../utils/Email.js";


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




export const loginWithPassword = catchAsyncError(async (req, res, next) => {
  
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required", 400));
  }

  const user = await User.findOne({ email }).select('+password');;
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect password", 401));
  }

  const token = generateToken({ id: user._id, email: user.email, name: user.username });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    userInfo: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      image: user.image,
    },
  });
});



// forgot 


export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Generate a secure reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  // Save hashed token in Redis (expires in 15 minutes)
  await redis.set(`resetToken:${email}`, hashedToken, "EX", 900);

  // Construct reset link (frontend)
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const message = `
    <div style="font-family:sans-serif;padding:20px;">
      <h2>Reset Your Password</h2>
      <p>Hi ${user.username},</p>
      <p>You requested to reset your password. Click below to proceed:</p>
      <a href="${resetLink}" style="background:#007bff;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">
        Reset Password
      </a>
      <p style="margin-top:15px;">This link will expire in <strong>15 minutes</strong>.</p>
      <p>If you didn’t request this, you can safely ignore this email.</p>
    </div>
  `;

  const emailSent = await sendEmail({
    email,
    subject: "Password Reset Request",
    message,
  });

  if (!emailSent) {
    return next(new ErrorHandler("Failed to send password reset email", 500));
  }

  res.status(200).json({
    success: true,
    message: "Password reset link sent to your email.",
  });
});


// reset - pass

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const savedToken = await redis.get(`resetToken:${email}`);

  if (!savedToken || savedToken !== hashedToken) {
    return next(new ErrorHandler("Invalid or expired token", 400));
  }

  
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  await user.save();

 
  await redis.del(`resetToken:${email}`);

  res.status(200).json({
    success: true,
    message: "Password reset successful. You can now log in with your new password.",
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

