const express = require("express");
const router = express.Router();
const employerController=require("../../Controller/Employers/employers")
const multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/home/univ/public_html/Public/employer");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/registerEmployer", employerController.registerEmployer);
router.post("/loginEmployer", employerController.login);


router.put("/editProfileEmployer",upload.any(),employerController.editProfile);
router.post("/AddEducationEmployer",employerController.AddEducation);
router.delete("/removeEducationEmployer/:userId/:removeId",employerController.removeEducation);
router.get("/getAllProfileEmployer",employerController.getAllProfile);
router.delete("/deleteProfileEmployer",employerController.deleteProfile);
router.post("/addWorkExperienceEmployer",employerController.addWorkExperience);
router.delete("/removeWorkExperienceEmployer/:removeId/:userId",employerController.removeWorkExperience);
router.get("/getEmployerById/:employerId",employerController.getEmployerById)
router.post('/getUserByFillter',employerController.getUserByFilter);
router.delete("/deleteParmanetEmployer/:userId",employerController.deleteParmanet)
//apply form for company
router.post("/makeBlockUnBlockEmployer",employerController.makeBlockUnBlock)
router.post("/callinterview",employerController.callinterview)
router.post("/MakeIntrestedUser",employerController.MakeIntrestedUser);
router.get("/getInterestedUser/:employerId",employerController.getInterestedUser);
router.get("/getcallinterview/:employerId",employerController.getcallinterview);
router.delete("/deleteIntrestById/:intrestId",employerController.deleteIntrestById);
router.post("/emaployerForgetPWD",employerController.postmail);
router.post("/makeVerifyUnverify",employerController.makEverifyUnverify)
module.exports = router;