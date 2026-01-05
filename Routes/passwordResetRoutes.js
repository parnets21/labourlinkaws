const express = require("express");
const router = express.Router();
const passwordResetController = require("../Controller/passwordResetController");

// Send OTP for forgot password
router.post("/send-otp", passwordResetController.sendForgotPasswordOTP);

// Verify OTP
router.post("/verify-otp", passwordResetController.verifyOTP);

// Reset password with token
router.post("/reset-password", passwordResetController.resetPassword);

// Resend OTP
router.post("/resend-otp", passwordResetController.resendOTP);

module.exports = router;