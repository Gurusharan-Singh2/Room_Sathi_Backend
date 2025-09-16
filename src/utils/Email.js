import '../config/env.js'
import nodemailer from 'nodemailer'

export const sendEmail = async ({ email, subject, message }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      secure: true,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject: subject,
      html:message
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Sending email to:", email);
    console.log('Email sent:', info.response);
   


    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
