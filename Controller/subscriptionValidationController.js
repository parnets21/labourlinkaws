const SubscriptionValidationService = require('../services/subscriptionValidationService');

class SubscriptionValidationController {

  /**
   * Get user's current subscription status and limits
   */
  async getSubscriptionStatus(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const subscription = await SubscriptionValidationService.getUserActiveSubscription(userId);
      const currentUsage = await SubscriptionValidationService.getCurrentUsage(userId);

      return res.status(200).json({
        success: true,
        data: {
          subscription: subscription,
          usage: currentUsage,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Get subscription status error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get subscription status',
        details: error.message
      });
    }
  }

  /**
   * Validate if user can perform a specific action
   */
  async validateAction(req, res) {
    try {
      const { userId, action } = req.params;
      const { currentUsage } = req.body;
      
      if (!userId || !action) {
        return res.status(400).json({
          success: false,
          error: 'User ID and action are required'
        });
      }

      const validation = await SubscriptionValidationService.validateAction(userId, action, currentUsage);

      return res.status(200).json({
        success: true,
        data: validation
      });

    } catch (error) {
      console.error('Validate action error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to validate action',
        details: error.message
      });
    }
  }

  /**
   * Get current usage statistics for user
   */
  async getCurrentUsage(req, res) {
    try {
      const { userId } = req.params;
      const { period = 'monthly' } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const usage = await SubscriptionValidationService.getCurrentUsage(userId, period);

      return res.status(200).json({
        success: true,
        data: usage
      });

    } catch (error) {
      console.error('Get current usage error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get usage statistics',
        details: error.message
      });
    }
  }

  /**
   * Get subscription recommendations for user
   */
  async getRecommendations(req, res) {
    try {
      const { userId } = req.params;
      const { desiredFeatures } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const recommendations = await SubscriptionValidationService.getRecommendations(userId, desiredFeatures);

      return res.status(200).json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      console.error('Get recommendations error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get recommendations',
        details: error.message
      });
    }
  }

  /**
   * Check multiple actions at once
   */
  async validateMultipleActions(req, res) {
    try {
      const { userId } = req.params;
      const { actions, currentUsage } = req.body;
      
      if (!userId || !actions || !Array.isArray(actions)) {
        return res.status(400).json({
          success: false,
          error: 'User ID and actions array are required'
        });
      }

      const results = {};
      
      for (const action of actions) {
        try {
          results[action] = await SubscriptionValidationService.validateAction(userId, action, currentUsage);
        } catch (error) {
          results[action] = {
            allowed: false,
            reason: 'Validation error',
            error: error.message
          };
        }
      }

      return res.status(200).json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Validate multiple actions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to validate actions',
        details: error.message
      });
    }
  }

  /**
   * Get available actions for user's current subscription
   */
  async getAvailableActions(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const subscription = await SubscriptionValidationService.getUserActiveSubscription(userId);
      const currentUsage = await SubscriptionValidationService.getCurrentUsage(userId);

      // Define all possible actions based on user type
      const allActions = subscription.userType === 'employee' ? [
        'apply_job',
        'search_job',
        'view_company_details',
        'contact_employer',
        'premium_filters',
        'resume_boost',
        'job_alerts'
      ] : [
        'post_job',
        'search_candidates',
        'view_candidate_contact',
        'premium_job_posting',
        'candidate_database_access',
        'analytics_access',
        'bulk_messaging'
      ];

      const availableActions = {};
      const restrictedActions = {};

      for (const action of allActions) {
        const validation = SubscriptionValidationService.checkActionPermission(subscription, action, currentUsage);
        
        if (validation.allowed) {
          availableActions[action] = validation;
        } else {
          restrictedActions[action] = validation;
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          subscription: subscription,
          availableActions: availableActions,
          restrictedActions: restrictedActions,
          usage: currentUsage
        }
      });

    } catch (error) {
      console.error('Get available actions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get available actions',
        details: error.message
      });
    }
  }

  /**
   * Record action usage (for tracking)
   */
  async recordUsage(req, res) {
    try {
      const { userId, action, metadata = {} } = req.body;
      
      if (!userId || !action) {
        return res.status(400).json({
          success: false,
          error: 'User ID and action are required'
        });
      }

      // TODO: Implement actual usage recording
      // This would typically insert into a usage tracking collection
      // Example: await UsageLog.create({ userId, action, metadata, timestamp: new Date() });

      console.log('Recording usage:', { userId, action, metadata });

      return res.status(200).json({
        success: true,
        message: 'Usage recorded successfully',
        data: {
          userId,
          action,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Record usage error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to record usage',
        details: error.message
      });
    }
  }
}

module.exports = new SubscriptionValidationController();
