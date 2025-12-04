const express = require('express');
const router = express.Router();
const iapController = require('../Controller/iapController');

/**
 * IAP Routes for iOS In-App Purchases
 */

// Validate IAP receipt with Apple
router.post('/validateIAPReceipt', iapController.validateIAPReceipt);

// Activate subscription after successful purchase
router.post('/activateSubscription', iapController.activateSubscription);

// Get user's subscriptions
router.get('/subscriptions/:userId', iapController.getUserSubscriptions);

// Apple Server-to-Server webhook
router.post('/iap/webhook', iapController.handleAppleWebhook);

module.exports = router;
