const express = require("express");
const authController = require("../controllers/authController");
const validator = require("../middleware/validator");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", validator.register, authController.register);
router.post("/verify-otp", validator.verifyOtp, authController.verifyOtp);
router.post("/login", validator.login, authController.login);
router.post("/google-login", authController.googleLogin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", authMiddleware, authController.getProfile);

module.exports = router;
