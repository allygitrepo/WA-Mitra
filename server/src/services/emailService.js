const nodemailer = require("nodemailer");
const path = require("path");
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
      const logoPath = path.join(__dirname, "../../../saas-portal/public/Logo_Dark.png");
      const attachments = [
        {
          filename: "Logo_Dark.png",
          path: logoPath,
          cid: "logo_dark",
        },
      ];

      // Merge additional attachments if defined in the template
      if (template.attachments) {
        attachments.push(...template.attachments);
      }

      const info = await transporter.sendMail({
        from: `"WA-Mitra" <${process.env.SMTP_USER}>`,
        to,
        subject: template.subject,
        html: template.html,
        attachments,
      });
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  },
};

module.exports = emailService;
