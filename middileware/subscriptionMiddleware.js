const UserSubscription = require('../Model/User/userSubscription');

// Middleware to check if user has active subscription
const checkActiveSubscription = (requiredType = null) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.body.userId || req.params.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const hasActive = await UserSubscription.hasActiveSubscription(userId, requiredType);
      
      if (!hasActive) {
        return res.status(403).json({
          success: false,
          error: `Active ${requiredType || ''} subscription required`,
          code: 'SUBSCRIPTION_REQUIRED'
        });
      }

      // Get the active subscription and attach to request
      const activeSubscription = await UserSubscription.getActiveSubscription(userId, requiredType);
      req.userSubscription = activeSubscription;
      
      next();
    } catch (error) {
      console.error('Subscription middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify subscription status'
      });
    }
  };
};

// Middleware to check subscription features
const checkSubscriptionFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const subscription = req.userSubscription;
      
      if (!subscription || !subscription.features) {
        return res.status(403).json({
          success: false,
          error: 'Subscription features not available',
          code: 'FEATURE_NOT_AVAILABLE'
        });
      }

      const hasFeature = subscription.features[featureName];
      
      if (!hasFeature) {
        return res.status(403).json({
          success: false,
          error: `Feature '${featureName}' not available in your subscription plan`,
          code: 'FEATURE_RESTRICTED'
        });
      }

      next();
    } catch (error) {
      console.error('Feature check middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify subscription features'
      });
    }
  };
};

// Middleware to check subscription limits
const checkSubscriptionLimit = (limitName, incrementBy = 1) => {
  return async (req, res, next) => {
    try {
      const subscription = req.userSubscription;
      
      if (!subscription || !subscription.features) {
        return res.status(403).json({
          success: false,
          error: 'Subscription limits not available',
          code: 'LIMITS_NOT_AVAILABLE'
        });
      }

      const limit = subscription.features[limitName];
      
      if (typeof limit === 'number' && limit > 0) {
        // TODO: Implement usage tracking
        // For now, we'll just check if the feature exists
        // In a real implementation, you'd track usage in a separate collection
        console.log(`Checking limit for ${limitName}: ${limit}`);
      }

      next();
    } catch (error) {
      console.error('Limit check middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify subscription limits'
      });
    }
  };
};

module.exports = {
  checkActiveSubscription,
  checkSubscriptionFeature,
  checkSubscriptionLimit
};
