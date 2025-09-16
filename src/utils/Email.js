import '../config/env.js';
import nodemailer from 'nodemailer';

export const sendEmail = async ({ email, subject, message }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // use STARTTLS
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD, // App Password if 2FA enabled
      },
    });

    const mailOptions = {
      from: `"My App" <${process.env.SMTP_MAIL}>`,
      to: email,
      subject,
      html: message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Sending email to:", email);
    console.log("Email sent:", info.response);

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
