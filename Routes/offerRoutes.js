const express = require('express');
const offerController = require('../Controller/offerController');
// const authController = require('../Controller/authController');

const router = express.Router();

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
        
        const filePath = path.join(__dirname, `../public/offers/${req.params.applicationId}.pdf`);
        
        // Check if file exists
        await fs.access(filePath);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="offer-letter-${req.params.applicationId}.pdf"`);
        res.sendFile(filePath);
        
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'Offer letter not found'
        });
    }
});


module.exports = router;