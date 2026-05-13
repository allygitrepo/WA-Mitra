const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const emailService = require("../services/emailService");
const emailTemplates = require("../services/emailTemplate");
const oauthService = require("../services/oauthService");
require("dotenv").config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const authController = {
  register: async (req, res) => {
    try {
      const { username, email, phone, orgName, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create user (unverified)
      const user = await User.create({
        username,
        email,
        phone,
        orgName,
        password: hashedPassword,
        otp,
        otpExpiry,
      });

      // Send OTP email
      await emailService.sendEmail(email, emailTemplates.otpEmail(otp));

      res.status(201).json({
        message: "Registration successful. Please check your email for the OTP to verify your account.",
        email: user.email,
      });
    } catch (error) {
      console.error("Registration Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  verifyOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;

      const user = await User.findOne({ where: { email, otp } });

      if (!user) {
        return res.status(400).json({ message: "Invalid OTP or Email" });
      }

      if (new Date() > user.otpExpiry) {
        return res.status(400).json({ message: "OTP has expired" });
      }

      // Mark as verified
      user.isVerified = true;
      user.otp = null;
      user.otpExpiry = null;
      await user.save();

      // Send welcome email
      await emailService.sendEmail(user.email, emailTemplates.welcomeEmail(user.username));

      const token = generateToken(user.id);

      res.status(200).json({
        message: "Account verified successfully",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          orgName: user.orgName
        },
      });
    } catch (error) {
      console.error("OTP Verification Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isVerified) {
        return res.status(401).json({ message: "Please verify your email first" });
      }

      if (!user.password) {
        return res.status(401).json({ message: "Please login using Google" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user.id);

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          orgName: user.orgName
        },
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  googleLogin: async (req, res) => {
    try {
      const { idToken, accessToken } = req.body;
      let googleData;

      if (idToken) {
        googleData = await oauthService.verifyGoogleToken(idToken);
      } else if (accessToken) {
        googleData = await oauthService.verifyGoogleAccessToken(accessToken);
      }

      if (!googleData) {
        return res.status(400).json({ message: "Invalid Google Token" });
      }

      let user = await User.findOne({ where: { email: googleData.email } });

      if (user) {
        // Update googleId if not present
        if (!user.googleId) {
          user.googleId = googleData.googleId;
          await user.save();
        }
      } else {
        // Create new user for Google login
        user = await User.create({
          username: googleData.username,
          email: googleData.email,
          googleId: googleData.googleId,
          isVerified: true, // Google emails are already verified
        });

        // Send welcome email for first time registration
        await emailService.sendEmail(user.email, emailTemplates.welcomeEmail(user.username));
      }

      const token = generateToken(user.id);

      res.status(200).json({
        message: "Google Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          orgName: user.orgName
        },
      });
    } catch (error) {
      console.error("Google Login Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({ message: "User does not exist. Please register to continue." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();

      await emailService.sendEmail(email, emailTemplates.otpEmail(otp));
      res.status(200).json({ message: "Password reset OTP sent to your email" });
    } catch (error) {
      console.error("Forgot Password Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
      const user = await User.findOne({ where: { email, otp } });

      if (!user) {
        return res.status(400).json({ message: "Invalid OTP or Email" });
      }

      if (new Date() > user.otpExpiry) {
        return res.status(400).json({ message: "OTP has expired" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.otp = null;
      user.otpExpiry = null;
      await user.save();

      res.status(200).json({ message: "Password reset successful. You can now login." });
    } catch (error) {
      console.error("Reset Password Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = authController;
