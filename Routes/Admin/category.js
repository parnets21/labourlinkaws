const express=require('express');
const router=express.Router();

const categoryController=require("../../Controller/Admin/category");

router.post("/addCategory",categoryController.addCategory);
router.get("/getAllCategory",categoryController.getAllCategory);
router.delete("/deleteCategory/:Id",categoryController.deleteCategory);
//subcategory
router.post("/addSubcategory",categoryController.addSubcategory);
router.get("/getAllSubCategory",categoryController.getAllSubCategory);
router.delete("/deleteSubCategory/:Id",categoryController.deleteSubCategory);

module.exports=router;