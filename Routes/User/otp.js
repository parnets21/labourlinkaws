const express = require("express");
const router = express.Router();
const otpController=require("../../Controller/User/otp")


router.post("/sendotp", otpController.sendSmsotp);
router.post("/verifyotp", otpController.verifyotp);

module.exports = router;