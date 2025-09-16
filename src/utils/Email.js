import '../config/env.js';
import fetch from 'node-fetch';

export const sendEmail = async ({ email, subject, message }) => {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY, // same key as SMTP
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "My App",
          email: process.env.BREVO_USER, // must be verified sender in Brevo
        },
        to: [{ email }],
        subject,
        htmlContent: message,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    const data = await res.json();
    console.log("Email sent:", data);
    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    return false;
  }
};
