const emailTemplates = {
  otpEmail: (otp) => ({
    subject: "Email Verification - WA-Mitra",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
        <p>Hello,</p>
        <p>Thank you for registering with WA-Mitra. Please use the following OTP to verify your email address:</p>
        <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; color: #007bff;">
          ${otp}
        </div>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 WA-Mitra. All rights reserved.</p>
      </div>
    `,
  }),
  welcomeEmail: (username) => ({
    subject: "Welcome to WA-Mitra!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Welcome, ${username}!</h2>
        <p>We're excited to have you on board.</p>
        <p>WA-Mitra is your portal for professional WhatsApp messaging services. You can now start managing your WhatsApp sessions and automating your communication.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 WA-Mitra. All rights reserved.</p>
      </div>
    `,
  }),
};

module.exports = emailTemplates;
