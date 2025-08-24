
import redis from "../config/redis.js";
import {sendEmailandOtp} from './sendOtp.js'


export const checkOtpRestrictions = async (identifier) => {


  const lockKey = `otp_lock:${identifier}`;
  const spamLockKey = `otp_spam_lock:${identifier}`;
  const cooldownKey = `otp_cooldown:${identifier}`;

  if (await redis.get(lockKey)) {
    throw new Error(`${isPhone ? "Phone" : "Email"} locked due to multiple failed attempts! Try again after 30 minutes.`);
  }

  if (await redis.get(spamLockKey)) {
    throw new Error(`Too many OTP requests for this ${isPhone ? "phone" : "email"}! Please wait 1 hour before requesting again.`);
  }

  if (await redis.get(cooldownKey)) {
    throw new Error(`Please wait 1 minute before requesting a new OTP for this ${isPhone ? "phone" : "email"}!`);
  }
};



export const sendOtpByEmail = async (username, identifier) => {
  if (!identifier) throw new Error("Email is required");


  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await redis.set(`otp:${identifier}`, otp, "EX", 300); 

  await redis.set(`otp_cooldown:${identifier}`, "1", "EX", 60); 

    await sendEmailandOtp(username, identifier, otp);
  
 
};




export const trackOtpRequests = async (identifier) => {
  const otpRequestKey = `otp_request_count:${identifier}`;
  const spamLockKey = `otp_spam_lock:${identifier}`;

  const currentCount = parseInt((await redis.get(otpRequestKey)) || "0");

  if (currentCount >= 2) {
    await redis.set(spamLockKey, "locked", "EX", 600); // Lock for 1 hour
    throw new Error(`Too many OTP requests for this ${isPhone ? "phone" : "email"}. Please wait 1 hour before trying again.`);
  }

  await redis.set(otpRequestKey, currentCount + 1, "EX", 600);
};


