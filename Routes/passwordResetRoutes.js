const express = require("express");
const router = express.Router();
const { 
  sendForgotPasswordOTP, 
  verifyOTP, 
  resetPassword, 
  resendOTP 
} = require("../Controller/passwordResetController");

console.log("🔐 Password reset routes loading...");

// Test route to verify the API is working
router.get("/test", (req, res) => {
  res.json({ message: "Password reset API is working", timestamp: new Date().toISOString() });
});

// Debug route to check if email exists (remove in production)
router.post("/debug-email", async (req, res) => {
  try {
    const { email, userType } = req.body;
    const userModel = require("../Model/User/user");
    const employerModel = require("../Model/Employers/employers");
    
    let result = {};
    
    if (userType === 'jobseeker' || !userType) {
      const jobseekers = await userModel.find({ 
        email: { $regex: new RegExp(`^${email.toLowerCase()}$`, 'i') }
      }).select('email fullName isDelete isBlock');
      result.jobseekers = jobseekers;
    }
    
    if (userType === 'employer' || !userType) {
      const employers = await employerModel.find({ 
        email: { $regex: new RegExp(`^${email.toLowerCase()}$`, 'i') }
      }).select('email name isDelete isBlock');
      result.employers = employers;
    }
    
    res.json({
      searchEmail: email.toLowerCase(),
      userType: userType || 'both',
      results: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send OTP for forgot password
router.post("/send-otp", (req, res) => {
  console.log("🔐 send-otp route hit");
  return sendForgotPasswordOTP(req, res);
});

// Verify OTP
router.post("/verify-otp", (req, res) => {
  console.log("🔐 verify-otp route hit");
  return verifyOTP(req, res);
});

// Reset password with token
router.post("/reset-password", (req, res) => {
  console.log("🔐 reset-password route hit");
  return resetPassword(req, res);
});

// Resend OTP
router.post("/resend-otp", (req, res) => {
  console.log("🔐 resend-otp route hit");
  return resendOTP(req, res);
});

console.log("🔐 Password reset routes loaded successfully");
module.exports = router;