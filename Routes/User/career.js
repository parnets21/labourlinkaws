const express = require("express");
const router = express.Router();
const careerController=require('../../Controller/User/career')
const multer = require("multer");

// Use memory storage for S3 uploads
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.post("/createCareer", upload.any(), careerController.careerAdd);
router.get("/getCareer", careerController.getCareer);

router.put("/updateCareer/:careerId",upload.any(),careerController.updateCareer);
router.delete("deleteCareer/:careerId",careerController.deleteCareer);

router.get("/getCareerByCategorey",careerController.getCareerByCategorey);

module.exports = router;
