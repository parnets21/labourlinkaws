const express = require('express');
const router = express.Router();
const iapController = require('../Controller/iapController');

/**
 * IAP Routes for iOS In-App Purchases
 * Complete feature parity with PhonePe integration
 */

// ============================================
// PURCHASE & ACTIVATION (mirrors PhonePe payment creation)
// ============================================

// Validate IAP receipt with Apple
router.post('/validateIAPReceipt', iapController.validateIAPReceipt);

// Activate subscription after successful IAP purchase (mirrors PhonePe payment processing)
router.post('/activateIAPSubscription', iapController.activateSubscription);

// ============================================
// SUBSCRIPTION MANAGEMENT (mirrors PhonePe transaction management)
// ============================================

// Get user's subscription history (mirrors PhonePe transaction history)
router.get('/subscriptions/:userId', iapController.getUserSubscriptions);

// Get active IAP subscriptions for a user
router.get('/iap/active/:userId', iapController.getActiveIAPSubscriptions);

// Refresh user's subscription status (mirrors PhonePe status check)
router.post('/subscriptions/:userId/refresh', iapController.refreshUserSubscriptions);

// ============================================
// WEBHOOKS & CALLBACKS (mirrors PhonePe callback)
// ============================================

// Apple Server-to-Server webhook (mirrors PhonePe payment callback)
router.post('/iap/webhook', iapController.handleAppleWebhook);

// ============================================
// REPORTING & ANALYTICS (mirrors PhonePe reports)
// ============================================

// Get IAP transaction report (mirrors PhonePe payment report)
router.get('/iap/report', iapController.getIAPReport);

module.exports = router;
