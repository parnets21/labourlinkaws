const otpModel = require("../../Model/User/otp");
const userModel = require("../../Model/User/user");
const send = require("../../EmailSender/send");

class RegistrationOtp {
  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP for registration verification via WhatsApp
  async sendRegistrationOTP(req, res) {
    try {
      const { mobile } = req.body;

      if (!mobile) {
        return res.status(400).json({ 
          success: false, 
          error: "Mobile number is required" 
        });
      }

      // Format mobile number
      const formattedMobile = String(mobile).replace(/\D/g, '');

      // Check if user already exists with this phone
      const existingUser = await userModel.findOne({ 
        phone: formattedMobile, 
        isDelete: false 
      });

      if (existingUser) {
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

      // Send OTP via WhatsApp
      try {
        await send.sendRegistrationOTPWhatsapp(formattedMobile, otp);
        console.log(`Registration OTP ${otp} sent to ${formattedMobile}`);
      } catch (whatsappError) {
        console.error("Failed to send WhatsApp OTP:", whatsappError);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to send OTP. Please try again." 
        });
      }

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully to your WhatsApp",
        mobile: formattedMobile
      });

    } catch (err) {
      console.error("Error in sendRegistrationOTP:", err);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  }

  // Verify OTP for registration
  async verifyRegistrationOTP(req, res) {
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
      console.error("Error in verifyRegistrationOTP:", err);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  }

  // Resend OTP
  async resendRegistrationOTP(req, res) {
    try {
      const { mobile } = req.body;

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

      // Send OTP via WhatsApp
      try {
        await send.sendRegistrationOTPWhatsapp(formattedMobile, otp);
        console.log(`Registration OTP ${otp} resent to ${formattedMobile}`);
      } catch (whatsappError) {
        console.error("Failed to resend WhatsApp OTP:", whatsappError);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to send OTP. Please try again." 
        });
      }

      return res.status(200).json({
        success: true,
        message: "OTP resent successfully to your WhatsApp",
        mobile: formattedMobile
      });

    } catch (err) {
      console.error("Error in resendRegistrationOTP:", err);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  }

  // Check if phone is verified (for registration flow)
  async checkPhoneVerification(req, res) {
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
      console.error("Error in checkPhoneVerification:", err);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  }
}

const registrationOtpController = new RegistrationOtp();
module.exports = registrationOtpController;
