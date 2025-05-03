const express = require("express");
const router = express.Router();
const multer = require("multer");
const userchatboxController = require("../../Controller/User/chatbox");

// Use memory storage for S3 uploads
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.post("/addchat",upload.any(), userchatboxController.addchat);

router.get("/getchat/:senderId/:recieverId", userchatboxController.getchat);
router.get("/chatsseen/:userId/:recieverId", userchatboxController.chatsseen);
//like as notification
router.get('/getUnSeenChat/:userId',userchatboxController.getUnSeenchat);
router.post("/postdeletechat/:chatId", userchatboxController.deletechat);

module.exports = router;
