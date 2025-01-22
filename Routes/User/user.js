const express = require("express");
const router = express.Router();
const userController = require("../../Controller/User/user");
const multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Public/user");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/register",upload.any(), userController.register);
router.post("/login", userController.login);

router.put("/editProfile", upload.any(), userController.editProfile);
router.post("/AddEducation", userController.AddEducation);
router.delete(
  "/removeEducation/:userId/:removeId",
  userController.removeEducation
);
router.post("/addsKill",userController.AddSkill)
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
router.get("/getlistOfaplly/:userId", userController.getApplyCompanyList);
router.get("/rejectApply/:userId", userController.rejectApply);
router.post("/forgetPassword",userController.postmail);
router.post("/makEverifyUnverifyEmployee",userController.makEverifyUnverify);
module.exports = router;