const SubscriptionValidationService = require('../services/subscriptionValidationService');

/**
 * Robust helper to extract userId from request with optional priority for employerId
 */
const extractUserId = (req, prioritizeEmployer = false) => {
  if (prioritizeEmployer) {
    return req.headers['x-employer-id'] ||
      req.headers['x-user-id'] ||
      req.body.employerId ||
      req.query.employerId ||
      req.params.employerId ||
      req.body.userId ||
      req.query.userId ||
      req.query.id ||
      req.params.userId ||
      req.params.id ||
      req.user?.id ||
      req.user?._id;
  }

  return req.headers['x-user-id'] ||
    req.user?.id ||
    req.user?._id ||
    req.body.userId ||
    req.body.employerId ||
    req.query.employerId ||
    req.query.userId ||
    req.query.id ||
    req.params.userId ||
    req.params.id;
};

/**
 * Middleware to validate subscription before allowing actions
 * @param {String} requiredAction - Action that requires validation
 * @param {Object} options - Additional options
 */
const validateSubscription = (requiredAction, options = {}) => {
  return async (req, res, next) => {
    try {
      // Employer-only actions that should prioritize employerId
      const employerActions = [
        'post_job',
        'search_candidates',
        'view_candidate_contact',
        'premium_job_posting',
        'candidate_database_access',
        'analytics_access',
        'bulk_messaging',
        'interview_schedule_employer',
        'application_review'
      ];

      const prioritizeEmployer = employerActions.includes(requiredAction);
      let userId = extractUserId(req, prioritizeEmployer);

      // Special case for apply_job
      if (!userId && requiredAction === 'apply_job') {
        userId = req.body.applicant || req.body.userId;
      }

      if (!userId) {
        console.log(`⚠️ No userId found in request for action: ${requiredAction}`);
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Get current usage if needed
      let currentUsage = {};
      if (options.checkUsage) {
        try {
          currentUsage = await SubscriptionValidationService.getCurrentUsage(userId, options.usagePeriod || 'monthly');
        } catch (usageError) {
          console.log('Warning: Could not fetch usage data:', usageError.message);
        }
      }

      // Validate the action
      const validation = await SubscriptionValidationService.validateAction(userId, requiredAction, currentUsage);

      if (!validation.allowed) {
        console.log(`❌ Subscription validation failed for user ${userId}, action ${requiredAction}:`, validation.reason);
        const statusCode = validation.upgradeRequired ? 402 : 403;

        return res.status(statusCode).json({
          success: false,
          error: validation.reason,
          code: validation.upgradeRequired ? 'UPGRADE_REQUIRED' : 'FEATURE_NOT_AVAILABLE',
          subscription: validation.subscription,
          remainingUsage: validation.remainingUsage,
          upgradeRequired: validation.upgradeRequired,
          action: requiredAction
        });
      }

      // Attach subscription info to request for use in controllers
      req.userSubscription = validation.subscription;
      req.remainingUsage = validation.remainingUsage;

      next();

    } catch (error) {
      console.error('Subscription validation middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to validate subscription',
        details: error.message
      });
    }
  };
};

/**
 * Middleware to check if user has any active subscription
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const subscription = await SubscriptionValidationService.getUserActiveSubscription(userId);

    if (!subscription.hasActiveSubscription) {
      return res.status(402).json({
        success: false,
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        userType: subscription.userType
      });
    }

    req.userSubscription = subscription;
    next();

  } catch (error) {
    console.error('Active subscription check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify subscription status'
    });
  }
};

/**
 * Middleware to check specific feature availability
 */
const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const userId = extractUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const subscription = await SubscriptionValidationService.getUserActiveSubscription(userId);
      const hasFeature = subscription.features && subscription.features[featureName];

      if (!hasFeature) {
        return res.status(402).json({
          success: false,
          error: `Feature '${featureName}' not available in current plan`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: featureName,
          subscription: subscription
        });
      }

      req.userSubscription = subscription;
      next();

    } catch (error) {
      console.error('Feature check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify feature availability'
      });
    }
  };
};

/**
 * Middleware to add subscription info to all requests (non-blocking)
 */
const attachSubscriptionInfo = async (req, res, next) => {
  try {
    const userId = extractUserId(req);

    if (userId) {
      const subscription = await SubscriptionValidationService.getUserActiveSubscription(userId);
      req.userSubscription = subscription;
    }

    next();

  } catch (error) {
    console.log('Warning: Could not attach subscription info:', error.message);
    next();
  }
};

module.exports = {
  validateSubscription,
  requireActiveSubscription,
  requireFeature,
  attachSubscriptionInfo
};
