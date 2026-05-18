const express = require("express");
const router = express.Router();
const userController = require("../../Controller/User/user");
const messageController = require('../../Controller/User/messageController');
const registrationOtpController = require("../../Controller/User/registrationOtp");

const multer = require("multer");

// Configure multer to use memory storage for S3 uploads
const storage = multer.memoryStorage();

// Use memory storage for routes that will use S3
const upload = multer({ storage: storage });

// Keep the local disk storage for any routes that still need it
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "Public/user"); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname); // Generate unique filename
    },
});

const diskUpload = multer({ storage: diskStorage });

router.post("/register", userController.register);

// Registration OTP routes
router.post("/sendRegistrationOTP", registrationOtpController.sendRegistrationOTP.bind(registrationOtpController));
router.post("/verifyRegistrationOTP", registrationOtpController.verifyRegistrationOTP.bind(registrationOtpController));
router.post("/resendRegistrationOTP", registrationOtpController.resendRegistrationOTP.bind(registrationOtpController));
router.get("/checkPhoneVerification/:mobile", registrationOtpController.checkPhoneVerification.bind(registrationOtpController));

router.post('/uploadResumeRegister', upload.single('resume'), userController.registerFromResume);
router.post("/userlogin", userController.login);
router.post("/changePassword", userController.changePassword);
router.put('/updateProfileImg/:userId', upload.any(), userController.updateProfileImg);
const { validateSubscription } = require('../../middileware/subscriptionValidationMiddleware');
router.put('/editUser/:id', validateSubscription('profile_update', { checkUsage: true, usagePeriod: 'monthly' }), userController.editUser);
router.put('/updateResume/:userId', upload.any(), userController.updateResume);
// Alias route expected by mobile app
router.put('/updateProfile/:userId', validateSubscription('profile_update', { checkUsage: true, usagePeriod: 'monthly' }), (req, res, next) => {
  // Map params to match editUser signature
  req.params.id = req.params.userId;
  return userController.editUser(req, res, next);
});
// router.put("/editProfile", upload.any(), userController.editProfile);
router.post("/AddEducation", userController.addEducation);
router.delete(
  "/removeEducation/:userId/:removeId",
  userController.removeEducation
);
router.post("/addsKill",userController.addSkill)
router.delete("/removeSkill/:userId/:removeId",userController.removeSkill)
router.get("/getUserById/:userId", userController.getUserById);
router.get("/getAllProfile", userController.getAllProfile);
router.post("/deleteProfile", userController.deleteProfile);
router.post("/addWorkExperience", userController.addWorkExperience);
router.delete(
  "/removeWorkExperience/:userId/:removeId",
  userController.removeWorkExperience
);
router.post("/makeBlockUnBlockEmployee",userController.makeBlockUnBlock)
router.delete('/deleteProfileParmanet/:userId',userController.deleteProfileParmanet);

//apply form for company with subscription validation
router.post(
  "/applyForJob",
  validateSubscription('apply_job', { checkUsage: true }),
  userController.applyNow
);
router.get("/getlistOfaplly", userController.getAllApplyCompanyList);

router.get("/getlistofinterviewscedule", userController.getlistofinterviewscedule);
router.get("/getAllScheduledInterviews", userController.getlistofinterviewscedule);
router.post("/ADDinterviewscedule", userController.scheduleInterview);

router.get("/getlistOOfaplly/:userId", userController.getApplyCompanyList);
// router.get("/getlistOfAccep/:userId", userController.getApplyCompanyList);
router.get("/rejectApply/:userId", userController.rejectApply);
router.post("/forgetPassword",userController.postmail);
router.post("/makEverifyUnverifyEmployee",userController.makEverifyUnverify);
// Get all messages for a specific user
router.get('/messages', messageController.getAllMessages);

// Create a new message
router.post('/messages', messageController.createMessage);

// Get a specific message (Only for the receiver)
router.get('/messages/:id', messageController.getMessage);

// Mark a message as read (Only for the receiver)
router.put('/messages/:id/read', messageController.markAsRead);

// Delete a message (Only for the receiver)
router.delete('/messages/:id', messageController.deleteMessage);

// Subscription routes
router.post('/activateSubscription', userController.activateSubscription);
router.post('/updateSubscription', userController.updateSubscription);
router.get('/subscriptions/:userId', userController.getUserSubscriptions);

// Debug routes
router.get('/debug/:userId', userController.debugUser);
router.get('/checkSubscription/:userId', userController.checkUserSubscription);

// Check if user has already applied for a job
router.get('/checkApplication', userController.checkApplication);

// Industry routes (for admin panel access)
router.get('/industries', userController.getAllIndustries);
router.post('/add-industry', userController.addIndustry);
router.delete('/delete-industry/:id', userController.deleteIndustry);

// Subcategory routes
router.post('/add-subcategory/:industryId', userController.addSubcategory);
router.put('/update-subcategory/:industryId/:subcategoryId', userController.updateSubcategory);
router.delete('/delete-subcategory/:industryId/:subcategoryId', userController.deleteSubcategory);

module.exports = router;