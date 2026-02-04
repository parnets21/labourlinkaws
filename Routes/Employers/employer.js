const express = require("express");
const router = express.Router();
const employerController = require("../../Controller/Employers/employers")
const employerRegistrationOtpController = require("../../Controller/Employers/employerRegistrationOtp");
const multer = require("multer");
const { validateSubscription } = require('../../middileware/subscriptionValidationMiddleware');
const send = require("../../EmailSender/send");

const upload = multer();

// Test email configuration endpoint
router.get("/test-email", async (req, res) => {
  try {
    console.log("=== TESTING EMAIL CONFIGURATION ===");
    const result = await send.testEmailConfiguration();
    
    if (result) {
      res.status(200).json({
        success: true,
        message: "Email configuration is working correctly",
        testResult: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Email configuration failed",
        testResult: result
      });
    }
  } catch (error) {
    console.error("Email test error:", error);
    res.status(500).json({
      success: false,
      message: "Email test failed",
      error: error.message
    });
  }
});

// Employer Registration OTP routes
router.post("/sendEmployerRegistrationOTP", employerRegistrationOtpController.sendEmployerRegistrationOTP.bind(employerRegistrationOtpController));
router.post("/verifyEmployerRegistrationOTP", employerRegistrationOtpController.verifyEmployerRegistrationOTP.bind(employerRegistrationOtpController));
router.post("/resendEmployerRegistrationOTP", employerRegistrationOtpController.resendEmployerRegistrationOTP.bind(employerRegistrationOtpController));
router.get("/checkEmployerPhoneVerification/:mobile", employerRegistrationOtpController.checkEmployerPhoneVerification.bind(employerRegistrationOtpController));

// Existing employer routes
router.post("/registerEmployer", employerController.registerEmployer);
router.put("/UpdateEmployerImg/:userId", upload.single('EmployerImg'), employerController.UpdateEmployerImg);
router.post("/loginEmployer", employerController.login);
router.get("/employer/:employerId", employerController.getEmployerProfile);
router.get("/Postedjobs/:employerId", employerController.getJobsByEmployer);
router.put("/editProfileEmployer", employerController.editProfile);
router.post("/AddEducationEmployer", employerController.AddEducation);
router.delete("/removeEducationEmployer/:userId/:removeId", employerController.removeEducation);
router.get("/getAllProfileEmployer", employerController.getAllProfile);
router.patch("/approve-employer/:employerId", employerController.toggleEmployerApproval);
router.get('/check-approval-status/:userId', employerController.checkApprovalStatus);

router.delete("/deleteProfileEmployer", employerController.deleteProfile);
router.post("/addWorkExperienceEmployer", employerController.addWorkExperience);
router.delete("/removeWorkExperienceEmployer/:removeId/:userId", employerController.removeWorkExperience);
router.get("/getEmployerById/:employerId", employerController.getEmployerById)
router.post('/getUserByFillter', employerController.getUserByFilter);
router.delete("/deleteParmanetEmployer/:userId", employerController.deleteParmanet)


//apply form for company
router.post("/makeBlockUnBlockEmployer", employerController.makeBlockUnBlock)

router.post("/callinterview", validateSubscription('interview_schedule_employer', { checkUsage: true, usagePeriod: 'daily' }), employerController.callinterview)
router.get("/getAllScheduledInterviews", employerController.getAllScheduledInterviews)
router.get("/getcallinterview/:employerId/:companyId", employerController.getcallinterview);
router.put('/updateInterviewStatus/:interviewId', employerController.updateInterviewStatus);
router.put('/updateInterviewScheduleStatus/:interviewId', employerController.updateInterviewScheduleStatus);
router.post("/MakeIntrestedUser", employerController.MakeIntrestedUser);
router.get("/getInterestedUser/:employerId", employerController.getInterestedUser);
router.delete("/deleteIntrestById/:intrestId", employerController.deleteIntrestById);
router.post("/emaployerForgetPWD", employerController.postmail);
router.post("/checkApproval", employerController.makEverifyUnverify)
module.exports = router;