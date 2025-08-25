import jwt from "jsonwebtoken";
import '../config/env.js'


export const generateToken = (payload, expiresIn = "40d") => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};
