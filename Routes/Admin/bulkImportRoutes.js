const express = require('express');
const router = express.Router();

const bulkImportController = require("../../Controller/Admin/bulkImportController");

// Bulk import route
router.post("/hierarchy", bulkImportController.bulkImportHierarchy);  // POST /api/admin/bulk-import/hierarchy

module.exports = router;
