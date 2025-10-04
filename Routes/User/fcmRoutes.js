const express = require("express");
const router = express.Router(); 
const fcm = require ("../../Controller/User/fcmController");




router.post("/fcmToken", fcm.sendNotificationToEmployee);
router.post("/update-token" , fcm.updateFCMToken )
router.post("/clear-token", fcm.clearFCMToken);
router.post("/bulk-notification", fcm.sendBulkNotification);
router.get("/token/:userId", fcm.getFCMTokenByUserId);
router.get("/all-tokens", fcm.getAllActiveTokens);
router.post("/reactivate-token", fcm.reactivateFCMToken);
router.delete("/delete-token", fcm.deleteFCMToken);
router.get("/stats", fcm.getFCMTokenStats);

module.exports = router; 

