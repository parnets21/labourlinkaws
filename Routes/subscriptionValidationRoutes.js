const express = require('express');
const router = express.Router();
const subscriptionValidationController = require('../Controller/subscriptionValidationController');
const { validateSubscription, requireActiveSubscription, requireFeature } = require('../middileware/subscriptionValidationMiddleware');

// Get user's subscription status and limits
router.get('/status/:userId', subscriptionValidationController.getSubscriptionStatus);

// Validate specific action
router.post('/validate/:userId/:action', subscriptionValidationController.validateAction);

// Validate multiple actions at once
router.post('/validate-multiple/:userId', subscriptionValidationController.validateMultipleActions);

// Get current usage statistics
router.get('/usage/:userId', subscriptionValidationController.getCurrentUsage);

// Get available actions for user
router.get('/actions/:userId', subscriptionValidationController.getAvailableActions);

// Get subscription recommendations
router.post('/recommendations/:userId', subscriptionValidationController.getRecommendations);

// Record action usage
router.post('/record-usage', subscriptionValidationController.recordUsage);

// Example protected routes using middleware

// Job application route (requires subscription validation)
router.post('/protected/apply-job', 
  validateSubscription('apply_job', { checkUsage: true }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Job application allowed',
      subscription: req.userSubscription,
      remainingUsage: req.remainingUsage
    });
  }
);

// Job posting route (requires active subscription)
router.post('/protected/post-job',
  requireActiveSubscription,
  validateSubscription('post_job', { checkUsage: true }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Job posting allowed',
      subscription: req.userSubscription,
      remainingUsage: req.remainingUsage
    });
  }
);

// Premium feature route (requires specific feature)
router.get('/protected/premium-analytics',
  requireFeature('advancedAnalytics'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Premium analytics access granted',
      subscription: req.userSubscription
    });
  }
);

// Candidate search route
router.post('/protected/search-candidates',
  validateSubscription('search_candidates', { checkUsage: true, usagePeriod: 'daily' }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Candidate search allowed',
      subscription: req.userSubscription,
      remainingUsage: req.remainingUsage
    });
  }
);

module.exports = router;
