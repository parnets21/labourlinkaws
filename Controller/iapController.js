const axios = require('axios');
const mongoose = require('mongoose');
const UserSubscription = require('../Model/userSubscription');
const IAPService = require('../services/iapService');

// Apple's receipt validation URLs
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
const PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';

/**
 * Validate IAP receipt with Apple
 * POST /api/user/validateIAPReceipt
 */
exports.validateIAPReceipt = async (req, res) => {
    try {
        const { receipt, productId, transactionId, platform, userId } = req.body;

        console.log('Validating IAP receipt:', {
            productId,
            transactionId,
            platform,
            userId
        });

        // Validate platform
        if (platform !== 'ios') {
            return res.status(400).json({
                success: false,
                message: 'Invalid platform. Only iOS is supported.'
            });
        }

        // Validate required fields
        if (!receipt || !productId || !transactionId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: receipt, productId, transactionId'
            });
        }

        // Validate with Apple
        const validationResult = await verifyReceiptWithApple(receipt);

        if (!validationResult.success) {
            console.error('Receipt validation failed:', validationResult.error);
            return res.status(400).json({
                success: false,
                message: 'Receipt validation failed',
                error: validationResult.error
            });
        }

        // Extract purchase info from Apple's response
        const latestReceiptInfo = validationResult.data.latest_receipt_info?.[0] || 
                                 validationResult.data.receipt?.in_app?.[0];

        if (!latestReceiptInfo) {
            return res.status(400).json({
                success: false,
                message: 'No purchase information found in receipt'
            });
        }

        console.log('Receipt validated successfully:', {
            transactionId,
            productId,
            environment: validationResult.environment
        });

        res.json({
            success: true,
            message: 'Receipt validated successfully',
            data: {
                transactionId: latestReceiptInfo.transaction_id,
                productId: latestReceiptInfo.product_id,
                purchaseDate: new Date(parseInt(latestReceiptInfo.purchase_date_ms)),
                expiresDate: latestReceiptInfo.expires_date_ms ? 
                            new Date(parseInt(latestReceiptInfo.expires_date_ms)) : null,
                environment: validationResult.environment
            }
        });

    } catch (error) {
        console.error('Receipt validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Receipt validation failed',
            error: error.message
        });
    }
};

/**
 * Activate subscription after successful IAP purchase
 * POST /api/user/activateSubscription
 * Mirrors PhonePe payment processing
 */
exports.activateSubscription = async (req, res) => {
    try {
        console.log('=== IAP ACTIVATION REQUEST ===');
        console.log('Request body:', {
            ...req.body,
            iapReceipt: req.body.iapReceipt ? '[RECEIPT_DATA]' : null
        });

        // Use IAPService for processing (mirrors PaymentService)
        const result = await IAPService.processIAPPurchase(req.body);

        // Return response
        return res.status(200).json(result);

    } catch (error) {
        console.error('IAP activation error:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        // Handle specific MongoDB validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Transaction already exists',
                error: 'Duplicate transaction ID'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to activate subscription',
            error: error.message
        });
    }
};

/**
 * Get user's active subscriptions
 * GET /api/user/subscriptions/:userId
 * Mirrors PhonePe transaction history
 */
exports.getUserSubscriptions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { userType, limit, offset, status } = req.query;

        // Use IAPService for fetching (mirrors PaymentService)
        const subscriptions = await IAPService.getSubscriptionHistory(userId, {
            userType,
            limit: limit ? parseInt(limit) : 100,
            offset: offset ? parseInt(offset) : 0,
            status
        });

        // Add computed fields
        const enrichedSubscriptions = subscriptions.map(sub => {
            const now = new Date();
            
            return {
                ...sub,
                isActive: sub.status === 'active' && (!sub.endDate || sub.endDate > now),
                isExpired: sub.endDate && sub.endDate <= now,
                daysRemaining: sub.endDate ? Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24)) : null,
                isExpiringSoon: sub.endDate ? Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24)) <= 7 : false
            };
        });

        res.json({
            success: true,
            data: enrichedSubscriptions,
            count: enrichedSubscriptions.length,
            activeCount: enrichedSubscriptions.filter(sub => sub.isActive).length,
            pagination: {
                limit: limit ? parseInt(limit) : 100,
                offset: offset ? parseInt(offset) : 0
            }
        });

    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscriptions',
            error: error.message
        });
    }
};

/**
 * Refresh user's subscription status (useful for IAP sync issues)
 * POST /api/user/subscriptions/:userId/refresh
 */
exports.refreshUserSubscriptions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { userType } = req.body;

        console.log('Refreshing subscriptions for user:', userId, 'type:', userType);

        // Get all subscriptions for user
        const subscriptions = await UserSubscription.find({ userId })
            .populate('subscriptionId')
            .sort({ createdAt: -1 });

        // Update expired subscriptions
        const now = new Date();
        let updatedCount = 0;

        for (const subscription of subscriptions) {
            if (subscription.status === 'active' && subscription.endDate && subscription.endDate <= now) {
                subscription.status = 'expired';
                await subscription.save();
                updatedCount++;
            }
        }

        // Get fresh data
        const refreshedSubscriptions = await UserSubscription.find({ userId })
            .populate('subscriptionId')
            .sort({ createdAt: -1 });

        const activeSubscriptions = refreshedSubscriptions.filter(sub => 
            sub.status === 'active' && (!sub.endDate || sub.endDate > now)
        );

        res.json({
            success: true,
            message: 'Subscriptions refreshed successfully',
            data: {
                total: refreshedSubscriptions.length,
                active: activeSubscriptions.length,
                updated: updatedCount,
                subscriptions: refreshedSubscriptions
            }
        });

    } catch (error) {
        console.error('Error refreshing subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh subscriptions',
            error: error.message
        });
    }
};

/**
 * Handle Apple Server-to-Server notifications
 * POST /api/user/iap/webhook
 * Mirrors PhonePe callback handling
 */
exports.handleAppleWebhook = async (req, res) => {
    try {
        const notification = req.body;

        console.log('Received Apple webhook:', JSON.stringify(notification, null, 2));

        // Use IAPService for processing (mirrors PaymentService callback handling)
        await IAPService.handleAppleNotification(notification);

        // Always respond with 200 to acknowledge receipt
        res.status(200).json({
            success: true,
            message: 'Webhook processed successfully'
        });

    } catch (error) {
        console.error('Error handling Apple webhook:', error);
        // Still respond with 200 to prevent retries
        res.status(200).json({
            success: true,
            message: 'Webhook received'
        });
    }
};

/**
 * Verify receipt with Apple servers
 */
async function verifyReceiptWithApple(receipt) {
    const sharedSecret = process.env.APPLE_SHARED_SECRET;
    console.log('Using Apple Shared Secret:', sharedSecret ? `${sharedSecret.substring(0, 8)}...` : 'NOT SET');

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
            return {
                success: true,
                data: response.data,
                environment
            };
        } else {
            const errorMessage = getAppleStatusMessage(response.data.status);
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
 * Get human-readable message for Apple status codes
 */
function getAppleStatusMessage(status) {
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
 * Handle subscription renewal
 */
async function handleSubscriptionRenewal(receiptInfo) {
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
 */
async function handleRenewalFailure(receiptInfo) {
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
 */
async function handleSubscriptionCancellation(receiptInfo) {
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
 * Get IAP transaction report
 * GET /api/user/iap/report
 * Mirrors PhonePe payment report
 */
exports.getIAPReport = async (req, res) => {
    try {
        const { dateFrom, dateTo, status, userType } = req.query;

        const report = await IAPService.generateReport({
            dateFrom,
            dateTo,
            status,
            userType
        });

        res.json({
            success: true,
            data: report,
            message: 'IAP report generated successfully'
        });

    } catch (error) {
        console.error('Error generating IAP report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate IAP report',
            error: error.message
        });
    }
};

/**
 * Get active IAP subscriptions for a user
 * GET /api/user/iap/active/:userId
 * Mirrors PhonePe active subscriptions check
 */
exports.getActiveIAPSubscriptions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { userType } = req.query;

        const subscriptions = await IAPService.getActiveSubscriptions(userId, userType);

        res.json({
            success: true,
            data: subscriptions,
            count: subscriptions.length,
            message: 'Active IAP subscriptions retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching active IAP subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active IAP subscriptions',
            error: error.message
        });
    }
};

module.exports = exports;
