// Use the same UserSubscription model as regular subscriptions
const UserSubscription = require('../Model/User/userSubscription');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Validate user type by checking database schemas
 * @param {string} userId - User ID to validate
 * @returns {Promise<Object>} User type validation result
 */
async function validateUserType(userId) {
  try {
    const userModel = require('../Model/User/user');
    const EmployerModel = require('../Model/Employers/employers');

    // Check employee schema first
    let user = await userModel.findOne({ _id: userId, isDelete: false });
    if (user) {
      return { 
        success: true, 
        userType: 'employee', 
        user: user,
        schema: 'employee' 
      };
    }

    // Check employer schema
    user = await EmployerModel.findOne({ _id: userId, isDelete: false });
    if (user) {
      return { 
        success: true, 
        userType: 'employer', 
        user: user,
        schema: 'employer' 
      };
    }

    return { 
      success: false, 
      error: 'User not found in any schema' 
    };
  } catch (error) {
    console.error('Error validating user type:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Validate IAP product ID matches user type
 * @param {string} productId - IAP product ID
 * @param {string} userType - User type (employee/employer)
 * @returns {boolean} Whether product matches user type
 */
function validateProductForUserType(productId, userType) {
  // Define product ID patterns for each user type
  const employeeProducts = [
    'com.laborlink.employee.monthly',
    'com.laborlink.employee.yearly',
    'com.laborlink.jobseeker.premium',
    'com.laborlink.jobseeker.basic'
  ];
  
  const employerProducts = [
    'com.laborlink.employer.monthly',
    'com.laborlink.employer.yearly',
    'com.laborlink.employer.premium',
    'com.laborlink.employer.basic'
  ];

  if (userType === 'employee') {
    return employeeProducts.some(pattern => productId.includes(pattern.split('.').pop()) || productId === pattern);
  } else if (userType === 'employer') {
    return employerProducts.some(pattern => productId.includes(pattern.split('.').pop()) || productId === pattern);
  }

  return false;
}

/**
 * IAP Service - Mirrors PaymentService functionality for In-App Purchases
 * Provides complete feature parity with PhonePe integration
 */
class IAPService {
  
  /**
   * Process IAP purchase and activate subscription
   * This mirrors PaymentService.processSuccessfulPayment()
   * @param {Object} purchaseData - IAP purchase data from client
   * @returns {Promise<Object>} Processing result
   */
  static async processIAPPurchase(purchaseData) {
    try {
      const {
        userId,
        subscriptionId,
        transactionId,
        amount,
        planName,
        userType: clientUserType, // Rename to indicate this comes from client
        iapReceipt,
        iapProductId,
        startDate,
        endDate,
        duration,
        serviceType,
        serviceDescription,
        metadata
      } = purchaseData;

      console.log('=== IAP PURCHASE PROCESSING ===');
      console.log('Transaction ID:', transactionId);
      console.log('User ID:', userId);
      console.log('Plan:', planName);
      console.log('Client User Type:', clientUserType);
      console.log('IAP Product ID:', iapProductId);

      // CRITICAL: Validate user type from database, don't trust client
      const userValidation = await validateUserType(userId);
      if (!userValidation.success) {
        throw new Error(`User validation failed: ${userValidation.error}`);
      }

      const actualUserType = userValidation.userType;
      console.log('Validated User Type:', actualUserType);

      // CRITICAL: Validate IAP product matches user type
      if (iapProductId && !validateProductForUserType(iapProductId, actualUserType)) {
        throw new Error(`IAP Product ${iapProductId} is not valid for ${actualUserType} users. This appears to be a cross-contamination attempt.`);
      }

      // Warn if client sent wrong user type
      if (clientUserType && clientUserType !== actualUserType) {
        console.warn(`Client sent userType '${clientUserType}' but user is actually '${actualUserType}'. Using validated type.`);
      }

      // Check if transaction already exists (prevent duplicates)
      const existingSubscription = await UserSubscription.findOne({ transactionId });
      if (existingSubscription) {
        console.log('IAP transaction already processed:', transactionId);
        return {
          success: true,
          message: 'Transaction already processed',
          data: existingSubscription,
          isDuplicate: true
        };
      }

      // Validate required fields
      if (!userId || !transactionId || !planName) {
        throw new Error('Missing required fields: userId, transactionId, planName');
      }
      
      // Validate subscriptionId is provided (required by UserSubscription model)
      if (!subscriptionId) {
        throw new Error('Missing required field: subscriptionId. IAP purchases must be linked to a subscription plan.');
      }

      // Parse and validate dates
      const parsedStartDate = startDate ? new Date(startDate) : new Date();
      const parsedEndDate = endDate ? new Date(endDate) : null;

      if (isNaN(parsedStartDate.getTime())) {
        throw new Error('Invalid start date format');
      }

      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        throw new Error('Invalid end date format');
      }

      // Create subscription record with validated user type
      const subscriptionData = {
        userId: userId,
        subscriptionId: subscriptionId || null,
        transactionId,
        amount: Number(amount) || 0,
        status: 'active',
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        paymentMethod: 'Apple IAP', // Use Apple IAP directly since it's in the enum
        planName: planName.trim(),
        userType: actualUserType, // Use validated user type, not client-provided
        autoRenew: false,
        isActive: true,
        iapReceipt: iapReceipt || null,
        iapProductId: iapProductId || null,
        metadata: {
          source: 'IAP',
          platform: 'iOS',
          activatedAt: new Date(),
          originalAmount: amount,
          duration: duration || 'monthly',
          serviceType: serviceType || 'job_portal_subscription',
          serviceDescription: serviceDescription || this.getDefaultServiceDescription(actualUserType),
          validatedUserType: actualUserType,
          clientProvidedUserType: clientUserType,
          productValidated: !!iapProductId,
          ...metadata
        }
      };

      console.log('Creating IAP subscription:', {
        ...subscriptionData,
        iapReceipt: iapReceipt ? '[RECEIPT_DATA]' : null
      });

      console.log('=== ATTEMPTING DATABASE INSERT ===');
      console.log('Collection:', 'UserSubscription');
      console.log('Data keys:', Object.keys(subscriptionData));
      
      const newSubscription = await UserSubscription.create(subscriptionData);

      console.log('✅ IAP subscription activated successfully');
      console.log('Subscription ID:', newSubscription._id);
      console.log('User ID:', newSubscription.userId);
      console.log('Transaction ID:', newSubscription.transactionId);
      console.log('Status:', newSubscription.status);
      console.log('Plan Name:', newSubscription.planName);

      return {
        success: true,
        message: 'Subscription activated successfully',
        data: newSubscription,
        isDuplicate: false
      };

    } catch (error) {
      console.error('❌ IAP purchase processing error:', error);
      throw error;
    }
  }

  /**
   * Get default service description for user type
   * @param {string} userType - User type (employee/employer)
   * @returns {string} Service description
   */
  static getDefaultServiceDescription(userType) {
    if (userType === 'employer') {
      return 'Premium employer subscription with unlimited job postings and candidate access';
    } else {
      return 'Premium job seeker subscription with enhanced profile visibility and application features';
    }
  }

  /**
   * Validate IAP receipt with Apple servers
   * @param {Object} receiptData - Receipt validation data
   * @returns {Promise<Object>} Validation result
   */
  static async validateReceipt(receiptData) {
    const { receipt, productId, transactionId, platform } = receiptData;

    const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
    const PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
    const sharedSecret = process.env.APPLE_SHARED_SECRET;

    const requestBody = {
      'receipt-data': receipt,
      'exclude-old-transactions': true
    };

    if (sharedSecret) {
      requestBody.password = sharedSecret;
    }

    try {
      // Try production first
      console.log('Attempting production receipt validation...');
      let response = await axios.post(PRODUCTION_URL, requestBody, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      let environment = 'production';

      // Status 21007 means sandbox receipt sent to production
      if (response.data.status === 21007) {
        console.log('Sandbox receipt detected, retrying with sandbox URL...');
        response = await axios.post(SANDBOX_URL, requestBody, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
        environment = 'sandbox';
      }

      // Status 0 means success
      if (response.data.status === 0) {
        console.log('Receipt validation successful:', environment);
        
        const latestReceiptInfo = response.data.latest_receipt_info?.[0] || 
                                 response.data.receipt?.in_app?.[0];

        return {
          success: true,
          data: {
            transactionId: latestReceiptInfo?.transaction_id,
            productId: latestReceiptInfo?.product_id,
            purchaseDate: new Date(parseInt(latestReceiptInfo?.purchase_date_ms)),
            expiresDate: latestReceiptInfo?.expires_date_ms ? 
                        new Date(parseInt(latestReceiptInfo?.expires_date_ms)) : null,
            environment
          }
        };
      } else {
        const errorMessage = this.getAppleStatusMessage(response.data.status);
        console.error('Apple validation failed:', errorMessage);
        return {
          success: false,
          error: errorMessage,
          status: response.data.status
        };
      }
    } catch (error) {
      console.error('Apple API request failed:', error.message);
      return {
        success: false,
        error: `Apple API request failed: ${error.message}`
      };
    }
  }

  /**
   * Get user's IAP subscription history
   * Mirrors PaymentService.getTransactionHistory()
   * @param {String} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Subscription history
   */
  static async getSubscriptionHistory(userId, options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        status = null,
        userType = null,
        dateFrom = null,
        dateTo = null
      } = options;

      let query = { userId };
      
      if (status) {
        query.status = status;
      }

      if (userType) {
        query.type = userType; // Use 'type' field as per UserSubscription schema
      }
      
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      const subscriptions = await UserSubscription.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .populate('subscriptionId')
        .lean();

      return subscriptions;
    } catch (error) {
      console.error('Error fetching IAP subscription history:', error);
      throw error;
    }
  }

  /**
   * Get active subscriptions for a user
   * @param {String} userId - User ID
   * @param {String} userType - User type (employee/employer)
   * @returns {Promise<Array>} Active subscriptions
   */
  static async getActiveSubscriptions(userId, userType = null) {
    try {
      const now = new Date();
      let query = {
        userId,
        status: 'active',
        $or: [
          { endDate: null },
          { endDate: { $gt: now } }
        ]
      };

      if (userType) {
        query.userType = userType; // Use 'userType' field as per UserSubscription schema
      }

      const subscriptions = await UserSubscription.find(query)
        .populate('subscriptionId')
        .sort({ createdAt: -1 });

      return subscriptions;
    } catch (error) {
      console.error('Error fetching active IAP subscriptions:', error);
      throw error;
    }
  }

  /**
   * Handle Apple Server-to-Server notification
   * Mirrors PhonePe callback handling
   * @param {Object} notification - Apple notification data
   * @returns {Promise<Object>} Processing result
   */
  static async handleAppleNotification(notification) {
    try {
      const notificationType = notification.notification_type;
      const latestReceiptInfo = notification.latest_receipt_info;

      console.log('Processing Apple notification:', notificationType);

      switch (notificationType) {
        case 'INITIAL_BUY':
          console.log('New subscription purchased');
          break;

        case 'DID_RENEW':
          console.log('Subscription renewed');
          await this.handleSubscriptionRenewal(latestReceiptInfo);
          break;

        case 'DID_FAIL_TO_RENEW':
          console.log('Subscription renewal failed');
          await this.handleRenewalFailure(latestReceiptInfo);
          break;

        case 'CANCEL':
          console.log('Subscription cancelled');
          await this.handleSubscriptionCancellation(latestReceiptInfo);
          break;

        case 'DID_CHANGE_RENEWAL_STATUS':
          console.log('Renewal status changed');
          break;

        default:
          console.log('Unknown notification type:', notificationType);
      }

      return { success: true, message: 'Notification processed' };
    } catch (error) {
      console.error('Error handling Apple notification:', error);
      throw error;
    }
  }

  /**
   * Handle subscription renewal
   * @param {Object} receiptInfo - Receipt information
   */
  static async handleSubscriptionRenewal(receiptInfo) {
    try {
      const transactionId = receiptInfo.original_transaction_id;
      const subscription = await UserSubscription.findOne({ transactionId });

      if (subscription) {
        subscription.status = 'active';
        subscription.endDate = new Date(parseInt(receiptInfo.expires_date_ms));
        await subscription.save();
        console.log('Subscription renewed:', subscription._id);
      }
    } catch (error) {
      console.error('Error handling renewal:', error);
    }
  }

  /**
   * Handle renewal failure
   * @param {Object} receiptInfo - Receipt information
   */
  static async handleRenewalFailure(receiptInfo) {
    try {
      const transactionId = receiptInfo.original_transaction_id;
      const subscription = await UserSubscription.findOne({ transactionId });

      if (subscription) {
        subscription.status = 'expired';
        await subscription.save();
        console.log('Subscription marked as expired:', subscription._id);
      }
    } catch (error) {
      console.error('Error handling renewal failure:', error);
    }
  }

  /**
   * Handle subscription cancellation
   * @param {Object} receiptInfo - Receipt information
   */
  static async handleSubscriptionCancellation(receiptInfo) {
    try {
      const transactionId = receiptInfo.original_transaction_id;
      const subscription = await UserSubscription.findOne({ transactionId });

      if (subscription) {
        subscription.status = 'cancelled';
        await subscription.save();
        console.log('Subscription cancelled:', subscription._id);
      }
    } catch (error) {
      console.error('Error handling cancellation:', error);
    }
  }

  /**
   * Generate IAP transaction report
   * Mirrors PaymentService.generateTransactionReport()
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Report data
   */
  static async generateReport(filters = {}) {
    try {
      const {
        dateFrom,
        dateTo,
        status,
        userType
      } = filters;

      // Note: We store IAP info in metadata, so query by metadata
      let query = { 'metadata.paymentMethod': 'Apple IAP' };
      
      if (status) {
        query.status = status;
      }

      if (userType) {
        query.type = userType; // Use 'type' field as per UserSubscription schema
      }
      
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      const subscriptions = await UserSubscription.find(query);

      const report = {
        totalTransactions: subscriptions.length,
        totalRevenue: subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0),
        activeSubscriptions: subscriptions.filter(sub => sub.status === 'active').length,
        expiredSubscriptions: subscriptions.filter(sub => sub.status === 'expired').length,
        cancelledSubscriptions: subscriptions.filter(sub => sub.status === 'cancelled').length,
        byUserType: {
          employee: subscriptions.filter(sub => sub.type === 'employee').length,
          employer: subscriptions.filter(sub => sub.type === 'employer').length
        },
        byStatus: subscriptions.reduce((acc, sub) => {
          acc[sub.status] = (acc[sub.status] || 0) + 1;
          return acc;
        }, {}),
        revenueByMonth: this.calculateMonthlyRevenue(subscriptions)
      };

      return report;
    } catch (error) {
      console.error('Error generating IAP report:', error);
      throw error;
    }
  }

  /**
   * Calculate monthly revenue
   * @param {Array} subscriptions - Subscription list
   * @returns {Object} Monthly revenue data
   */
  static calculateMonthlyRevenue(subscriptions) {
    const monthlyData = {};
    
    subscriptions.forEach(sub => {
      const date = new Date(sub.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, revenue: 0, count: 0 };
      }
      
      monthlyData[monthKey].revenue += sub.amount || 0;
      monthlyData[monthKey].count += 1;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Get default service description based on user type
   * @param {String} userType - User type
   * @returns {String} Service description
   */
  static getDefaultServiceDescription(userType) {
    return userType === 'employer' 
      ? 'Job posting and candidate management platform access'
      : 'Job search and application platform access';
  }

  /**
   * Get human-readable message for Apple status codes
   * @param {Number} status - Apple status code
   * @returns {String} Status message
   */
  static getAppleStatusMessage(status) {
    const statusMessages = {
      21000: 'The App Store could not read the JSON object you provided.',
      21002: 'The data in the receipt-data property was malformed or missing.',
      21003: 'The receipt could not be authenticated.',
      21004: 'The shared secret you provided does not match the shared secret on file.',
      21005: 'The receipt server is not currently available.',
      21006: 'This receipt is valid but the subscription has expired.',
      21007: 'This receipt is from the test environment.',
      21008: 'This receipt is from the production environment.',
      21009: 'Internal data access error.',
      21010: 'The user account cannot be found or has been deleted.'
    };

    return statusMessages[status] || `Unknown status code: ${status}`;
  }

  /**
   * Validate transaction data
   * @param {Object} data - Transaction data
   * @returns {Object} Validation result
   */
  static validateTransactionData(data) {
    const errors = [];
    const requiredFields = ['userId', 'transactionId', 'planName'];

    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (data.amount && (isNaN(data.amount) || data.amount < 0)) {
      errors.push('Invalid amount value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = { 
  IAPService, 
  validateUserType, 
  validateProductForUserType 
};
