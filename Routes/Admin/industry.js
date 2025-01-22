const express=require('express');
const router=express.Router();

const industryController=require("../../Controller/Admin/industry");


router.post("/addIndustry",industryController.addIndustry);
router.get("/getAllIndustry",industryController.getAllIndustry);
router.delete("/deleteIndustry/:Id",industryController.deleteIndustry);


module.exports=router;