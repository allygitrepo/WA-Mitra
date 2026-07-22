const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const emailService = {
  sendEmail: async (to, template) => {
    try {
      const info = await transporter.sendMail({
        from: `"WA-Mitra" <${process.env.SMTP_USER}>`,
        to,
        subject: template.subject,
        html: template.html,
      });
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  },
};

module.exports = emailService;
