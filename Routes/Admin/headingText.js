const express=require('express');
const router=express.Router();
const multer = require("multer");
const headingTextController=require("../../Controller/Admin/headingText");



router.post("/addHeadingText",headingTextController.addHeadingText);
router.get("/getHeadingText",headingTextController.getHeadingText);
router.delete("/deleteHeadingText/:Id",headingTextController.deleteHeadingText);
module.exports=router;