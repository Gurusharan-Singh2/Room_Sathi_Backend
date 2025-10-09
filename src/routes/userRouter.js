// user router
import express from 'express'
import { forgotPassword, getSignedProfile, loginWithPassword, registerUser, resetPassword, verifyOtp } from '../controller/user.js';
import { upload } from '../utils/b2.js';

const router=express.Router();

router.post('/signup',registerUser);
router.post("/verify-otp", upload.single("image"), verifyOtp);
router.post("/login", loginWithPassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/get-profile-url", getSignedProfile);



export default router;