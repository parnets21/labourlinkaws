const express=require('express');
const router=express.Router();
const multer = require("multer");
const notificationController=require("../../Controller/Admin/notification");



router.post("/addnotification",notificationController.addnotification);
router.get("/getnotification",notificationController.getnotification);
router.delete("/deletenotification/:Id",notificationController.deletenotification);
module.exports=router;