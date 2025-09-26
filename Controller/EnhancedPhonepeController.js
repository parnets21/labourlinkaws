const PaymentTransaction = require("../Model/Payment/PaymentTransaction");
const PaymentService = require("../services/PaymentService");
const axios = require("axios");
const crypto = require('crypto');

const {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
  MetaInfo,
  CreateSdkOrderRequest
} = require("pg-sdk-node");

const clientId = process.env.PHONEPE_CLIENT_ID || "SU2509221900139808161172";
const clientSecret = process.env.PHONEPE_CLIENT_SECRET || "2d5ea2d9-8043-4d9c-bd52-c586cfa1de5d";
const clientVersion = 1;
const env = process.env.NODE_ENV === 'production' ? Env.PRODUCTION : Env.PRODUCTION;

const client = StandardCheckoutClient.getInstance(
  clientId,
  clientSecret,
  clientVersion,
  env
);

class EnhancedPhonepeController {

  /**
   * Create payment for web (enhanced version)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createWebPayment(req, res) {
    try {
      const { userId, username, Mobile, orderId, amount, config, successUrl, failedUrl, subscriptionConfig } = req.body;
      
      // Validate input data
      const validation = PaymentService.validateTransactionData({
        userId, username, mobile: Mobile, amount, orderId
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
      }

      // Prepare enhanced transaction data
      const transactionData = {
        userId,
        username,
        mobile: Mobile.toString(),
        orderId: orderId || `ORD_${Date.now()}_${userId}`,
        amount: parseFloat(amount),
        paymentMethod: 'PhonePe',
        successUrl: successUrl || `${req.protocol}://${req.get('host')}/PaymentSuccess`,
        failedUrl: failedUrl || `${req.protocol}://${req.get('host')}/PaymentSuccess`,
        callbackUrl: `${req.protocol}://${req.get('host')}/api/user/payment-callback`,
        
        // Enhanced subscription configuration
        subscriptionConfig: subscriptionConfig ? {
          subscriptionId: subscriptionConfig.subscriptionId,
          planName: subscriptionConfig.planName,
          activationUrl: subscriptionConfig.activationUrl || `${req.protocol}://${req.get('host')}/api/user/activateSubscription`,
          activationMethod: 'POST',
          activationData: subscriptionConfig.activationData || {
            userId,
            subscriptionId: subscriptionConfig.subscriptionId,
            planName: subscriptionConfig.planName,
            amount: parseFloat(amount)
          }
        } : undefined,
        
        // Legacy config for backward compatibility
        config,
        
        // Audit information
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        deviceInfo: {
          platform: req.body.platform || 'web',
          version: req.body.appVersion,
          deviceId: req.body.deviceId
        },
        
        metadata: {
          source: 'web',
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer')
        }
      };

      // Create transaction using enhanced service
      const transaction = await PaymentService.createTransaction(transactionData);
      
      const merchantOrderId = transaction._id.toString();
      const redirectUrl = transactionData.successUrl;

      // Build the payment request for PhonePe SDK
      const paymentRequest = CreateSdkOrderRequest.StandardCheckoutBuilder()
        .merchantOrderId(merchantOrderId)
        .amount(Math.round(transaction.amount * 100)) // Convert to paise
        .redirectUrl(redirectUrl)
        .build();

      // Send payment request to PhonePe
      const phonepeResponse = await client.pay(paymentRequest);
      console.log("PhonePe SDK response:", phonepeResponse);
      
      const checkoutUrl = phonepeResponse.redirectUrl;

      if (!checkoutUrl) {
        console.error("Invalid PhonePe response:", phonepeResponse);
        await PaymentService.updateTransactionStatus(transaction._id, 'FAILED', {
          failureReason: 'PhonePe did not return a checkout URL',
          gatewayResponse: phonepeResponse
        });
        return res.status(500).json({
          success: false,
          error: "Payment gateway error",
          message: "Unable to initialize payment. Please try again."
        });
      }

      // Update transaction with gateway details
      await PaymentService.updateTransactionStatus(transaction._id, 'INITIATED', {
        gatewayOrderId: phonepeResponse.orderId,
        gatewayResponse: phonepeResponse
      });

      return res.status(200).json({
        success: true,
        data: {
          orderId: phonepeResponse.orderId,
          merchantTransactionId: merchantOrderId,
          transactionId: transaction._id,
          checkoutUrl: checkoutUrl,
          amount: transaction.amount,
          currency: transaction.currency
        },
        message: "Payment initialized successfully"
      });

    } catch (error) {
      console.error("Payment creation error:", error);
      return res.status(500).json({
        success: false,
        error: "Payment processing failed",
        message: error.message || "An unexpected error occurred"
      });
    }
  }

  /**
   * Create payment for mobile SDK (enhanced version)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createMobilePayment(req, res) {
    try {
      const { userId, username, Mobile, orderId, amount, config, subscriptionConfig } = req.body;
      
      // Validate input data
      const validation = PaymentService.validateTransactionData({
        userId, username, mobile: Mobile, amount, orderId
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
      }

      // Prepare transaction data for mobile
      const transactionData = {
        userId,
        username,
        mobile: Mobile.toString(),
        orderId: orderId || `MOB_${Date.now()}_${userId}`,
        amount: parseFloat(amount),
        paymentMethod: 'PhonePe',
        callbackUrl: `${req.protocol}://${req.get('host')}/api/user/payment-callback`,
        
        subscriptionConfig,
        config, // Legacy support
        
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceInfo: {
          platform: req.body.platform || 'mobile',
          version: req.body.appVersion,
          deviceId: req.body.deviceId
        },
        
        metadata: {
          source: 'mobile_sdk',
          platform: req.body.platform
        }
      };

      // Create transaction
      const transaction = await PaymentService.createTransaction(transactionData);
      const merchantTransactionId = transaction._id.toString();

      // Prepare payment payload for mobile SDK
      const paymentPayload = {
        merchantId: clientId,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: userId,
        amount: Math.round(transaction.amount * 100), // Convert to paise
        redirectUrl: `${req.protocol}://${req.get('host')}/PaymentSuccess?transactionId=${transaction._id}&userID=${userId}`,
        callbackUrl: transactionData.callbackUrl,
        mobileNumber: Mobile.toString(),
        paymentInstrument: {
          type: "PAY_PAGE"
        }
      };

      // Generate base64 encoded payload
      const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
      
      // Generate checksum for mobile SDK
      const stringToHash = base64Payload + '/pg/v1/pay' + clientSecret;
      const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
      const checksum = sha256Hash + '###' + clientVersion;

      // Update transaction status
      await PaymentService.updateTransactionStatus(transaction._id, 'INITIATED', {
        mobilePayload: paymentPayload,
        checksum: checksum
      });

      res.status(200).json({
        success: true,
        data: {
          merchantTransactionId: merchantTransactionId,
          transactionId: transaction._id,
          base64Payload: base64Payload,
          checksum: checksum,
          amount: transaction.amount,
          currency: transaction.currency,
          callbackUrl: transactionData.callbackUrl
        },
        message: "Mobile payment initialized successfully"
      });

    } catch (error) {
      console.error("Mobile payment creation error:", error);
      res.status(500).json({
        success: false,
        error: "Mobile payment processing failed",
        message: error.message || "An unexpected error occurred"
      });
    }
  }

  /**
   * Check payment status (enhanced version)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async checkPaymentStatus(req, res) {
    try {
      const { id: transactionId, userId } = req.params;
      
      if (!transactionId) {
        return res.status(400).json({
          success: false,
          error: "Transaction ID is required"
        });
      }

      // Get transaction from database
      const transaction = await PaymentTransaction.findById(transactionId)
        .populate('userId subscriptionConfig.subscriptionId');
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: "Transaction not found"
        });
      }

      // Verify user authorization
      if (userId && transaction.userId._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized access to transaction"
        });
      }

      try {
        // Check status with PhonePe gateway
        const gatewayResponse = await client.getOrderStatus(transactionId);
        console.log("PhonePe status response:", gatewayResponse);
        
        const gatewayStatus = gatewayResponse.state;
        let mappedStatus = this.mapGatewayStatus(gatewayStatus);
        
        // Update transaction if status changed
        if (transaction.status !== mappedStatus) {
          await PaymentService.updateTransactionStatus(transactionId, mappedStatus, {
            gatewayStatus,
            gatewayResponse,
            lastCheckedAt: new Date()
          });
          
          // Process successful payment
          if (mappedStatus === 'COMPLETED' && transaction.status !== 'COMPLETED') {
            try {
              const processingResult = await PaymentService.processSuccessfulPayment(transactionId, {
                gatewayStatus,
                gatewayResponse,
                processedAt: new Date()
              });
              console.log("Payment processing result:", processingResult);
            } catch (processingError) {
              console.error("Payment processing error:", processingError);
              // Don't fail the status check if post-processing fails
            }
          }
          
          // Refresh transaction data
          await transaction.reload();
        }

        return res.status(200).json({
          success: true,
          data: {
            transactionId: transaction._id,
            orderId: transaction.orderId,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
            paymentMethod: transaction.paymentMethod,
            createdAt: transaction.createdAt,
            completedAt: transaction.completedAt,
            gatewayStatus,
            isCompleted: transaction.isCompleted,
            isPending: transaction.isPending,
            isFailed: transaction.isFailed
          },
          message: "Payment status retrieved successfully"
        });
        
      } catch (gatewayError) {
        console.error("PhonePe status check error:", gatewayError);
        
        // Return cached transaction data if gateway check fails
        return res.status(200).json({
          success: true,
          data: {
            transactionId: transaction._id,
            orderId: transaction.orderId,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
            paymentMethod: transaction.paymentMethod,
            createdAt: transaction.createdAt,
            completedAt: transaction.completedAt,
            isCompleted: transaction.isCompleted,
            isPending: transaction.isPending,
            isFailed: transaction.isFailed
          },
          message: "Payment status retrieved from cache",
          note: "Gateway status check failed, returning cached data"
        });
      }

    } catch (error) {
      console.error("Payment status check error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to check payment status",
        message: error.message
      });
    }
  }

  /**
   * Handle payment callback from PhonePe
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handlePaymentCallback(req, res) {
    try {
      const { response } = req.body;

      if (!response) {
        return res.status(400).json({
          success: false,
          error: "No response data received"
        });
      }

      // Decode the response
      const decodedStr = Buffer.from(response, 'base64').toString('utf-8');
      const responseJson = JSON.parse(decodedStr);
      
      console.log('Payment callback data:', responseJson);
      
      const { merchantTransactionId, state, amount, transactionId } = responseJson?.data || {};

      if (!merchantTransactionId) {
        return res.status(400).json({
          success: false,
          error: "No merchant transaction ID in callback"
        });
      }

      // Find and update transaction
      const transaction = await PaymentTransaction.findById(merchantTransactionId);
      
      if (transaction) {
        const mappedStatus = this.mapGatewayStatus(state);
        
        await PaymentService.updateTransactionStatus(merchantTransactionId, mappedStatus, {
          gatewayTransactionId: transactionId,
          gatewayStatus: state,
          gatewayResponse: responseJson,
          callbackReceivedAt: new Date()
        });
        
        // Process successful payment
        if (mappedStatus === 'COMPLETED') {
          try {
            await PaymentService.processSuccessfulPayment(merchantTransactionId, {
              gatewayTransactionId: transactionId,
              gatewayStatus: state,
              gatewayResponse: responseJson,
              amount: amount ? amount / 100 : transaction.amount // Convert from paise
            });
            console.log(`Payment ${merchantTransactionId} processed successfully via callback`);
          } catch (processingError) {
            console.error("Callback processing error:", processingError);
          }
        }
        
        console.log(`Transaction ${merchantTransactionId} updated to ${mappedStatus} via callback`);
      } else {
        console.warn(`Transaction ${merchantTransactionId} not found for callback`);
      }

      res.status(200).json({
        success: true,
        message: 'Callback processed successfully'
      });
      
    } catch (error) {
      console.error("Callback processing error:", error);
      res.status(500).json({
        success: false,
        error: 'Callback processing failed',
        message: error.message
      });
    }
  }

  /**
   * Get transaction history for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTransactionHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10, offset = 0, status, dateFrom, dateTo } = req.query;

      const transactions = await PaymentService.getTransactionHistory(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        status,
        dateFrom,
        dateTo
      });

      res.status(200).json({
        success: true,
        data: transactions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: transactions.length
        },
        message: "Transaction history retrieved successfully"
      });

    } catch (error) {
      console.error("Error fetching transaction history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch transaction history",
        message: error.message
      });
    }
  }

  /**
   * Generate payment report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generatePaymentReport(req, res) {
    try {
      const { dateFrom, dateTo, status, paymentMethod } = req.query;

      const report = await PaymentService.generateTransactionReport({
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        status,
        paymentMethod
      });

      res.status(200).json({
        success: true,
        data: report,
        message: "Payment report generated successfully"
      });

    } catch (error) {
      console.error("Error generating payment report:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate payment report",
        message: error.message
      });
    }
  }

  /**
   * Map gateway status to internal status
   * @param {String} gatewayStatus - Gateway status
   * @returns {String} Mapped internal status
   */
  mapGatewayStatus(gatewayStatus) {
    const statusMap = {
      'INITIATED': 'INITIATED',
      'PENDING': 'PENDING',
      'SUCCESS': 'COMPLETED',
      'COMPLETED': 'COMPLETED',
      'FAILED': 'FAILED',
      'CANCELLED': 'CANCELLED',
      'EXPIRED': 'FAILED'
    };

    return statusMap[gatewayStatus] || 'PENDING';
  }
}

module.exports = new EnhancedPhonepeController();
