const UserSubscription = require('../Model/User/userSubscription');
const Subscription = require('../Model/subscription');
const userModel = require('../Model/User/user');
const EmployerModel = require('../Model/Employers/employers');

class SubscriptionValidationService {
  
  /**
   * Get user's active subscription with all details
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Active subscription details
   */
  static async getUserActiveSubscription(userId) {
    try {
      // Check if user exists in either schema
      let user = await userModel.findById(userId);
      let userType = 'employee';
      if (!user) {
        user = await EmployerModel.findById(userId);
        if (user) userType = 'employer';
      }

      if (!user) {
        throw new Error('User not found');
      }

      // Find active subscription
      const now = new Date();
      const activeSubscription = await UserSubscription.findOne({
        userId: userId,
        status: 'active',
        startDate: { $lte: now },
        $or: [
          { endDate: { $gt: now } },
          { endDate: null } // For lifetime subscriptions
        ]
      }).populate('subscriptionId').lean();

      if (!activeSubscription) {
        return {
          hasActiveSubscription: false,
          userType: userType,
          subscriptionType: 'free',
          planName: `${userType === 'employer' ? 'Employer' : 'Employee'} Free Plan`,
          features: this.getFreeFeatures(userType),
          limits: this.getFreeLimits(userType)
        };
      }

      return {
        hasActiveSubscription: true,
        userType: userType,
        subscriptionType: activeSubscription.type,
        subscriptionId: activeSubscription._id,
        planName: activeSubscription.planName,
        features: activeSubscription.features || {},
        limits: this.extractLimits(activeSubscription.features || {}),
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        isExpiringSoon: this.isExpiringSoon(activeSubscription.endDate)
      };

    } catch (error) {
      console.error('Error getting user active subscription:', error);
      throw error;
    }
  }

  /**
   * Validate if user can perform a specific action
   * @param {String} userId - User ID
   * @param {String} action - Action to validate
   * @param {Object} currentUsage - Current usage data (optional)
   * @returns {Promise<Object>} Validation result
   */
  static async validateAction(userId, action, currentUsage = {}) {
    try {
      const subscription = await this.getUserActiveSubscription(userId);
      const validation = this.checkActionPermission(subscription, action, currentUsage);
      
      return {
        allowed: validation.allowed,
        reason: validation.reason,
        subscription: subscription,
        remainingUsage: validation.remainingUsage,
        totalLimit: validation.totalLimit,
        currentUsage: validation.currentUsage,
        upgradeRequired: validation.upgradeRequired
      };

    } catch (error) {
      console.error('Error validating action:', error);
      return {
        allowed: false,
        reason: 'Validation error',
        error: error.message
      };
    }
  }

  /**
   * Check if specific action is allowed based on subscription
   * @param {Object} subscription - User's subscription details
   * @param {String} action - Action to check
   * @param {Object} currentUsage - Current usage data
   * @returns {Object} Permission check result
   */
  static checkActionPermission(subscription, action, currentUsage) {
    const { features, limits, userType } = subscription;

    // Define comprehensive action mappings based on user type
    const actionMappings = {
      // Employee actions
      'apply_job': {
        limitKey: 'jobApplicationsPerMonth',
        // Enforce a daily cap as well if present
        dailyLimitKey: 'jobApplicationsPerDay',
        userType: 'employee',
        featureKey: 'enableJobApplications'
      },
      'search_job': {
        limitKey: 'jobSearchPerDay',
        userType: 'employee',
        featureKey: 'enableJobSearch'
      },
      'view_company_details': {
        limitKey: 'companyViewsPerDay',
        userType: 'employee',
        featureKey: 'profileCreation'
      },
      'contact_employer': {
        limitKey: 'messagesPerThread',
        userType: 'employee',
        featureKey: 'employerChat'
      },
      'premium_filters': {
        limitKey: 'premiumFilters',
        userType: 'employee',
        featureKey: 'premiumFilters'
      },
      'resume_boost': {
        limitKey: 'resumeBoost',
        userType: 'employee',
        featureKey: 'resumeBoost'
      },
      'job_alerts': {
        limitKey: 'customJobAlerts',
        userType: 'employee',
        featureKey: 'jobAlerts'
      },
      'profile_update': {
        limitKey: 'profileUpdatesPerMonth',
        userType: 'employee',
        featureKey: 'enableProfileUpdates'
      },
      'skill_assessment': {
        limitKey: 'skillAssessmentsPerMonth',
        userType: 'employee',
        featureKey: 'skillsManagement'
      },
      'interview_schedule': {
        limitKey: 'interviewsPerMonth',
        userType: 'employee',
        featureKey: 'enableInterviews'
      },
      
      // Employer actions
      'post_job': {
        limitKey: 'activeJobPosts',
        userType: 'employer',
        featureKey: 'enableJobPosting'
      },
      'search_candidates': {
        limitKey: 'candidateSearchesPerDay',
        userType: 'employer',
        featureKey: 'enableCandidateSearch'
      },
      'view_candidate_contact': {
        limitKey: 'candidateViewsPerDay',
        userType: 'employer',
        featureKey: 'enableCandidateSearch'
      },
      'premium_job_posting': {
        limitKey: 'premiumJobPosting',
        userType: 'employer',
        featureKey: 'premiumJobPosting'
      },
      'candidate_database_access': {
        limitKey: 'candidateDatabase',
        userType: 'employer',
        featureKey: 'candidateDatabase'
      },
      'analytics_access': {
        limitKey: 'analyticsAccess',
        userType: 'employer',
        featureKey: 'analyticsAccess'
      },
      'bulk_messaging': {
        limitKey: 'bulkMessages',
        userType: 'employer',
        featureKey: 'bulkMessages'
      },
      'interview_schedule_employer': {
        limitKey: 'interviewSlotsPerJob',
        userType: 'employer',
        featureKey: 'enableEmployerInterviews'
      },
      'application_review': {
        limitKey: 'applicationReviewsPerDay',
        userType: 'employer',
        featureKey: 'enableEmployerCommunication'
      }
    };

    const actionConfig = actionMappings[action];
    
    if (!actionConfig) {
      return {
        allowed: false,
        reason: 'Unknown action',
        upgradeRequired: false
      };
    }

    // Check if user type matches action requirement
    if (actionConfig.userType !== userType) {
      return {
        allowed: false,
        reason: `This action is only available for ${actionConfig.userType}s`,
        upgradeRequired: false
      };
    }

    const { limitKey, featureKey } = actionConfig;

    // Check if feature is enabled
    if (features[featureKey] === false) {
      return {
        allowed: false,
        reason: 'Feature not available in current plan',
        upgradeRequired: true
      };
    }

    // For boolean features (true/false)
    if (typeof features[limitKey] === 'boolean') {
      return {
        allowed: features[limitKey],
        reason: features[limitKey] ? 'Allowed' : 'Feature not available in current plan',
        upgradeRequired: !features[limitKey]
      };
    }

    // For numeric limits
    const limit = limits[limitKey] || features[limitKey];
    const used = currentUsage[limitKey] || 0;

    if (typeof limit === 'number') {
      const remaining = Math.max(0, limit - used);
      const allowed = remaining > 0;

      // If there is also a daily limit (for apply_job), enforce it in addition to monthly
      if (actionConfig.dailyLimitKey) {
        const dailyKey = actionConfig.dailyLimitKey;
        const dailyLimit = limits[dailyKey] || features[dailyKey];
        const dailyUsed = currentUsage[dailyKey] || 0;
        let dailyRemaining = null;
        let dailyAllowed = true;
        if (typeof dailyLimit === 'number') {
          dailyRemaining = Math.max(0, dailyLimit - dailyUsed);
          dailyAllowed = dailyRemaining > 0;
        }

        const finalAllowed = allowed && dailyAllowed;
        const finalRemaining = Math.min(
          typeof dailyRemaining === 'number' ? dailyRemaining : Infinity,
          remaining
        );
        return {
          allowed: finalAllowed,
          reason: finalAllowed ? 'Within limits' : 'Usage limit exceeded',
          remainingUsage: isFinite(finalRemaining) ? finalRemaining : remaining,
          // Expose both limits for UI, keep totalLimit as monthly for compatibility
          totalLimit: limit,
          currentUsage: used,
          dailyLimit: typeof dailyLimit === 'number' ? dailyLimit : null,
          dailyUsage: dailyUsed,
          upgradeRequired: !finalAllowed
        };
      }

      return {
        allowed: allowed,
        reason: allowed ? 'Within limits' : 'Usage limit exceeded',
        remainingUsage: remaining,
        totalLimit: limit,
        currentUsage: used,
        upgradeRequired: !allowed
      };
    }

    // Default allow if no specific limit found
    return {
      allowed: true,
      reason: 'No specific limit defined'
    };
  }

  /**
   * Get current usage for a user
   * @param {String} userId - User ID
   * @param {String} period - Period ('daily', 'monthly', 'yearly')
   * @returns {Promise<Object>} Usage statistics
   */
  static async getCurrentUsage(userId, period = 'monthly') {
    try {
      // This would typically query various collections to get usage stats
      // For now, returning mock data - you'll need to implement based on your data structure
      
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Try to get actual usage data from existing models
      let usage = {
        period: period,
        startDate: startDate,
        endDate: now
      };

      // Count employee job applications this period (use correct model/fields)
      try {
        const Apply = require('../Model/Employers/apply');
        usage.jobApplicationsPerMonth = await Apply.countDocuments({
          userId: typeof userId === 'string' ? require('mongoose').Types.ObjectId(userId) : userId,
          createdAt: { $gte: startDate }
        });

        // Also compute today's applications for daily limit enforcement
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        usage.jobApplicationsPerDay = await Apply.countDocuments({
          userId: typeof userId === 'string' ? require('mongoose').Types.ObjectId(userId) : userId,
          createdAt: { $gte: todayStart }
        });
      } catch (err1) {
        try {
          // Fallback to User/JobApplication if available (fields: applicant)
          const JobApplication = require('../Model/User/JobApplication');
          usage.jobApplicationsPerMonth = await JobApplication.countDocuments({
            applicant: typeof userId === 'string' ? require('mongoose').Types.ObjectId(userId) : userId,
            createdAt: { $gte: startDate }
          });
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          usage.jobApplicationsPerDay = await JobApplication.countDocuments({
            applicant: typeof userId === 'string' ? require('mongoose').Types.ObjectId(userId) : userId,
            createdAt: { $gte: todayStart }
          });
        } catch (err2) {
          console.log('No application model available, defaulting applications count to 0');
          usage.jobApplicationsPerMonth = 0;
          usage.jobApplicationsPerDay = 0;
        }
      }

      try {
        // Count employer active jobs (new schema uses 'employer')
        const Job = require('../Model/User/Job');
        usage.activeJobPosts = await Job.countDocuments({ 
          employer: typeof userId === 'string' ? require('mongoose').Types.ObjectId(userId) : userId, 
          status: 'active' 
        });
        // If zero in new model, also check legacy collection and use the higher count
        try {
          const LegacyCompanyJob = require('../Model/Employers/company');
          const legacyCount = await LegacyCompanyJob.countDocuments({
            employerId: typeof userId === 'string' ? require('mongoose').Types.ObjectId(userId) : userId,
            isDelete: false
          });
          if (typeof legacyCount === 'number' && legacyCount > usage.activeJobPosts) {
            usage.activeJobPosts = legacyCount;
          }
        } catch {}
      } catch (error) {
        // Fallback: legacy schema `Model/Employers/company`
        try {
          const LegacyCompanyJob = require('../Model/Employers/company');
          usage.activeJobPosts = await LegacyCompanyJob.countDocuments({ 
            employerId: typeof userId === 'string' ? require('mongoose').Types.ObjectId(userId) : userId,
            isDelete: false
          });
        } catch (e2) {
          console.log('Job models not available, defaulting activeJobPosts to 0');
          usage.activeJobPosts = 0;
        }
      }

      // Set default values for other usage metrics
      usage.candidateSearchesPerDay = 0;
      usage.candidateViewsPerDay = 0;
      usage.applicationReviewsPerDay = 0;

      // Always compute today's various actions using UsageRecord so UI shows correct counts
      try {
        const UsageRecord = require('../Model/usageRecord');
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const searchRecords = await UsageRecord.aggregate([
          {
            $match: {
              userId: typeof userId === 'string' ? require('mongoose').Types.ObjectId(userId) : userId,
              usageKey: 'jobSearchPerDay',
              date: { $gte: todayStart, $lte: now }
            }
          },
          { $group: { _id: null, total: { $sum: '$count' } } }
        ]);
        usage.jobSearchPerDay = (searchRecords && searchRecords[0] && searchRecords[0].total) || 0;
        const candSearchRecords = await UsageRecord.aggregate([
          { $match: { userId: typeof userId === 'string' ? require('mongoose').Types.ObjectId(userId) : userId, usageKey: 'candidateSearchesPerDay', date: { $gte: todayStart, $lte: now } } },
          { $group: { _id: null, total: { $sum: '$count' } } }
        ]);
        usage.candidateSearchesPerDay = (candSearchRecords && candSearchRecords[0] && candSearchRecords[0].total) || 0;
        const candViewRecords = await UsageRecord.aggregate([
          { $match: { userId: typeof userId === 'string' ? require('mongoose').Types.ObjectId(userId) : userId, usageKey: 'candidateViewsPerDay', date: { $gte: todayStart, $lte: now } } },
          { $group: { _id: null, total: { $sum: '$count' } } }
        ]);
        usage.candidateViewsPerDay = (candViewRecords && candViewRecords[0] && candViewRecords[0].total) || 0;
        const reviewRecords = await UsageRecord.aggregate([
          { $match: { userId: typeof userId === 'string' ? require('mongoose').Types.ObjectId(userId) : userId, usageKey: 'applicationReviewsPerDay', date: { $gte: todayStart, $lte: now } } },
          { $group: { _id: null, total: { $sum: '$count' } } }
        ]);
        usage.applicationReviewsPerDay = (reviewRecords && reviewRecords[0] && reviewRecords[0].total) || 0;
      } catch (uErr) {
        usage.jobSearchPerDay = 0;
        usage.candidateSearchesPerDay = 0;
        usage.candidateViewsPerDay = 0;
        usage.applicationReviewsPerDay = 0;
      }

      return usage;

    } catch (error) {
      console.error('Error getting current usage:', error);
      throw error;
    }
  }

  /**
   * Extract limits from features object
   * @param {Object} features - Features object
   * @returns {Object} Limits object
   */
  static extractLimits(features) {
    const limits = {};
    
    // Extract numeric limits
    Object.keys(features).forEach(key => {
      if (typeof features[key] === 'number') {
        limits[key] = features[key];
      }
    });

    return limits;
  }

  /**
   * Get free tier features for user type
   * @param {String} userType - 'employee' or 'employer'
   * @returns {Object} Free features
   */
  static getFreeFeatures(userType) {
    if (userType === 'employee') {
      return {
        jobApplicationsPerMonth: 5,
        jobSearchPerDay: 10,
        companyDetailsAccess: false,
        directEmployerContact: false,
        premiumFilters: false,
        resumeBoost: false,
        jobAlerts: true
      };
    } else {
      return {
        activeJobPosts: 1,
        candidateSearchesPerDay: 3,
        candidateContactAccess: false,
        premiumJobPosting: false,
        candidateDatabase: false,
        advancedAnalytics: false,
        bulkMessaging: false
      };
    }
  }

  /**
   * Get free tier limits for user type
   * @param {String} userType - 'employee' or 'employer'
   * @returns {Object} Free limits
   */
  static getFreeLimits(userType) {
    return this.extractLimits(this.getFreeFeatures(userType));
  }

  /**
   * Check if subscription is expiring soon (within 7 days)
   * @param {Date} endDate - Subscription end date
   * @returns {Boolean} Is expiring soon
   */
  static isExpiringSoon(endDate) {
    if (!endDate) return false;
    
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    return endDate <= sevenDaysFromNow;
  }

  /**
   * Get subscription recommendations for user
   * @param {String} userId - User ID
   * @param {Object} desiredFeatures - Features user wants
   * @returns {Promise<Array>} Recommended subscriptions
   */
  static async getRecommendations(userId, desiredFeatures = {}) {
    try {
      const currentSubscription = await this.getUserActiveSubscription(userId);
      const allSubscriptions = await Subscription.find({ 
        type: currentSubscription.userType,
        isActive: true 
      }).lean();

      const recommendations = allSubscriptions
        .filter(sub => this.meetsDesiredFeatures(sub.features, desiredFeatures))
        .map(sub => ({
          ...sub,
          isUpgrade: this.isUpgrade(currentSubscription.features, sub.features),
          matchScore: this.calculateMatchScore(sub.features, desiredFeatures)
        }))
        .sort((a, b) => b.matchScore - a.matchScore);

      return recommendations;

    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Check if subscription meets desired features
   * @param {Object} subscriptionFeatures - Subscription features
   * @param {Object} desiredFeatures - Desired features
   * @returns {Boolean} Meets requirements
   */
  static meetsDesiredFeatures(subscriptionFeatures, desiredFeatures) {
    for (const [feature, requirement] of Object.entries(desiredFeatures)) {
      const subFeature = subscriptionFeatures[feature];
      
      if (typeof requirement === 'boolean' && !subFeature) {
        return false;
      }
      
      if (typeof requirement === 'number' && (!subFeature || subFeature < requirement)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if subscription is an upgrade
   * @param {Object} currentFeatures - Current subscription features
   * @param {Object} newFeatures - New subscription features
   * @returns {Boolean} Is upgrade
   */
  static isUpgrade(currentFeatures, newFeatures) {
    // Simple upgrade check - you can make this more sophisticated
    const currentScore = this.calculateFeatureScore(currentFeatures);
    const newScore = this.calculateFeatureScore(newFeatures);
    
    return newScore > currentScore;
  }

  /**
   * Calculate feature score for comparison
   * @param {Object} features - Features object
   * @returns {Number} Feature score
   */
  static calculateFeatureScore(features) {
    let score = 0;
    
    Object.values(features).forEach(value => {
      if (typeof value === 'boolean' && value) score += 1;
      if (typeof value === 'number') score += value * 0.1;
    });
    
    return score;
  }

  /**
   * Calculate match score for recommendations
   * @param {Object} subscriptionFeatures - Subscription features
   * @param {Object} desiredFeatures - Desired features
   * @returns {Number} Match score (0-100)
   */
  static calculateMatchScore(subscriptionFeatures, desiredFeatures) {
    if (Object.keys(desiredFeatures).length === 0) return 50;
    
    let matches = 0;
    const totalDesired = Object.keys(desiredFeatures).length;
    
    Object.entries(desiredFeatures).forEach(([feature, requirement]) => {
      const subFeature = subscriptionFeatures[feature];
      
      if (typeof requirement === 'boolean' && subFeature === requirement) {
        matches += 1;
      } else if (typeof requirement === 'number' && subFeature >= requirement) {
        matches += 1;
      }
    });
    
    return Math.round((matches / totalDesired) * 100);
  }
}

module.exports = SubscriptionValidationService;
