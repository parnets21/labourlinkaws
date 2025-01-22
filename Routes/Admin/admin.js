const express = require("express");
const router = express.Router();
const adminController=require("../../Controller/Admin/admin")
const multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Public/admin");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/register",upload.any(), adminController.register);
router.put("/editAdmin",upload.any(),adminController.editAdmin);
router.put("/changepassword",adminController.changepassword);
router.post("/login",adminController.login);

module.exports = router;