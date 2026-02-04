const otpModel = require("../../Model/User/otp"); // Reusing the same OTP model
const employerModel = require("../../Model/Employers/employers");
const send = require("../../EmailSender/send");

class EmployerRegistrationOtp {
  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP for employer registration verification via SMS, Email, and WhatsApp
  async sendEmployerRegistrationOTP(req, res) {
    try {
      const { mobile, email, name } = req.body;

      console.log("=== EMPLOYER OTP REQUEST DEBUG ===");
      console.log("Request body:", req.body);
      console.log("Mobile:", mobile);
      console.log("Email:", email);
      console.log("Name:", name);

      if (!mobile) {
        return res.status(400).json({ 
          success: false, 
          error: "Mobile number is required" 
        });
      }

      // Format mobile number
      const formattedMobile = String(mobile).replace(/\D/g, '');

      // Check if employer already exists with this phone
      const existingEmployer = await employerModel.findOne({ 
        mobile: formattedMobile, 
        isDelete: false 
      });

      if (existingEmployer) {
        return res.status(400).json({ 
          success: false, 
          error: "Phone number already registered. Please login instead." 
        });
      }

      // Generate OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      // Check if OTP already exists for this mobile
      let existingOtp = await otpModel.findOne({ mobile: formattedMobile });

      if (existingOtp) {
        // Update existing OTP
        existingOtp.otp = otp;
        existingOtp.expiresAt = expiresAt;
        existingOtp.verified = false;
        existingOtp.attempts = 0;
        await existingOtp.save();
      } else {
        // Create new OTP record
        await otpModel.create({
          mobile: formattedMobile,
          otp: otp,
          expiresAt: expiresAt,
          verified: false,
          attempts: 0
        });
      }

      // Send OTP via multiple channels
      const results = {
        sms: false,
        email: false,
        whatsapp: false
      };

      // 1. Send via SMS
      try {
        console.log("=== ATTEMPTING EMPLOYER SMS SEND ===");
        await send.sendRegistrationOTPSMS(formattedMobile, otp);
        results.sms = true;
        console.log(`Employer Registration OTP ${otp} sent via SMS to ${formattedMobile}`);
      } catch (smsError) {
        console.error("Failed to send SMS OTP:", smsError);
      }

      // 2. Send via Email (if email provided)
      if (email && email.trim() !== '') {
        try {
          console.log("=== ATTEMPTING EMPLOYER EMAIL SEND ===");
          console.log("Email parameters:", { name: name || 'Employer', email, otp });
          await send.sendRegistrationOTPEmail(name || 'Employer', email, otp);
          results.email = true;
          console.log(`Employer Registration OTP ${otp} sent via Email to ${email}`);
        } catch (emailError) {
          console.error("Failed to send Email OTP:", emailError);
          console.error("Email error details:", emailError.message);
        }
      } else {
        console.log("=== EMPLOYER EMAIL SKIPPED ===");
        console.log("Email not provided or empty:", email);
      }

      // 3. Send via WhatsApp
      try {
        console.log("=== ATTEMPTING EMPLOYER WHATSAPP SEND ===");
        await send.sendRegistrationOTPWhatsapp(formattedMobile, otp);
        results.whatsapp = true;
        console.log(`Employer Registration OTP ${otp} sent via WhatsApp to ${formattedMobile}`);
      } catch (whatsappError) {
        console.error("Failed to send WhatsApp OTP:", whatsappError);
      }

      // Check if at least one method succeeded
      const successCount = Object.values(results).filter(Boolean).length;
      
      console.log("=== EMPLOYER SEND RESULTS ===");
      console.log("Results:", results);
      console.log("Success count:", successCount);
      
      if (successCount === 0) {
        return res.status(500).json({ 
          success: false, 
          error: "Failed to send OTP via any method. Please try again." 
        });
      }

      // Prepare success message
      const sentMethods = [];
      if (results.sms) sentMethods.push('SMS');
      if (results.email) sentMethods.push('Email');
      if (results.whatsapp) sentMethods.push('WhatsApp');

      return res.status(200).json({
        success: true,
        message: `OTP sent successfully via ${sentMethods.join(', ')}`,
        mobile: formattedMobile,
        sentVia: results
      });

    } catch (err) {
      console.error("Error in sendEmployerRegistrationOTP:", err);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  }

  // Verify OTP for employer registration
  async verifyEmployerRegistrationOTP(req, res) {
    try {
      const { mobile, otp } = req.body;

      if (!mobile || !otp) {
        return res.status(400).json({ 
          success: false, 
          error: "Mobile number and OTP are required" 
        });
      }

      const formattedMobile = String(mobile).replace(/\D/g, '');

      // Find OTP record
      const otpRecord = await otpModel.findOne({ mobile: formattedMobile });

      if (!otpRecord) {
        return res.status(400).json({ 
          success: false, 
          error: "OTP not found. Please request a new OTP." 
        });
      }

      // Check if OTP is expired
      if (new Date() > otpRecord.expiresAt) {
        return res.status(400).json({ 
          success: false, 
          error: "OTP has expired. Please request a new OTP." 
        });
      }

      // Check attempts (max 3 attempts)
      if (otpRecord.attempts >= 3) {
        return res.status(400).json({ 
          success: false, 
          error: "Too many failed attempts. Please request a new OTP." 
        });
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
        // Increment attempts
        otpRecord.attempts += 1;
        await otpRecord.save();

        return res.status(400).json({ 
          success: false, 
          error: "Invalid OTP. Please try again.",
          attemptsRemaining: 3 - otpRecord.attempts
        });
      }

      // OTP verified successfully
      otpRecord.verified = true;
      await otpRecord.save();

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        verified: true,
        mobile: formattedMobile
      });

    } catch (err) {
      console.error("Error in verifyEmployerRegistrationOTP:", err);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  }

  // Resend OTP for employer registration
  async resendEmployerRegistrationOTP(req, res) {
    try {
      const { mobile, email, name } = req.body;

      if (!mobile) {
        return res.status(400).json({ 
          success: false, 
          error: "Mobile number is required" 
        });
      }

      const formattedMobile = String(mobile).replace(/\D/g, '');

      // Check if OTP was recently sent (rate limiting - 1 minute)
      const existingOtp = await otpModel.findOne({ mobile: formattedMobile });
      
      if (existingOtp) {
        const timeSinceLastOtp = Date.now() - new Date(existingOtp.updatedAt || existingOtp.createdAt).getTime();
        if (timeSinceLastOtp < 60000) { // 1 minute
          const waitTime = Math.ceil((60000 - timeSinceLastOtp) / 1000);
          return res.status(429).json({ 
            success: false, 
            error: `Please wait ${waitTime} seconds before requesting a new OTP` 
          });
        }
      }

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      if (existingOtp) {
        existingOtp.otp = otp;
        existingOtp.expiresAt = expiresAt;
        existingOtp.verified = false;
        existingOtp.attempts = 0;
        await existingOtp.save();
      } else {
        await otpModel.create({
          mobile: formattedMobile,
          otp: otp,
          expiresAt: expiresAt,
          verified: false,
          attempts: 0
        });
      }

      // Send OTP via multiple channels
      const results = {
        sms: false,
        email: false,
        whatsapp: false
      };

      // 1. Send via SMS
      try {
        await send.sendRegistrationOTPSMS(formattedMobile, otp);
        results.sms = true;
        console.log(`Employer Registration OTP ${otp} resent via SMS to ${formattedMobile}`);
      } catch (smsError) {
        console.error("Failed to resend SMS OTP:", smsError);
      }

      // 2. Send via Email (if email provided)
      if (email) {
        try {
          await send.sendRegistrationOTPEmail(name || 'Employer', email, otp);
          results.email = true;
          console.log(`Employer Registration OTP ${otp} resent via Email to ${email}`);
        } catch (emailError) {
          console.error("Failed to resend Email OTP:", emailError);
        }
      }

      // 3. Send via WhatsApp
      try {
        await send.sendRegistrationOTPWhatsapp(formattedMobile, otp);
        results.whatsapp = true;
        console.log(`Employer Registration OTP ${otp} resent via WhatsApp to ${formattedMobile}`);
      } catch (whatsappError) {
        console.error("Failed to resend WhatsApp OTP:", whatsappError);
      }

      // Check if at least one method succeeded
      const successCount = Object.values(results).filter(Boolean).length;
      
      if (successCount === 0) {
        return res.status(500).json({ 
          success: false, 
          error: "Failed to resend OTP via any method. Please try again." 
        });
      }

      // Prepare success message
      const sentMethods = [];
      if (results.sms) sentMethods.push('SMS');
      if (results.email) sentMethods.push('Email');
      if (results.whatsapp) sentMethods.push('WhatsApp');

      return res.status(200).json({
        success: true,
        message: `OTP resent successfully via ${sentMethods.join(', ')}`,
        mobile: formattedMobile,
        sentVia: results
      });

    } catch (err) {
      console.error("Error in resendEmployerRegistrationOTP:", err);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  }

  // Check if phone is verified for employer registration
  async checkEmployerPhoneVerification(req, res) {
    try {
      const { mobile } = req.params;

      if (!mobile) {
        return res.status(400).json({ 
          success: false, 
          error: "Mobile number is required" 
        });
      }

      const formattedMobile = String(mobile).replace(/\D/g, '');

      const otpRecord = await otpModel.findOne({ 
        mobile: formattedMobile,
        verified: true
      });

      return res.status(200).json({
        success: true,
        verified: !!otpRecord,
        mobile: formattedMobile
      });

    } catch (err) {
      console.error("Error in checkEmployerPhoneVerification:", err);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  }
}

const employerRegistrationOtpController = new EmployerRegistrationOtp();
module.exports = employerRegistrationOtpController;