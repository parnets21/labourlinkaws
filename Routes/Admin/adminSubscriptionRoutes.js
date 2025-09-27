const express = require('express');
const router = express.Router();
const adminSubscriptionController = require('../../Controller/Admin/adminSubscriptionController');

// Dashboard overview - comprehensive subscription statistics
router.get('/dashboard', adminSubscriptionController.getDashboardOverview);

// User subscription management
router.get('/users', adminSubscriptionController.getUserSubscriptionDetails);
router.put('/users/:subscriptionId', adminSubscriptionController.updateUserSubscription);

// Usage analytics
router.get('/analytics/usage', adminSubscriptionController.getUsageAnalytics);

// Transaction analytics and management
router.get('/analytics/transactions', adminSubscriptionController.getTransactionAnalytics);

// Plan performance analytics
router.get('/analytics/plans', adminSubscriptionController.getPlanPerformance);

// Subscription flow visualization data
router.get('/flow', adminSubscriptionController.getSubscriptionFlow);

module.exports = router;
