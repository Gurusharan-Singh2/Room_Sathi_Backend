export const generateEmailTemplate = (otp, name) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your RoomSathi OTP</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f6f8;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      padding: 40px 30px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #3B82F6; /* Blue theme for RoomSathi */
      font-size: 28px;
      margin-bottom: 0;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
    }
    .otp-box {
      background: #3B82F6;
      color: #ffffff;
      font-size: 26px;
      font-weight: bold;
      padding: 18px 0;
      text-align: center;
      border-radius: 10px;
      letter-spacing: 6px;
      margin: 30px 0;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }
    .footer {
      font-size: 12px;
      color: #999;
      text-align: center;
      margin-top: 40px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RoomSathi</h1>
    </div>
    <p class="greeting">Dear ${name},</p>
    <p class="message">
      Thank you for joining <strong>RoomSathi</strong>. To continue, please use the OTP below to verify your email address and secure your account.
    </p>
    <div class="otp-box">${otp}</div>
    <p class="message">
      This OTP is valid for <strong>10 minutes</strong>. Please do not share it with anyone for your safety.
    </p>
    <p class="message">
      If you did not request this OTP, you can safely ignore this email.
    </p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} RoomSathi. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
