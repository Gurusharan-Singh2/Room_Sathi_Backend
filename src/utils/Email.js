import '../config/env.js';
import nodemailer from 'nodemailer';


export const sendEmail = async ({ email, subject, message }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: "971cab002@smtp-brevo.com",                  // <-- important, always "apikey"
        pass: process.env.BREVO_API_KEY, // <-- your SMTP key from Brevo
      },
    });

    const info = await transporter.sendMail({
      from: `"My App" <${process.env.BREVO_USER}>`, // your Gmail/registered email
      to: email,
      subject,
      html: message,
    });

    console.log("Email sent:", info.response);
    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    return false;
  }
};
