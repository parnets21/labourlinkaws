const express = require("express");
const router = express.Router();
const employerController=require("../../Controller/Employers/employers")
const multer = require("multer");

// Use memory storage for S3 uploads
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });
router.post("/registerEmployer", employerController.registerEmployer);
router.put("/UpdateEmployerImg/:userId", upload.any(),employerController.UpdateEmployerImg);
router.post("/loginEmployer", employerController.login);
router.get("/employer/:employerId",employerController.getEmployerProfile);
router.get("/Postedjobs/:employerId", employerController.getJobsByEmployer);
router.put("/editProfileEmployer",employerController.editProfile);
router.post("/AddEducationEmployer",employerController.AddEducation);
router.delete("/removeEducationEmployer/:userId/:removeId",employerController.removeEducation);
router.get("/getAllProfileEmployer",employerController.getAllProfile);
router.patch("/approve-employer/:employerId", employerController.toggleEmployerApproval);
router.get('/check-approval-status/:userId', employerController.checkApprovalStatus);

router.delete("/deleteProfileEmployer",employerController.deleteProfile);
router.post("/addWorkExperienceEmployer",employerController.addWorkExperience);
router.delete("/removeWorkExperienceEmployer/:removeId/:userId",employerController.removeWorkExperience);
router.get("/getEmployerById/:employerId",employerController.getEmployerById)
router.post('/getUserByFillter',employerController.getUserByFilter);
router.delete("/deleteParmanetEmployer/:userId",employerController.deleteParmanet)


//apply form for company
router.post("/makeBlockUnBlockEmployer",employerController.makeBlockUnBlock)

router.post("/callinterview",employerController.callinterview)
router.get("/getAlllScheduledInterviews",employerController.getAllScheduledInterviews)
router.get("/getcallinterview/:employerId/:companyId",employerController.getcallinterview);
router.put('/updateInterviewStatus/:interviewId', employerController.updateInterviewStatus);
router.post("/MakeIntrestedUser",employerController.MakeIntrestedUser);
router.get("/getInterestedUser/:employerId",employerController.getInterestedUser);
router.delete("/deleteIntrestById/:intrestId",employerController.deleteIntrestById);
router.post("/emaployerForgetPWD",employerController.postmail);
router.post("/checkApproval",employerController.makEverifyUnverify)
module.exports = router;