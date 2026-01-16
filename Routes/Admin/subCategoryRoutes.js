const express = require('express');
const router = express.Router();

const subCategoryController = require("../../Controller/Admin/subCategoryController");

// SubCategory CRUD routes
router.post("/", subCategoryController.addSubCategory);                                      // POST /api/admin/subcategories
router.get("/", subCategoryController.getAllSubCategories);                                  // GET /api/admin/subcategories
router.get("/by-category/:categoryId", subCategoryController.getSubCategoriesByCategory);   // GET /api/admin/subcategories/by-category/:categoryId
router.get("/:id", subCategoryController.getSubCategoryById);                                // GET /api/admin/subcategories/:id
router.put("/:id", subCategoryController.updateSubCategory);                                 // PUT /api/admin/subcategories/:id
router.delete("/:id", subCategoryController.deleteSubCategory);                              // DELETE /api/admin/subcategories/:id

// Cuisine association routes
router.post("/:id/cuisines", subCategoryController.addCuisineToSubCategory);                 // POST /api/admin/subcategories/:id/cuisines
router.delete("/:id/cuisines/:cuisineId", subCategoryController.removeCuisineFromSubCategory); // DELETE /api/admin/subcategories/:id/cuisines/:cuisineId

module.exports = router;
