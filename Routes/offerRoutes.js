const express = require('express');
const offerController = require('../Controller/offerController');
const { validateSubscription } = require('../middileware/subscriptionValidationMiddleware');
const multer = require('multer');
// const authController = require('../Controller/authController');

const router = express.Router();

// Configure multer to use memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Protect all routes
// router.use(authController.protect);

// Get all applications for a job
router.get(
    '/applications/:jobId',
    // authController.restrictTo('employer', 'admin'),
    offerController.getApplyList
);

// Generate offer letter for selected candidate
router.post(
    '/generate/:applicationId',
    // authController.restrictTo('employer', 'admin'),
    upload.single('offerPDF'), // Add multer middleware to handle file upload
    validateSubscription('application_review', { checkUsage: true, usagePeriod: 'daily' }),
    offerController.generateOfferLetter
);

// Candidate responds to offer (accept/decline)
router.post(
    '/respond/:applicationId',
    // authController.restrictTo('employee'),
    offerController.respondToOffer
);

// Get offer letter details
router.get(
    '/details/:applicationId',
    offerController.getOfferLetter
);

// Get all selected candidates with offer letters for a job
router.get(
    '/selected/:jobId',
    // authController.restrictTo('employer', 'admin'),
    offerController.getSelectedCandidates
);

// Serve PDF files (static route)
router.get('/download/:applicationId', async (req, res) => {
    try {
        const path = require('path');
        const fs = require('fs').promises;

        // Check for custom PDF first
        const customPdfPath = path.join(__dirname, `../public/offers/${req.params.applicationId}_custom.pdf`);
        const generatedPdfPath = path.join(__dirname, `../public/offers/${req.params.applicationId}.pdf`);

        let filePath;
        try {
            await fs.access(customPdfPath);
            filePath = customPdfPath;
            console.log('📥 Serving custom PDF:', filePath);
        } catch {
            // Custom PDF doesn't exist, try generated PDF
            await fs.access(generatedPdfPath);
            filePath = generatedPdfPath;
            console.log('📥 Serving generated PDF:', filePath);
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="offer-letter-${req.params.applicationId}.pdf"`);
        res.sendFile(filePath);

    } catch (error) {
        console.error('❌ PDF not found:', error);
        res.status(404).json({
            success: false,
            message: 'Offer letter not found'
        });
    }
});


module.exports = router;