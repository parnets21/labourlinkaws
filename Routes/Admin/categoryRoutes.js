const express = require('express');
const router = express.Router();

const categoryController = require("../../Controller/Admin/categoryController");

router.post("/", categoryController.addCategory);                                    // POST /api/admin/categories
router.get("/", categoryController.getAllCategories);                                // GET /api/admin/categories
router.get("/by-industry/:industryId", categoryController.getCategoriesByIndustry); // GET /api/admin/categories/by-industry/:industryId
router.get("/:id", categoryController.getCategoryById);                              // GET /api/admin/categories/:id
router.put("/:id", categoryController.updateCategory);                               // PUT /api/admin/categories/:id
router.delete("/:id", categoryController.deleteCategory);                            // DELETE /api/admin/categories/:id
router.get("/:id/subcategories", categoryController.getCategorySubCategories);       // GET /api/admin/categories/:id/subcategories

module.exports = router;
