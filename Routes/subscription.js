// const express = require('express');
// const router = express.Router();
// const subscriptionController = require('../Controller/subscription');

// router.post('/', subscriptionController.createSubscription);
// router.get('/', subscriptionController.getSubscriptions);
// router.get('/:id', subscriptionController.getSubscription);
// router.put('/:id', subscriptionController.updateSubscription);
// router.delete('/:id', subscriptionController.deleteSubscription);

// module.exports = router;





const express = require('express');
const router = express.Router();
const subscriptionController = require('../Controller/subscription');

// POST /api/subscriptions - Create new subscription
router.post('/', subscriptionController.createSubscription);

// GET /api/subscriptions - Get all subscriptions
router.get('/', subscriptionController.getSubscriptions);

// GET /api/subscriptions/featured - Get featured subscriptions
router.get('/featured', subscriptionController.getFeaturedSubscriptions);

// GET /api/subscriptions/analytics - Get subscription analytics
router.get('/analytics', subscriptionController.getSubscriptionAnalytics);

// GET /api/subscriptions/compare - Compare subscriptions
router.get('/compare', subscriptionController.compareSubscriptions);

// GET /api/subscriptions/:id - Get single subscription
router.get('/:id', subscriptionController.getSubscription);

// PUT /api/subscriptions/:id - Update subscription
router.put('/:id', subscriptionController.updateSubscription);

// DELETE /api/subscriptions/:id - Delete subscription
router.delete('/:id', subscriptionController.deleteSubscription);

module.exports = router;