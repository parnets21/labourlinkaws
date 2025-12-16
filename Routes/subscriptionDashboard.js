const express = require('express');
const router = express.Router();
const subscriptionDashboardController = require('../Controller/subscriptionDashboardController');

// Get comprehensive dashboard data
router.get('/:userId', subscriptionDashboardController.getDashboardData);

// Get payment history with analytics
router.get('/:userId/payments', subscriptionDashboardController.getPaymentHistory);

// Get usage analytics
router.get('/:userId/usage', subscriptionDashboardController.getUsageAnalytics);

module.exports = router;