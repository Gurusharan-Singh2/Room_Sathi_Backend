import {generateEmailTemplate} from "./TemplateGenerator.js"

import { sendEmail } from "./Email.js";


export const sendEmailandOtp=async(name,email,otp)=>{
  const message = generateEmailTemplate(otp,name);
  await sendEmail({ email, subject: "Verify Your Email", message });
}

