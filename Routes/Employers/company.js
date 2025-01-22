const express = require("express");
const router = express.Router();
const jobController=require("../../Controller/Employers/company")
const multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/home/univ/public_html/Public/company");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/registerCompany",upload.any(), jobController.register);
router.put("/editJob",upload.any(),jobController.editJob);
//get all job withiut filter
router.get("/getAllJobs",jobController.getAllJobs);
router.get("/getUnvarifiedList",jobController.getUnvarifiedList);
router.post("/AddSkillJ", jobController.AddSkillJ);
router.delete('/removeSkillJ/:employerId/:removeId',jobController.removeSkillJ);
router.post("/AddBenefits", jobController.AddBenefits);
router.delete('/removeBenefits/:employerId/:removeId',jobController.removeBenefits);
//get particular job details
router.get("/getJobById/:jobId",jobController.getJobById);
// get all job details by filter
router.post("/getJobByfilter",jobController.getJobByfilter);
// get job  today of thy day 
router.post("/getJobOfTheDay",jobController.jobOftheDay);
//delete job
router.delete("/deleteJob/:jobId",jobController.deleteJob);

// apply Api;
router.get("/getApplyList/:companyId",jobController.getApplyList);
router.post("/addShortList",jobController.addShortList);
router.post("/addSelect",jobController.addSelect);
router.get("/getSelectData/:companyId",jobController.getSelectData);
router.get("/getShortlistingData/:companyId",jobController.getShortlistingData);
router.post("/rejectApply",jobController.rejectApply);

//get unverify company
router.get("/unVerify",jobController.isVerify);
router.post("/makeVerifyUnverifyAdmin",jobController.makEverifyUnverify)
//make verify company
router.put('/makeVerify/:companyId',jobController.makeVerify)
router.put("/makeUnVerify/:companyId",jobController.makeUnVerify)
router.post("/makeBlockUnBlockCompany",jobController.makeBlockUnBlock)
router.get("/AllAplliedDetals",jobController.AllAplliedDetals)
router.get("/getJobByEmployerId/:employerId",jobController.getJobByEmployerId)
router.delete("/deleteApply/:applyId",jobController.deleteApply)
module.exports = router;