const express = require("express");
const router = express.Router();
const templateController = require("../Controller/template");


const multer = require("multer");

// Configure multer to use memory storage for S3 uploads
const storage = multer.memoryStorage();

// Use memory storage for routes that will use S3
const upload = multer({ storage: storage });

// Keep the local disk storage for any routes that still need it
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "Public/user"); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname); // Generate unique filename
    },
});

// Routes
router.post("/", upload.any(), templateController.createTemplate);
router.get("/", templateController.getAllTemplates);
router.put("/:id", upload.any(), templateController.updateTemplate);
router.delete("/:id", templateController.deleteTemplate);

module.exports = router;
