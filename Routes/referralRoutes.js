const express = require('express');
const router = express.Router();
const referralController = require('../Controller/referralController');
const { protect } = require('../Controller/authController');

// Public routes (no auth required)
router.get('/validate/:code', referralController.validateReferralCode);
router.get('/settings', referralController.getReferralSettings);

// User routes (require authentication)
router.get('/code', protect, referralController.getReferralCode);
router.post('/create-by-code', protect, referralController.createReferralByCode);
router.get('/stats', protect, referralController.getReferralStats);
router.get('/history', protect, referralController.getReferralHistory);

module.exports = router;
