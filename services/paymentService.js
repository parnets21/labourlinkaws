const PaymentTransaction = require('../Model/Payment/PaymentTransaction');
const PaymentMethod = require('../Model/Payment/PaymentMethod');
const UserSubscription = require('../Model/User/userSubscription');
const axios = require('axios');
const crypto = require('crypto');

class PaymentService {
  
  /**
   * Create a new payment transaction
   * @param {Object} paymentData - Payment transaction data
   * @returns {Promise<Object>} Created transaction
   */
  static async createTransaction(paymentData) {
    try {
      // Validate required fields
      const requiredFields = ['userId', 'username', 'mobile', 'amount', 'orderId'];
      for (const field of requiredFields) {
        if (!paymentData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Create transaction with enhanced data structure
      const transaction = new PaymentTransaction({
        userId: paymentData.userId,
        username: paymentData.username,
        mobile: paymentData.mobile.toString(),
        email: paymentData.email,
        orderId: paymentData.orderId,
        amount: parseFloat(paymentData.amount),
        currency: paymentData.currency || 'INR',
        paymentMethod: paymentData.paymentMethod || 'PhonePe',
        description: paymentData.description,
        successUrl: paymentData.successUrl,
        failedUrl: paymentData.failedUrl,
        callbackUrl: paymentData.callbackUrl,
        
        // Enhanced subscription configuration
        subscriptionConfig: paymentData.subscriptionConfig ? {
          subscriptionId: paymentData.subscriptionConfig.subscriptionId,
          planName: paymentData.subscriptionConfig.planName,
          activationUrl: paymentData.subscriptionConfig.activationUrl,
          activationMethod: paymentData.subscriptionConfig.activationMethod || 'POST',
          activationData: paymentData.subscriptionConfig.activationData
        } : undefined,
        
        // Legacy config for backward compatibility
        config: paymentData.config,
        
        // Device and audit information
        ipAddress: paymentData.ipAddress,
        userAgent: paymentData.userAgent,
        deviceInfo: paymentData.deviceInfo,
        
        metadata: paymentData.metadata || {}
      });

      const savedTransaction = await transaction.save();
      console.log(`Payment transaction created: ${savedTransaction._id}`);
      
      return savedTransaction;
    } catch (error) {
      console.error('Error creating payment transaction:', error);
      throw error;
    }
  }

  /**
   * Update transaction status
   * @param {String} transactionId - Transaction ID
   * @param {String} status - New status
   * @param {Object} gatewayData - Gateway response data
   * @returns {Promise<Object>} Updated transaction
   */
  static async updateTransactionStatus(transactionId, status, gatewayData = {}) {
    try {
      const transaction = await PaymentTransaction.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const validStatuses = ['INITIATED', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      // Update status using instance methods
      if (status === 'COMPLETED') {
        await transaction.markCompleted(gatewayData);
      } else if (['FAILED', 'CANCELLED'].includes(status)) {
        await transaction.markFailed(gatewayData.failureReason || status, gatewayData);
      } else {
        transaction.status = status;
        transaction.gatewayResponse = gatewayData;
        await transaction.save();
      }

      console.log(`Transaction ${transactionId} status updated to: ${status}`);
      return transaction;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  /**
   * Process successful payment and execute subscription activation
   * @param {String} transactionId - Transaction ID
   * @param {Object} gatewayData - Gateway response data
   * @returns {Promise<Object>} Processing result
   */
  static async processSuccessfulPayment(transactionId, gatewayData = {}) {
    try {
      const transaction = await PaymentTransaction.findById(transactionId)
        .populate('userId subscriptionConfig.subscriptionId');
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'COMPLETED') {
        return { success: true, message: 'Transaction already processed', transaction };
      }

      // Mark transaction as completed
      await transaction.markCompleted(gatewayData);

      // Execute subscription activation if configured
      let subscriptionResult = null;
      if (transaction.subscriptionConfig && transaction.subscriptionConfig.subscriptionId) {
        subscriptionResult = await this.activateSubscription(transaction);
      } else if (transaction.config) {
        // Legacy config execution
        try {
          const configData = JSON.parse(transaction.config);
          const response = await axios(configData);
          subscriptionResult = response.data;
          console.log('Legacy config executed successfully');
        } catch (configError) {
          console.error('Legacy config execution error:', configError);
          // Don't fail the payment if subscription activation fails
        }
      }

      return {
        success: true,
        message: 'Payment processed successfully',
        transaction,
        subscriptionResult
      };
    } catch (error) {
      console.error('Error processing successful payment:', error);
      throw error;
    }
  }

  /**
   * Activate subscription after successful payment
   * @param {Object} transaction - Payment transaction
   * @returns {Promise<Object>} Activation result
   */
  static async activateSubscription(transaction) {
    try {
      const { subscriptionConfig, userId, amount } = transaction;
      
      if (!subscriptionConfig || !subscriptionConfig.subscriptionId) {
        throw new Error('Subscription configuration not found');
      }

      const activationData = {
        userId: userId._id || userId,
        subscriptionId: subscriptionConfig.subscriptionId,
        planName: subscriptionConfig.planName,
        amount: amount,
        paymentMethod: transaction.paymentMethod,
        transactionId: transaction._id.toString(),
        ...subscriptionConfig.activationData
      };

      // Call activation endpoint
      const response = await axios({
        method: subscriptionConfig.activationMethod,
        url: subscriptionConfig.activationUrl,
        data: activationData,
        timeout: 30000
      });

      console.log(`Subscription activated for user ${userId}: ${subscriptionConfig.planName}`);
      return response.data;
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for a user
   * @param {String} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Transaction history
   */
  static async getTransactionHistory(userId, options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        status = null,
        dateFrom = null,
        dateTo = null
      } = options;

      let query = { userId };
      
      if (status) {
        query.status = status;
      }
      
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      const transactions = await PaymentTransaction.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .populate('subscriptionConfig.subscriptionId')
        .lean();

      return transactions;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  /**
   * Get transaction by order ID
   * @param {String} orderId - Order ID
   * @returns {Promise<Object>} Transaction
   */
  static async getTransactionByOrderId(orderId) {
    try {
      return await PaymentTransaction.findByOrderId(orderId);
    } catch (error) {
      console.error('Error fetching transaction by order ID:', error);
      throw error;
    }
  }

  /**
   * Retry failed transactions
   * @param {String} transactionId - Transaction ID
   * @returns {Promise<Object>} Retry result
   */
  static async retryFailedTransaction(transactionId) {
    try {
      const transaction = await PaymentTransaction.findById(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'FAILED') {
        throw new Error('Only failed transactions can be retried');
      }

      if (transaction.retryCount >= 3) {
        throw new Error('Maximum retry attempts exceeded');
      }

      await transaction.incrementRetry();
      transaction.status = 'INITIATED';
      await transaction.save();

      console.log(`Transaction ${transactionId} marked for retry (attempt ${transaction.retryCount})`);
      return transaction;
    } catch (error) {
      console.error('Error retrying transaction:', error);
      throw error;
    }
  }

  /**
   * Get pending transactions for monitoring
   * @returns {Promise<Array>} Pending transactions
   */
  static async getPendingTransactions() {
    try {
      return await PaymentTransaction.getPendingTransactions();
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      throw error;
    }
  }

  /**
   * Generate transaction report
   * @param {Object} criteria - Report criteria
   * @returns {Promise<Object>} Transaction report
   */
  static async generateTransactionReport(criteria = {}) {
    try {
      const {
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        dateTo = new Date(),
        status = null,
        paymentMethod = null
      } = criteria;

      let matchStage = {
        createdAt: { $gte: dateFrom, $lte: dateTo }
      };

      if (status) matchStage.status = status;
      if (paymentMethod) matchStage.paymentMethod = paymentMethod;

      const report = await PaymentTransaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            completedTransactions: {
              $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
            },
            completedAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$amount', 0] }
            },
            failedTransactions: {
              $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
            },
            averageAmount: { $avg: '$amount' }
          }
        }
      ]);

      const statusBreakdown = await PaymentTransaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      return {
        summary: report[0] || {
          totalTransactions: 0,
          totalAmount: 0,
          completedTransactions: 0,
          completedAmount: 0,
          failedTransactions: 0,
          averageAmount: 0
        },
        statusBreakdown,
        period: { from: dateFrom, to: dateTo }
      };
    } catch (error) {
      console.error('Error generating transaction report:', error);
      throw error;
    }
  }

  /**
   * Validate transaction data
   * @param {Object} data - Transaction data to validate
   * @returns {Object} Validation result
   */
  static validateTransactionData(data) {
    const errors = [];
    
    // Required field validation
    const requiredFields = ['userId', 'username', 'mobile', 'amount', 'orderId'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Amount validation
    if (data.amount && (isNaN(data.amount) || parseFloat(data.amount) <= 0)) {
      errors.push('Amount must be a positive number');
    }

    // Mobile number validation
    if (data.mobile && !/^[6-9]\d{9}$/.test(data.mobile.toString())) {
      errors.push('Invalid mobile number format');
    }

    // Email validation (if provided)
    if (data.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = PaymentService;