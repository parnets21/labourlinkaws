const express=require('express');
const router=express.Router();
const multer = require("multer");
const businessController=require("../../Controller/Admin/business");



router.post("/addbusiness",businessController.addbusiness);
router.get("/getbusiness",businessController.getbusiness);
router.delete("/deletebusiness/:Id",businessController.deletebusiness);
module.exports=router;