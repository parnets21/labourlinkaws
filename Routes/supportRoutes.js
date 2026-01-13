const express = require('express');
const { SupportController, upload, enquiryValidation } = require('../Controller/supportController');
const { authenticateToken } = require('../middileware/authMiddleware'); // Adjust path as needed

const router = express.Router();

// Public routes
router.post('/enquiry', upload.array('attachments', 5), enquiryValidation, SupportController.submitEnquiry);

// Protected routes (require authentication)
router.get('/enquiries', SupportController.getEnquiries); // Temporarily remove auth for testing
router.get('/enquiry/:id', authenticateToken, SupportController.getEnquiryById);
router.patch('/enquiry/:id/status', authenticateToken, SupportController.updateEnquiryStatus);
router.patch('/enquiry/:id', authenticateToken, SupportController.updateEnquiry); // General update endpoint
router.post('/enquiry/:id/response', authenticateToken, SupportController.addResponse);
router.get('/statistics', SupportController.getStatistics); // Temporarily remove auth for testing
router.get('/enquiries/export', authenticateToken, SupportController.exportEnquiries);

module.exports = router;