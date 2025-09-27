const PhonepeTransaction = require('../Model/PhonepeModel');
const UserSubscription = require('../Model/User/userSubscription');
const User = require('../Model/User/user');
const Employer = require('../Model/Employers/employers');
const axios = require('axios');

class PhonepeTransactionService {
  
  /**
   * Create a new PhonePe transaction record
   */
  async createTransaction(transactionData) {
    try {
      const transaction = new PhonepeTransaction({
        userId: transactionData.userId,
        username: transactionData.username,
        Mobile: transactionData.Mobile,
        orderId: transactionData.orderId || `ORD_${Date.now()}`,
        amount: transactionData.amount,
        config: transactionData.config,
        successUrl: transactionData.successUrl,
        failedUrl: transactionData.failedUrl,
        status: 'INITIATED',
        createdAt: new Date(),
        metadata: {
          userAgent: transactionData.userAgent,
          ipAddress: transactionData.ipAddress,
          platform: transactionData.platform
        }
      });

      const savedTransaction = await transaction.save();
      console.log('Transaction created:', savedTransaction._id);
      
      return savedTransaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(transactionId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updatedAt: new Date(),
        ...additionalData
      };

      const transaction = await PhonepeTransaction.findByIdAndUpdate(
        transactionId,
        updateData,
        { new: true }
      );

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      console.log(`Transaction ${transactionId} status updated to ${status}`);
      
      // If payment is successful, process subscription activation
      if (status === 'SUCCESS' || status === 'COMPLETED') {
        await this.processSuccessfulPayment(transaction);
      }

      return transaction;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  /**
   * Process successful payment and activate subscription
   */
  async processSuccessfulPayment(transaction) {
    try {
      console.log('Processing successful payment:', transaction._id);

      // Parse config to get subscription details
      let subscriptionData = null;
      if (transaction.config) {
        try {
          const config = JSON.parse(transaction.config);
          subscriptionData = config.data;
        } catch (parseError) {
          console.error('Error parsing transaction config:', parseError);
        }
      }

      if (!subscriptionData) {
        console.error('No subscription data found in transaction config');
        return;
      }

      // Create user subscription record
      const userSubscription = new UserSubscription({
        userId: transaction.userId,
        subscriptionId: subscriptionData.subscriptionId,
        planName: subscriptionData.planName,
        type: subscriptionData.subscriptionType,
        status: 'active',
        startDate: new Date(),
        endDate: this.calculateEndDate(subscriptionData.duration),
        amount: transaction.amount,
        paymentMethod: 'PhonePe',
        transactionId: transaction._id.toString(),
        features: subscriptionData.features,
        metadata: {
          activatedBy: 'phonepe_webhook',
          activatedAt: new Date(),
          transactionId: transaction._id
        }
      });

      await userSubscription.save();
      console.log('User subscription created:', userSubscription._id);

      // Clear config after successful processing
      transaction.config = null;
      await transaction.save();

      return userSubscription;
    } catch (error) {
      console.error('Error processing successful payment:', error);
      throw error;
    }
  }

  /**
   * Calculate subscription end date based on duration
   */
  calculateEndDate(duration) {
    const startDate = new Date();
    let endDate = new Date(startDate);

    switch (duration) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'lifetime':
        endDate.setFullYear(endDate.getFullYear() + 100);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
    }

    return endDate;
  }

  /**
   * Get transaction details with user information
   */
  async getTransactionDetails(transactionId) {
    try {
      const transaction = await PhonepeTransaction.findById(transactionId).lean();
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Get user details
      let userDetails = null;
      try {
        userDetails = await User.findById(transaction.userId).lean();
        if (!userDetails) {
          userDetails = await Employer.findById(transaction.userId).lean();
        }
      } catch (userError) {
        console.error('Error fetching user details:', userError);
      }

      // Get related subscription if exists
      let subscription = null;
      try {
        subscription = await UserSubscription.findOne({
          transactionId: transactionId.toString()
        }).populate('subscriptionId').lean();
      } catch (subError) {
        console.error('Error fetching subscription:', subError);
      }

      return {
        ...transaction,
        userDetails,
        subscription,
        timeline: this.generateTransactionTimeline(transaction)
      };
    } catch (error) {
      console.error('Error getting transaction details:', error);
      throw error;
    }
  }

  /**
   * Generate transaction timeline for tracking
   */
  generateTransactionTimeline(transaction) {
    const timeline = [];

    timeline.push({
      status: 'INITIATED',
      timestamp: transaction.createdAt,
      description: 'Payment initiated by user'
    });

    if (transaction.status !== 'INITIATED') {
      timeline.push({
        status: transaction.status,
        timestamp: transaction.updatedAt || transaction.createdAt,
        description: this.getStatusDescription(transaction.status)
      });
    }

    return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Get human-readable status description
   */
  getStatusDescription(status) {
    const descriptions = {
      'INITIATED': 'Payment request created',
      'PENDING': 'Payment processing',
      'InProgress': 'Payment in progress',
      'SUCCESS': 'Payment completed successfully',
      'COMPLETED': 'Payment completed successfully',
      'FAILED': 'Payment failed',
      'FAILURE': 'Payment failed',
      'CANCELLED': 'Payment cancelled by user'
    };

    return descriptions[status] || `Payment status: ${status}`;
  }

  /**
   * Get transaction statistics for admin dashboard
   */
  async getTransactionStatistics(filters = {}) {
    try {
      const matchQuery = {};
      
      if (filters.dateFrom || filters.dateTo) {
        matchQuery.createdAt = {};
        if (filters.dateFrom) matchQuery.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) matchQuery.createdAt.$lte = new Date(filters.dateTo);
      }

      if (filters.status) {
        matchQuery.status = filters.status;
      }

      if (filters.userId) {
        matchQuery.userId = filters.userId;
      }

      const stats = await PhonepeTransaction.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            successfulTransactions: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['SUCCESS', 'COMPLETED']] },
                  1,
                  0
                ]
              }
            },
            failedTransactions: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['FAILED', 'FAILURE']] },
                  1,
                  0
                ]
              }
            },
            pendingTransactions: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['PENDING', 'InProgress', 'INITIATED']] },
                  1,
                  0
                ]
              }
            },
            totalAmount: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['SUCCESS', 'COMPLETED']] },
                  '$amount',
                  0
                ]
              }
            },
            averageAmount: { $avg: '$amount' }
          }
        }
      ]);

      const result = stats[0] || {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
        totalAmount: 0,
        averageAmount: 0
      };

      // Calculate success rate
      result.successRate = result.totalTransactions > 0 
        ? (result.successfulTransactions / result.totalTransactions * 100).toFixed(2)
        : 0;

      return result;
    } catch (error) {
      console.error('Error getting transaction statistics:', error);
      throw error;
    }
  }

  /**
   * Retry failed transaction
   */
  async retryTransaction(transactionId) {
    try {
      const transaction = await PhonepeTransaction.findById(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'SUCCESS' || transaction.status === 'COMPLETED') {
        throw new Error('Cannot retry successful transaction');
      }

      // Update status to pending for retry
      transaction.status = 'PENDING';
      transaction.updatedAt = new Date();
      transaction.retryCount = (transaction.retryCount || 0) + 1;
      
      await transaction.save();
      
      console.log(`Transaction ${transactionId} marked for retry`);
      return transaction;
    } catch (error) {
      console.error('Error retrying transaction:', error);
      throw error;
    }
  }

  /**
   * Get user transaction history
   */
  async getUserTransactionHistory(userId, options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        status = null
      } = options;

      const query = { userId };
      if (status) query.status = status;

      const transactions = await PhonepeTransaction.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean();

      const total = await PhonepeTransaction.countDocuments(query);

      return {
        transactions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + transactions.length) < total
        }
      };
    } catch (error) {
      console.error('Error getting user transaction history:', error);
      throw error;
    }
  }
}

module.exports = new PhonepeTransactionService();
