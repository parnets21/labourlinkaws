const express=require('express');
const router=express.Router();
const multer = require("multer");
const graphController=require("../../Controller/Admin/graph");
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "Public/graph");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "_" + file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });
  
router.post("/addGraph",upload.any(),graphController.addGraph);
router.get("/getGraph",graphController.getGraph);
router.delete("/deleteGraph/:Id",graphController.deleteGraph);

// router.post("/addHeadingText",graphController.addHeadingText);
// router.get("/getHeadingText",graphController.getHeadingText);
// router.delete("/deleteHeadingText/:Id",graphController.deleteHeadingText);
module.exports=router;