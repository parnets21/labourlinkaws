const bcrypt = require("bcryptjs");
const userModel = require("../Model/User/user");
const employerModel = require("../Model/Employers/employers");
const OTP = require("../Model/otpModel");
const send = require("../EmailSender/send");
const { isValid, isValidEmail } = require("../Config/function");

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for forgot password
const sendForgotPasswordOTP = async (req, res) => {
  try {


    const { email, userType } = req.body;

    // Validation
    if (!isValid(email)) {
      return res.status(400).json({ error: "Please enter your email!" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email!" });
    }
    if (!userType || !['jobseeker', 'employer'].includes(userType)) {
      return res.status(400).json({ error: "Please specify user type (jobseeker or employer)!" });
    }


    // Check if user exists based on userType
    let user;
    if (userType === 'jobseeker') {
      user = await userModel.findOne({ 
        email: { $regex: new RegExp(`^${email.toLowerCase()}`, 'i') }, 
        isDelete: false 
      });
      console.log("Jobseeker search result:", user ? "Found" : "Not found");
    } else {
      user = await employerModel.findOne({ 
        email: { $regex: new RegExp(`^${email.toLowerCase()}`, 'i') }, 
        isDelete: false 
      });
      console.log("Employer search result:", user ? "Found" : "Not found");
    }

    if (!user) {
  
      
      // Check if email exists in the other user type
      let otherUserType = userType === 'jobseeker' ? 'employer' : 'jobseeker';
      let otherUser;
      
      if (userType === 'jobseeker') {
        otherUser = await employerModel.findOne({ 
          email: { $regex: new RegExp(`^${email.toLowerCase()}`, 'i') }, 
          isDelete: false 
        });
      } else {
        otherUser = await userModel.findOne({ 
          email: { $regex: new RegExp(`^${email.toLowerCase()}`, 'i') }, 
          isDelete: false 
        });
      }
      
      if (otherUser) {
        return res.status(404).json({ 
          error: `This email is registered as a ${otherUserType}, not a ${userType}. Please select "${otherUserType === 'jobseeker' ? 'Job Seeker' : 'Employer'}" and try again.`,
          suggestion: `Try selecting "${otherUserType === 'jobseeker' ? 'Job Seeker' : 'Employer'}" instead.`
        });
      }
      
      return res.status(404).json({ 
        error: `No ${userType} account found with this email address. Please check your email and try again, or contact support if you believe this is an error.`
      });
    }



    // Check if user is blocked
    if (user.isBlock) {
      return res.status(403).json({ 
        error: "Your account is blocked. Please contact support." 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log("Generated OTP:", otp);

    // Delete any existing OTPs for this email and userType
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      userType, 
      purpose: 'forgot_password' 
    });

    // Save new OTP
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      userType,
      purpose: 'forgot_password'
    });

    // Send OTP via email
    const userName = user.fullName || user.name || 'User';
    const emailMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>You have requested to reset your password for your Labor Link ${userType} account.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #134083; margin: 0;">Your OTP Code:</h3>
          <h1 style="color: #134083; font-size: 32px; margin: 10px 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p><strong>Important:</strong></p>
        <ul>
          <li>This OTP is valid for <strong>10 minutes</strong> only</li>
          <li>Do not share this OTP with anyone</li>
          <li>If you didn't request this, please ignore this email</li>
        </ul>
        <p>If you need help, contact our support team.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email from Labor Link. Please do not reply to this email.
        </p>
        <h3>Thank you<br>Labor Link Team</h3>
      </div>
    `;

    await send.sendMail(userName, email, emailMessage);


    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email address",
      email: email,
      userType: userType,
      expiresIn: "10 minutes"
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({ 
      error: "Failed to send OTP. Please try again later." 
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {


    const { email, otp, userType } = req.body;

    // Validation
    if (!isValid(email)) {
      return res.status(400).json({ error: "Please enter your email!" });
    }
    if (!isValid(otp)) {
      return res.status(400).json({ error: "Please enter the OTP!" });
    }
    if (!userType || !['jobseeker', 'employer'].includes(userType)) {
      return res.status(400).json({ error: "Please specify user type!" });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      userType,
      purpose: 'forgot_password',
      isUsed: false
    }).sort({ createdAt: -1 }); // Get the latest OTP

    if (!otpRecord) {
      return res.status(400).json({ 
        error: "Invalid or expired OTP. Please request a new one." 
      });
    }

    // Check if OTP has expired (additional check)
    const now = new Date();
    const otpAge = (now - otpRecord.createdAt) / 1000 / 60; // in minutes
    if (otpAge > 10) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ 
        error: "OTP has expired. Please request a new one." 
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ 
        error: "Too many failed attempts. Please request a new OTP." 
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp.toString()) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      const remainingAttempts = 3 - otpRecord.attempts;
      return res.status(400).json({ 
        error: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
      });
    }

    // Mark OTP as verified but keep it for password reset verification
    otpRecord.isUsed = true;
    await otpRecord.save();



    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
      email: email,
      userType: userType
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ 
      error: "Failed to verify OTP. Please try again later." 
    });
  }
};

// Reset password directly with OTP verification
const resetPassword = async (req, res) => {
  try {


    const { email, newPassword, confirmPassword, userType } = req.body;

    // Validation
    if (!isValid(email)) {
      return res.status(400).json({ error: "Please enter your email!" });
    }
    if (!isValid(newPassword)) {
      return res.status(400).json({ error: "Please enter new password!" });
    }
    if (!isValid(confirmPassword)) {
      return res.status(400).json({ error: "Please confirm your password!" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match!" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long!" });
    }
    if (!userType || !['jobseeker', 'employer'].includes(userType)) {
      return res.status(400).json({ error: "Please specify user type!" });
    }

    // Check if there's a verified OTP for this email and userType (within last 15 minutes)
    const verifiedOTP = await OTP.findOne({
      email: email.toLowerCase(),
      userType,
      purpose: 'forgot_password',
      isUsed: true
    }).sort({ createdAt: -1 });

    if (!verifiedOTP) {
      return res.status(400).json({ 
        error: "No verified OTP found. Please verify your OTP first." 
      });
    }

    // Check if the verified OTP is still valid (within 15 minutes of verification)
    const now = new Date();
    const otpAge = (now - verifiedOTP.createdAt) / 1000 / 60; // in minutes
    if (otpAge > 15) {
      await OTP.deleteOne({ _id: verifiedOTP._id });
      return res.status(400).json({ 
        error: "OTP verification has expired. Please start the process again." 
      });
    }

    // Find user
    let user;
    if (userType === 'jobseeker') {
      user = await userModel.findOne({
        email: { $regex: new RegExp(`^${email.toLowerCase()}`, 'i') },
        isDelete: false
      });
    } else {
      user = await employerModel.findOne({
        email: { $regex: new RegExp(`^${email.toLowerCase()}`, 'i') },
        isDelete: false
      });
    }

    if (!user) {
      return res.status(404).json({ 
        error: "User not found!" 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    if (userType === 'jobseeker') {
      await userModel.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        confirmPassword: hashedPassword
      });
    } else {
      await employerModel.findByIdAndUpdate(user._id, {
        password: hashedPassword
      });
    }

    // Send confirmation email
    const userName = user.fullName || user.name || 'User';
    const confirmationMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Password Reset Successful</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Your password has been successfully reset for your Labor Link ${userType} account.</p>
        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p style="margin: 0; color: #155724;">
            <strong>✓ Password Updated Successfully</strong><br>
            Date: ${new Date().toLocaleString()}
          </p>
        </div>
        <p><strong>Security Tips:</strong></p>
        <ul>
          <li>Keep your password secure and don't share it with anyone</li>
          <li>Use a strong, unique password</li>
          <li>If you didn't make this change, contact support immediately</li>
        </ul>
        <p>You can now log in with your new password.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email from Labor Link. Please do not reply to this email.
        </p>
        <h3>Thank you<br>Labor Link Team</h3>
      </div>
    `;

    await send.sendMail(userName, email, confirmationMessage);

    // Clean up OTP records for this user
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      userType 
    });

    console.log("Password reset successfully");

    return res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
      userType: userType
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ 
      error: "Failed to reset password. Please try again later." 
    });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    console.log("🔄 Resend OTP function called");
    console.log("Request body:", req.body);
    
    const { email, userType } = req.body;

    // Validation
    if (!isValid(email)) {
      return res.status(400).json({ error: "Please enter your email!" });
    }
    if (!userType || !['jobseeker', 'employer'].includes(userType)) {
      return res.status(400).json({ error: "Please specify user type!" });
    }

    // Check rate limiting - allow resend only after 1 minute
    const recentOTP = await OTP.findOne({
      email: email.toLowerCase(),
      userType,
      purpose: 'forgot_password'
    }).sort({ createdAt: -1 });

    if (recentOTP) {
      const timeSinceLastOTP = (Date.now() - recentOTP.createdAt) / 1000; // in seconds
      if (timeSinceLastOTP < 60) { // 1 minute
        const waitTime = Math.ceil(60 - timeSinceLastOTP);
        return res.status(429).json({ 
          error: `Please wait ${waitTime} seconds before requesting a new OTP.` 
        });
      }
    }

    // Call sendForgotPasswordOTP directly
    return sendForgotPasswordOTP(req, res);

  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({ 
      error: "Failed to resend OTP. Please try again later." 
    });
  }
};

module.exports = {
  sendForgotPasswordOTP,
  verifyOTP,
  resetPassword,
  resendOTP
};