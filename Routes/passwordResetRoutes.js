const express = require("express");
const router = express.Router();
const passwordResetController = require("../Controller/passwordResetController");

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
router.post("/send-otp", passwordResetController.sendForgotPasswordOTP);

// Verify OTP
router.post("/verify-otp", passwordResetController.verifyOTP);

// Reset password with token
router.post("/reset-password", passwordResetController.resetPassword);

// Resend OTP
router.post("/resend-otp", passwordResetController.resendOTP);

module.exports = router;