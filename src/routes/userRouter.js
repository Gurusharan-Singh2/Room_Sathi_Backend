// user router
import express from 'express'
import { registerUser, verifyOtp } from '../controller/user.js';

const router=express.Router();

router.post('/signup',registerUser);
router.post('/verify-otp',verifyOtp);



export default router;