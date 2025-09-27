const UserSubscription = require('../../Model/User/userSubscription');
const Subscription = require('../../Model/subscription');
const PhonepeTransaction = require('../../Model/PhonepeModel');
const User = require('../../Model/User/user');
const Employer = require('../../Model/Employers/employers');
const mongoose = require('mongoose');

class SubscriptionAdminController {
  // Get dashboard overview
  async getDashboard(req, res) {
    try {
      // Get current date for calculations
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Calculate expiring soon (next 7 days)
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      // Aggregate statistics
      const [
        totalActiveSubscriptions,
        expiringSoon,
        activeEmployeeSubscriptions,
        activeEmployerSubscriptions,
        monthlyRevenue,
        totalRevenue,
        successfulTransactions
      ] = await Promise.all([
        // Total active subscriptions
        UserSubscription.countDocuments({
          status: 'active',
          endDate: { $gt: now }
        }),
        
        // Expiring soon
        UserSubscription.countDocuments({
          status: 'active',
          endDate: { $gte: now, $lte: nextWeek }
        }),
        
        // Active employee subscriptions
        UserSubscription.countDocuments({
          type: 'employee',
          status: 'active',
          endDate: { $gt: now }
        }),
        
        // Active employer subscriptions
        UserSubscription.countDocuments({
          type: 'employer',
          status: 'active',
          endDate: { $gt: now }
        }),
        
        // Monthly revenue
        UserSubscription.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfMonth, $lte: endOfMonth },
              status: { $ne: 'cancelled' }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]).then(result => result[0]?.total || 0),
        
        // Total revenue
        UserSubscription.aggregate([
          {
            $match: {
              status: { $ne: 'cancelled' }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]).then(result => result[0]?.total || 0),
        
        // Successful transactions this month
        PhonepeTransaction.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: { $in: ['SUCCESS', 'COMPLETED'] }
        })
      ]);

      const dashboardStats = {
        totalActiveSubscriptions,
        expiringSoon,
        activeEmployeeSubscriptions,
        activeEmployerSubscriptions,
        monthlyRevenue,
        totalRevenue,
        successfulTransactions
      };

      res.status(200).json({
        success: true,
        data: {
          stats: dashboardStats
        }
      });

    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data'
      });
    }
  }

  // Get user subscriptions with filters and pagination
  async getUserSubscriptions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        userType = '',
        status = '',
        planName = ''
      } = req.query;

      // Build query
      const query = {};
      
      if (userType) query.type = userType;
      if (status) query.status = status;
      if (planName) query.planName = { $regex: planName, $options: 'i' };

      // Get subscriptions with user details
      const subscriptions = await UserSubscription.find(query)
        .populate('subscriptionId')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Enhance with user details and subscription health
      const enhancedSubscriptions = await Promise.all(
        subscriptions.map(async (subscription) => {
          let userDetails = null;
          
          // Get user details from both schemas
          const [employee, employer] = await Promise.all([
            User.findById(subscription.userId).select('fullName name email userType phone mobile location').lean(),
            Employer.findById(subscription.userId).select('name email mobile CompanyName industry').lean()
          ]);

          userDetails = employee || employer;
          let userType = 'employee';
          
          if (employee) {
            userType = employee.userType || 'employee';
          } else if (employer) {
            userType = 'employer';
          }

          // Normalize user details based on schema
          if (userDetails) {
            userDetails.userType = userType;
            userDetails.name = userDetails.name || userDetails.fullName || userDetails.CompanyName || 'Unknown User';
            userDetails.mobile = userDetails.mobile || userDetails.phone || userDetails.Mobile;
          }

          // Calculate subscription health
          const now = new Date();
          const endDate = new Date(subscription.endDate);
          const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
          const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;

          // Get usage data (mock for now - implement based on your tracking)
          const usageData = await this.getUserUsageData(subscription.userId, subscription.type);

          return {
            ...subscription,
            userDetails,
            subscriptionHealth: {
              daysRemaining: Math.max(0, daysRemaining),
              isExpiringSoon,
              isExpired: daysRemaining <= 0
            },
            usageData
          };
        })
      );

      const total = await UserSubscription.countDocuments(query);

      res.status(200).json({
        success: true,
        data: enhancedSubscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get user subscriptions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user subscriptions'
      });
    }
  }

  // Update subscription status
  async updateSubscriptionStatus(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { status, notes } = req.body;

      const subscription = await UserSubscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      subscription.status = status;
      if (notes) {
        subscription.metadata = {
          ...subscription.metadata,
          adminNotes: notes,
          lastUpdatedBy: 'admin',
          lastUpdatedAt: new Date()
        };
      }

      await subscription.save();

      res.status(200).json({
        success: true,
        message: 'Subscription status updated successfully',
        data: subscription
      });

    } catch (error) {
      console.error('Update subscription status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update subscription status'
      });
    }
  }

  // Get transaction analytics
  async getTransactionAnalytics(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        status = '',
        dateFrom = '',
        dateTo = '',
        userId = ''
      } = req.query;

      // Build query
      const query = {};
      
      if (status) query.status = status;
      if (userId) query.userId = userId;
      
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      // Get transactions
      const transactions = await PhonepeTransaction.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Enhance with user details and subscription info
      const enhancedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          let userDetails = null;
          let subscriptionDetails = null;

          // Get user details from both schemas
          const [employee, employer] = await Promise.all([
            User.findById(transaction.userId).select('fullName name email userType phone mobile location').lean(),
            Employer.findById(transaction.userId).select('name email mobile CompanyName industry').lean()
          ]);

          userDetails = employee || employer;
          let userType = 'employee';
          
          if (employee) {
            userType = employee.userType || 'employee';
          } else if (employer) {
            userType = 'employer';
          }

          // Normalize user details based on schema
          if (userDetails) {
            userDetails.userType = userType;
            userDetails.name = userDetails.name || userDetails.fullName || userDetails.CompanyName || 'Unknown User';
            userDetails.mobile = userDetails.mobile || userDetails.phone || userDetails.Mobile;
          }

          // Try to extract subscription details from config
          if (transaction.config) {
            try {
              const config = JSON.parse(transaction.config);
              subscriptionDetails = {
                planName: config.data?.planName || 'Unknown Plan'
              };
            } catch (e) {
              // Ignore parsing errors
            }
          }

          return {
            ...transaction,
            userDetails,
            subscriptionDetails
          };
        })
      );

      const total = await PhonepeTransaction.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          transactions: enhancedTransactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get transaction analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch transaction analytics'
      });
    }
  }

  // Get usage analytics
  async getUsageAnalytics(req, res) {
    try {
      // Aggregate usage statistics
      const [employeeStats, employerStats] = await Promise.all([
        // Employee statistics
        UserSubscription.aggregate([
          { $match: { type: 'employee', status: 'active' } },
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              totalJobApplications: { $sum: '$usageData.jobApplicationsPerMonth' },
              totalJobSearches: { $sum: '$usageData.jobSearchPerDay' }
            }
          }
        ]),
        
        // Employer statistics
        UserSubscription.aggregate([
          { $match: { type: 'employer', status: 'active' } },
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              totalActiveJobPosts: { $sum: '$usageData.activeJobPosts' },
              totalCandidateSearches: { $sum: '$usageData.candidateSearchesPerDay' }
            }
          }
        ])
      ]);

      const aggregateStats = {
        totalUsers: (employeeStats[0]?.totalUsers || 0) + (employerStats[0]?.totalUsers || 0),
        employeeUsers: employeeStats[0]?.totalUsers || 0,
        employerUsers: employerStats[0]?.totalUsers || 0,
        totalJobApplications: employeeStats[0]?.totalJobApplications || 0,
        totalJobSearches: employeeStats[0]?.totalJobSearches || 0,
        totalActiveJobPosts: employerStats[0]?.totalActiveJobPosts || 0,
        totalCandidateSearches: employerStats[0]?.totalCandidateSearches || 0
      };

      res.status(200).json({
        success: true,
        data: {
          aggregateStats
        }
      });

    } catch (error) {
      console.error('Get usage analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch usage analytics'
      });
    }
  }

  // Get plan performance analytics
  async getPlanPerformance(req, res) {
    try {
      // Get all subscription plans
      const plans = await Subscription.find({ isActive: true });

      // Get performance metrics for each plan
      const planPerformance = await Promise.all(
        plans.map(async (plan) => {
          const [subscriptions, revenue] = await Promise.all([
            // Active subscriptions count
            UserSubscription.countDocuments({
              subscriptionId: plan._id,
              status: 'active'
            }),
            
            // Total revenue for this plan
            UserSubscription.aggregate([
              {
                $match: {
                  subscriptionId: plan._id,
                  status: { $ne: 'cancelled' }
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$amount' }
                }
              }
            ])
          ]);

          const totalRevenue = revenue[0]?.total || 0;
          const activeSubscriptions = subscriptions;
          const averageRevenuePerUser = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

          // Mock conversion rate (implement based on your tracking)
          const conversionRate = Math.random() * 20 + 5; // 5-25%

          return {
            plan: {
              _id: plan._id,
              name: plan.slug,
              displayName: plan.displayName,
              type: plan.type,
              price: plan.price
            },
            metrics: {
              activeSubscriptions,
              totalRevenue,
              averageRevenuePerUser,
              conversionRate
            }
          };
        })
      );

      res.status(200).json({
        success: true,
        data: planPerformance
      });

    } catch (error) {
      console.error('Get plan performance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch plan performance'
      });
    }
  }

  // Helper method to get user usage data
  async getUserUsageData(userId, type) {
    // Mock usage data - implement based on your actual usage tracking
    if (type === 'employee') {
      return {
        jobApplicationsPerMonth: Math.floor(Math.random() * 30),
        jobSearchPerDay: Math.floor(Math.random() * 50)
      };
    } else if (type === 'employer') {
      return {
        activeJobPosts: Math.floor(Math.random() * 10),
        candidateSearchesPerDay: Math.floor(Math.random() * 50)
      };
    }
    return {};
  }

  // Get subscription flow data for visualization
  async getSubscriptionFlow(req, res) {
    try {
      // Get subscription funnel data
      const [
        totalVisitors,
        planViews,
        initiatedPayments,
        completedPayments,
        activeSubscriptions,
        cancelledSubscriptions
      ] = await Promise.all([
        // Mock total visitors - implement based on your analytics
        Promise.resolve(Math.floor(Math.random() * 10000) + 5000),
        
        // Mock plan views - implement based on your analytics
        Promise.resolve(Math.floor(Math.random() * 2000) + 1000),
        
        // Initiated payments
        PhonepeTransaction.countDocuments({
          status: { $in: ['INITIATED', 'InProgress'] }
        }),
        
        // Completed payments
        PhonepeTransaction.countDocuments({
          status: { $in: ['SUCCESS', 'COMPLETED'] }
        }),
        
        // Active subscriptions
        UserSubscription.countDocuments({
          status: 'active'
        }),
        
        // Cancelled subscriptions
        UserSubscription.countDocuments({
          status: 'cancelled'
        })
      ]);

      const flowData = {
        funnel: [
          { stage: 'Visitors', count: totalVisitors, percentage: 100 },
          { stage: 'Plan Views', count: planViews, percentage: Math.round((planViews / totalVisitors) * 100) },
          { stage: 'Payment Initiated', count: initiatedPayments, percentage: Math.round((initiatedPayments / planViews) * 100) },
          { stage: 'Payment Completed', count: completedPayments, percentage: Math.round((completedPayments / initiatedPayments) * 100) },
          { stage: 'Active Subscriptions', count: activeSubscriptions, percentage: Math.round((activeSubscriptions / completedPayments) * 100) }
        ],
        retention: {
          active: activeSubscriptions,
          cancelled: cancelledSubscriptions,
          retentionRate: Math.round((activeSubscriptions / (activeSubscriptions + cancelledSubscriptions)) * 100)
        }
      };

      res.status(200).json({
        success: true,
        data: flowData
      });

    } catch (error) {
      console.error('Get subscription flow error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription flow data'
      });
    }
  }
}

module.exports = new SubscriptionAdminController();
