const axios = require('axios');
const UserSubscription = require('../Model/userSubscription');

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
 */
exports.activateSubscription = async (req, res) => {
    try {
        const {
            userId,
            subscriptionId,
            transactionId,
            amount,
            status,
            startDate,
            paymentMethod,
            planName,
            serviceType,
            serviceDescription,
            userType,
            iapReceipt,
            iapProductId
        } = req.body;

        console.log('Activating subscription:', {
            userId,
            subscriptionId,
            transactionId,
            paymentMethod
        });

        // Validate required fields
        if (!userId || !subscriptionId || !transactionId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, subscriptionId, transactionId'
            });
        }

        // Check if transaction already exists
        const existingSubscription = await UserSubscription.findOne({ transactionId });
        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                message: 'Transaction already processed',
                data: existingSubscription
            });
        }

        // Create subscription record
        const subscriptionData = {
            userId,
            subscriptionId,
            transactionId,
            amount: amount || 0,
            status: status || 'active',
            startDate: startDate || new Date(),
            paymentMethod: paymentMethod || 'Apple IAP',
            planName,
            serviceType: serviceType || 'job_portal_subscription',
            serviceDescription,
            userType,
            iapReceipt,
            iapProductId
        };

        const newSubscription = await UserSubscription.create(subscriptionData);

        console.log('Subscription activated successfully:', newSubscription._id);

        res.json({
            success: true,
            message: 'Subscription activated successfully',
            data: newSubscription
        });

    } catch (error) {
        console.error('Subscription activation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate subscription',
            error: error.message
        });
    }
};

/**
 * Get user's active subscriptions
 * GET /api/user/subscriptions/:userId
 */
exports.getUserSubscriptions = async (req, res) => {
    try {
        const { userId } = req.params;

        const subscriptions = await UserSubscription.find({ userId })
            .populate('subscriptionId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: subscriptions
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
 * Handle Apple Server-to-Server notifications
 * POST /api/user/iap/webhook
 */
exports.handleAppleWebhook = async (req, res) => {
    try {
        const notification = req.body;

        console.log('Received Apple webhook:', JSON.stringify(notification, null, 2));

        const notificationType = notification.notification_type;
        const latestReceiptInfo = notification.latest_receipt_info;

        // Handle different notification types
        switch (notificationType) {
            case 'INITIAL_BUY':
                console.log('New subscription purchased');
                break;

            case 'DID_RENEW':
                console.log('Subscription renewed');
                await handleSubscriptionRenewal(latestReceiptInfo);
                break;

            case 'DID_FAIL_TO_RENEW':
                console.log('Subscription renewal failed');
                await handleRenewalFailure(latestReceiptInfo);
                break;

            case 'CANCEL':
                console.log('Subscription cancelled');
                await handleSubscriptionCancellation(latestReceiptInfo);
                break;

            case 'DID_CHANGE_RENEWAL_STATUS':
                console.log('Renewal status changed');
                break;

            default:
                console.log('Unknown notification type:', notificationType);
        }

        // Always respond with 200 to acknowledge receipt
        res.status(200).send('OK');

    } catch (error) {
        console.error('Error handling Apple webhook:', error);
        // Still respond with 200 to prevent retries
        res.status(200).send('OK');
    }
};

/**
 * Verify receipt with Apple servers
 */
async function verifyReceiptWithApple(receipt) {
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

module.exports = exports;
