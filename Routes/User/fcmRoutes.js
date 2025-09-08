const express = require("express");
const router = express.Router(); 
const fcm = require ("../../Controller/User/fcmController");


router.post("/fcmToken", fcm.sendNotificationToEmployee);
router.post("/update-token" , fcm.updateFCMToken )

module.exports = router; 

