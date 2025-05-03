const express = require("express");
const router = express.Router();
const userController = require("../../Controller/User/user");
const messageController = require('../../Controller/User/messageController');

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
router.post("/userlogin", userController.login);
router.put('/updateProfileImg/:userId', upload.any(), userController.updateProfileImg);
router.put('/editUser/:id', userController.editUser);
router.put('/updateResume/:userId', upload.any(), userController.updateResume);
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

//apply form for company
router.post("/applyForJob", userController.applyNow);
router.get("/getlistOfaplly", userController.getAllApplyCompanyList);

router.get("/getlistofinterviewscedule", userController.getlistofinterviewscedule);
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

module.exports = router;