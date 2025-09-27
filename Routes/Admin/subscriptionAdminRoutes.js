const express = require('express');
const router = express.Router();
const subscriptionAdminController = require('../../Controller/Admin/subscriptionAdminController');

// Dashboard overview
router.get('/dashboard', subscriptionAdminController.getDashboard);

// User subscription management
router.get('/users', subscriptionAdminController.getUserSubscriptions);
router.put('/users/:subscriptionId', subscriptionAdminController.updateSubscriptionStatus);

// Transaction analytics
router.get('/analytics/transactions', subscriptionAdminController.getTransactionAnalytics);
router.get('/analytics/usage', subscriptionAdminController.getUsageAnalytics);
router.get('/analytics/plans', subscriptionAdminController.getPlanPerformance);

// Subscription flow visualization
router.get('/flow', subscriptionAdminController.getSubscriptionFlow);

module.exports = router;
