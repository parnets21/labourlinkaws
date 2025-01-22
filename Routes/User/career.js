const express = require("express");
const router = express.Router();
const careerController=require('../../Controller/User/career')
const multer = require("multer");




var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Public/career");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/createCareer", upload.any(), careerController.careerAdd);
router.get("/getCareer", careerController.getCareer);

router.put("/updateCareer/:careerId",upload.any(),careerController.updateCareer);
router.delete("deleteCareer/:careerId",careerController.deleteCareer);

router.get("/getCareerByCategorey",careerController.getCareerByCategorey);

module.exports = router;
