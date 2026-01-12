const express=require('express');
const router=express.Router();

const industryController=require("../../Controller/Admin/industry");


router.post("/addIndustry",industryController.addIndustry);
router.get("/getAllIndustry",industryController.getAllIndustry);
router.delete("/deleteIndustry/:Id",industryController.deleteIndustry);

// Subcategory routes
router.post("/add-subcategory/:industryId", industryController.addSubcategory);
router.put("/update-subcategory/:industryId/:subcategoryId", industryController.updateSubcategory);
router.delete("/delete-subcategory/:industryId/:subcategoryId", industryController.deleteSubcategory);


module.exports=router;