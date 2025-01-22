const express = require("express");
const router = express.Router();
const subadminauthontroller = require("../../Controller/Admin/subadmin");
const multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Public/subadmin");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });
router.post("/signup", subadminauthontroller.SubAdminSignup);
router.get("/getallsubadmin", subadminauthontroller.GetAllSubadmin);
router.post("/deletesubadmin/:subadminid",  subadminauthontroller.deletesubadmin);
router.post("/subadminlogin",  subadminauthontroller.PostSubAdminlogin);
router.put("/udateSubAdmin",upload.any(),subadminauthontroller.udateSubAdmin);
router.post("/forgetPassword",subadminauthontroller.postmail);
module.exports = router;