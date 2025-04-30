const express = require("express");
const router = express.Router();
const adminController=require("../../Controller/Admin/admin")
const subadminInterview=require("../../Model/Admin/subadminInterview")
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
router.post("/subadminlogin" ,adminController.subadminlogininterview)

/// interview slot schedule
router.post('/Addslot', adminController.createAppointment);
router.get('/getslot', adminController.getAppointments);
router.get('/getslotbyid/:id', adminController.getAppointmentById);
router.delete('/deleteslot/:id', adminController.deleteAppointment);
//inter view feedback 
router.post('/Createfeedback', adminController.createFeedback);
router.get('/getFeedback', adminController.getAllFeedback);
router.post('/sendnotification', adminController.sendNotification);

module.exports = router;