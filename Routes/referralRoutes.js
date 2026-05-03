const express = require('express');
const referralController = require('../Controller/referralController');
const authController = require('../Controller/authController');

const router = express.Router();

router.use(authController.protect);

// Get user's referral code
router.get('/code', referralController.getReferralCode);

// Validate referral code
router.get('/validate/:referralCode', referralController.validateReferralCode);

// Create referral by code
router.post('/apply-code', referralController.createReferralByCode);

// Get referral statistics
router.get('/stats', referralController.getReferralStats);

// Get referral history
router.get('/history', referralController.getReferralHistory);

// Send referral invitation via email
router.post('/invite', referralController.sendReferralInvitation);

// Process referral bonus (admin only)
router.post(
    '/process-bonus/:referralId',
    authController.restrictTo('admin'),
    referralController.processReferralBonus
);

module.exports = router;
