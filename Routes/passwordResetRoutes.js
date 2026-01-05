const express = require("express");
const router = express.Router();
const passwordResetController = require("../Controller/passwordResetController");

// Test route to verify the API is working
router.get("/test", (req, res) => {
  res.json({ message: "Password reset API is working", timestamp: new Date().toISOString() });
});

// Send OTP for forgot password
router.post("/send-otp", passwordResetController.sendForgotPasswordOTP);

// Verify OTP
router.post("/verify-otp", passwordResetController.verifyOTP);

// Reset password with token
router.post("/reset-password", passwordResetController.resetPassword);

// Resend OTP
router.post("/resend-otp", passwordResetController.resendOTP);

module.exports = router;