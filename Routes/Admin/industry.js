const express = require('express');
const router = express.Router();

const industryController = require("../../Controller/Admin/industry");

// Industry CRUD routes
router.post("/", industryController.addIndustry);                          // POST /api/admin/industries
router.get("/", industryController.getAllIndustry);                        // GET /api/admin/industries
router.get("/search", industryController.searchIndustries);                // GET /api/admin/industries/search
router.get("/:id", industryController.getIndustryById);                    // GET /api/admin/industries/:id
router.put("/:id", industryController.updateIndustry);                     // PUT /api/admin/industries/:id
router.delete("/:id", industryController.deleteIndustry);                  // DELETE /api/admin/industries/:id
router.get("/:id/categories", industryController.getIndustryCategories);   // GET /api/admin/industries/:id/categories

// Legacy routes for backward compatibility (can be removed after migration)
router.post("/addIndustry", industryController.addIndustry);
router.get("/getAllIndustry", industryController.getAllIndustry);
router.delete("/deleteIndustry/:Id", industryController.deleteIndustry);

module.exports = router;