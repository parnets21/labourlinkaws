const express = require("express");
const router = express.Router();
const multer = require("multer");
const resumeController = require("../../Controller/User/resume");

// Use memory storage for S3 uploads
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.post("/resumeRegister", resumeController.resumeRegister);
router.put("/editResume", upload.any(),resumeController.editResume);

router.put("/AddSkillR", resumeController.AddSkill);
router.delete('/removeSkillR/:userId/:removeId',resumeController.removeSkill);
router.put("/addlang", resumeController.addlang);
router.delete('/removelang/:userId/:removeId',resumeController.removelang);

router.put("/AddEducationR", resumeController.AddEducation);
router.delete('/removeEducationR/:userId/:removeId',resumeController.removeEducation);

router.put("/addWorkExperienceR", resumeController.addWorkExperience);
router.delete('/removeWorkExperienceR/:userId/:removeId',resumeController.removeWorkExperience);

router.put("/addProject", resumeController.addProject);
router.delete('/removeproject/:userId/:removeId',resumeController.removeproject);

router.put("/addSkiilSummery", resumeController.addSkiilSummery);
router.delete('/removeSkiilSummery/:userId/:removeId',resumeController.removeSkiilSummery);

// router.put("/addwebSiteAndSocialR", resumeController.addwebSiteAndSocial);
// router.delete('/removewebSiteAndSocialR/:userId/:removeId',resumeController.removewebSiteAndSocial);

// router.put("/addcustumsectionR", resumeController.addcustumsection);
// router.delete('/removecustumsectionR/:userId/:removeId',resumeController.removecustumsection);

// router.put("/addextraActiviesR", resumeController.addextraActivies);
// router.delete('/removeextraActiviesR/:userId/:removeId',resumeController.removeextraActivies);

router.put("/addCertificateR", resumeController.addCertificatel);
router.delete('/removeCertificateR/:userId/:removeId',resumeController.removeCertificate);


router.put("/addACHIEVEMENTSR", resumeController.addCourse);
router.delete('/removeACHIEVEMENTSR/:userId/:removeId',resumeController.removeCourse);

router.get('/getResumeByuser/:userId',resumeController.getResumeByuser);
router.delete('/deleteResume/:userId',resumeController.deleteResume);
router.get("/getAllResume", resumeController.getAllResume);

module.exports = router;
