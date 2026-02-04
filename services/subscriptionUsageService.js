const UserSubscription = require('../Model/User/userSubscription');
const Subscription = require('../Model/subscription');
const userModel = require('../Model/User/user');
const EmployerModel = require('../Model/Employers/employers');

class SubscriptionUsageService {
  
  /**
   * Record usage for a specific action
   * @param {String} userId - User ID
   * @param {String} action - Action performed
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Recording result
   */
  static async recordUsage(userId, action, metadata = {}) {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get user's active subscription
      const subscription = await this.getUserActiveSubscription(userId);
      
      if (!subscription.hasActiveSubscription) {
        throw new Error('No active subscription found');
      }

      // Define usage tracking keys based on action
      const usageKeys = this.getUsageKeys(action);
      
      // Update usage counts
      const updatePromises = usageKeys.map(async (key) => {
        const usageData = {
          userId,
          action,
          usageKey: key,
          metadata,
          timestamp: now,
          date: today,
          month: currentMonth
        };

        // Use upsert to create or update usage record
        await this.upsertUsageRecord(usageData);
      });

      await Promise.all(updatePromises);

      return {
        success: true,
        action,
        timestamp: now,
        usageKeys
      };

    } catch (error) {
      console.error('Record usage error:', error);
      throw error;
    }
  }

  /**
   * Get current usage statistics for a user
   * @param {String} userId - User ID
   * @param {String} period - Usage period ('daily', 'monthly', 'yearly')
   * @returns {Promise<Object>} Usage statistics
   */
  static async getCurrentUsage(userId, period = 'monthly') {
    try {
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

      // Get usage records for the period
      const usageRecords = await this.getUsageRecords(userId, startDate, now);
      
      // Aggregate usage by key
      const usageStats = {};
      
      usageRecords.forEach(record => {
        const key = record.usageKey;
        if (!usageStats[key]) {
          usageStats[key] = 0;
        }
        usageStats[key]++;
      });

      return usageStats;

    } catch (error) {
      console.error('Get current usage error:', error);
      throw error;
    }
  }

  /**
   * Get user's active subscription
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
   * Get usage keys for a specific action
   * @param {String} action - Action performed
   * @returns {Array} Array of usage keys
   */
  static getUsageKeys(action) {
    const usageKeyMap = {
      'apply_job': ['jobApplicationsPerMonth', 'jobApplicationsPerDay'],
      'search_job': ['jobSearchPerDay'],
      'post_job': ['activeJobPosts'],
      'search_candidates': ['candidateSearchesPerDay'],
      'view_candidate_contact': ['candidateViewsPerDay'],
      'view_company_details': ['companyViewsPerDay'],
      'contact_employer': ['messagesPerThread'],
      'profile_update': ['profileUpdatesPerMonth'],
      // 'skill_assessment' removed - no assessments feature in app
      'interview_schedule': ['interviewsPerMonth'],
      'interview_schedule_employer': ['interviewSlotsPerJob'],
      'application_review': ['applicationReviewsPerDay']
    };

    return usageKeyMap[action] || [action];
  }

  /**
   * Upsert usage record
   * @param {Object} usageData - Usage data
   */
  static async upsertUsageRecord(usageData) {
    const UsageRecord = require('../Model/usageRecord');
    await UsageRecord.findOneAndUpdate(
      {
        userId: usageData.userId,
        usageKey: usageData.usageKey,
        date: usageData.date
      },
      {
        $inc: { count: 1 },
        $set: {
          lastAction: usageData.action,
          lastTimestamp: usageData.timestamp,
          metadata: usageData.metadata,
          month: usageData.month
        }
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Get usage records for a period
   * @param {String} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Usage records
   */
  static async getUsageRecords(userId, startDate, endDate) {
    const UsageRecord = require('../Model/usageRecord');
    return UsageRecord.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).lean();
  }

  /**
   * Get free features for user type
   * @param {String} userType - User type ('employee' or 'employer')
   * @returns {Object} Free features
   */
  static getFreeFeatures(userType) {
    const freeFeatures = {
      employee: {
        profileCreation: true,
        workExperience: true,
        educationDetails: true,
        skillsManagement: true,
        preferredSalary: true,
        locationPreferences: true,
        jobApplications: true,
        applicationTracking: true,
        jobAlerts: true,
        applicationHistory: true,
        employerChat: true,
        applicationMessages: true,
        onlineInterviews: true,
        interviewScheduling: true,
        interviewAvailability: true,
        interviewFeedback: true,
        enableJobSearch: true,
        enableJobApplications: true,
        enableProfileUpdates: true,
        enableInterviews: true,
        enableCommunication: true
      },
      employer: {
        profileCreation: true,
        workExperience: true,
        jobApplications: true,
        applicationTracking: true,
        jobAlerts: true,
        applicationHistory: true,
        employerChat: true,
        applicationMessages: true,
        onlineInterviews: true,
        interviewScheduling: true,
        interviewFeedback: true,
        enableJobPosting: true,
        enableCandidateSearch: true,
        enableEmployerInterviews: true,
        enableEmployerCommunication: true
      }
    };

    return freeFeatures[userType] || {};
  }

  /**
   * Get free limits for user type
   * @param {String} userType - User type ('employee' or 'employer')
   * @returns {Object} Free limits
   */
  static getFreeLimits(userType) {
    const freeLimits = {
      employee: {
        jobSearchPerDay: 5,
        jobApplicationsPerMonth: 0,
        jobApplicationsPerDay: 0,
        companyViewsPerDay: 3,
        profileUpdatesPerMonth: 2,
        interviewsPerMonth: 2,
        messagesPerThread: 10,
        customJobAlerts: 1
      },
      employer: {
        activeJobPosts: 1,
        candidateSearchesPerDay: 5,
        candidateViewsPerDay: 3,
        applicationReviewsPerDay: 10,
        interviewSlotsPerJob: 3,
        messagesPerCandidate: 10,
        messageThreads: 3
      }
    };

    return freeLimits[userType] || {};
  }

  /**
   * Extract limits from subscription features
   * @param {Object} features - Subscription features
   * @returns {Object} Extracted limits
   */
  static extractLimits(features) {
    const limits = {};
    
    // Extract numeric limits from features
    Object.keys(features).forEach(key => {
      if (typeof features[key] === 'number') {
        limits[key] = features[key];
      }
    });

    return limits;
  }

  /**
   * Check if subscription is expiring soon
   * @param {Date} endDate - Subscription end date
   * @returns {Boolean} Is expiring soon
   */
  static isExpiringSoon(endDate) {
    if (!endDate) return false;
    
    const now = new Date();
    const daysUntilExpiry = Math.ceil((new Date(endDate) - now) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }

  /**
   * Get usage analytics for admin
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Usage analytics
   */
  static async getUsageAnalytics(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        userType,
        subscriptionType,
        action
      } = filters;

      // This would typically query usage records with filters
      // For now, return placeholder data
      return {
        totalActions: 0,
        topActions: [],
        userTypeBreakdown: {},
        subscriptionTypeBreakdown: {},
        dailyUsage: [],
        monthlyUsage: []
      };

    } catch (error) {
      console.error('Get usage analytics error:', error);
      throw error;
    }
  }
}

module.exports = SubscriptionUsageService;
