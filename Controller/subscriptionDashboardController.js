const UserSubscription = require('../Model/userSubscription');
const userModel = require('../Model/User/user');
const EmployerModel = require('../Model/Employers/employers');
const mongoose = require('mongoose');

/**
 * Get comprehensive subscription dashboard data
 * GET /api/subscription-dashboard/:userId
 */
exports.getDashboardData = async (req, res) => {
    try {
        const { userId } = req.params;
        const { userType } = req.query;

        console.log('Fetching dashboard data for user:', userId, 'type:', userType);

        // Validate user exists
        let user = await userModel.findById(userId);
        let detectedUserType = 'employee';
        
        if (!user) {
            user = await EmployerModel.findById(userId);
            if (user) detectedUserType = 'employer';
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const finalUserType = userType || detectedUserType;

        // Get all subscriptions for user
        const subscriptions = await UserSubscription.find({ userId })
            .populate('subscriptionId')
            .sort({ createdAt: -1 });

        // Calculate subscription analytics
        const now = new Date();
        const activeSubscriptions = subscriptions.filter(sub => 
            sub.status === 'active' && (!sub.endDate || sub.endDate > now)
        );

        const expiredSubscriptions = subscriptions.filter(sub => 
            sub.status === 'expired' || (sub.endDate && sub.endDate <= now)
        );

        const cancelledSubscriptions = subscriptions.filter(sub => 
            sub.status === 'cancelled'
        );

        // Calculate spending analytics
        const totalSpent = subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);
        
        // Calculate monthly spending
        const monthlySpending = calculateMonthlySpending(subscriptions);
        
        // Calculate subscription timeline
        const subscriptionTimeline = subscriptions.map(sub => ({
            id: sub._id,
            planName: sub.planName,
            amount: sub.amount,
            status: sub.status,
            startDate: sub.startDate,
            endDate: sub.endDate,
            paymentMethod: sub.paymentMethod,
            transactionId: sub.transactionId
        }));

        // Get usage data (this would integrate with your usage tracking)
        const usage = await getUserUsage(userId, finalUserType);

        // Calculate health score
        const healthScore = subscriptions.length > 0 
            ? Math.round((activeSubscriptions.length / subscriptions.length) * 100)
            : 0;

        const dashboardData = {
            user: {
                id: userId,
                userType: finalUserType,
                totalSubscriptions: subscriptions.length,
                activeSubscriptions: activeSubscriptions.length,
                expiredSubscriptions: expiredSubscriptions.length,
                cancelledSubscriptions: cancelledSubscriptions.length,
                totalSpent,
                healthScore,
                averageMonthlySpend: monthlySpending.length > 0 
                    ? monthlySpending.reduce((sum, month) => sum + month.amount, 0) / monthlySpending.length 
                    : 0
            },
            subscriptions: {
                all: subscriptions,
                active: activeSubscriptions,
                expired: expiredSubscriptions,
                cancelled: cancelledSubscriptions
            },
            analytics: {
                monthlySpending,
                subscriptionTimeline,
                spendingTrend: calculateSpendingTrend(monthlySpending),
                subscriptionRetention: calculateRetentionRate(subscriptions)
            },
            usage
        };

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
};

/**
 * Get user's payment history with analytics
 * GET /api/subscription-dashboard/:userId/payments
 */
exports.getPaymentHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Get subscriptions (which contain payment info)
        const subscriptions = await UserSubscription.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset));

        // Transform to payment format
        const payments = subscriptions.map(sub => ({
            id: sub._id,
            transactionId: sub.transactionId,
            amount: sub.amount,
            planName: sub.planName,
            status: sub.status === 'active' ? 'COMPLETED' : 'FAILED',
            paymentMethod: sub.paymentMethod,
            createdAt: sub.createdAt,
            startDate: sub.startDate,
            endDate: sub.endDate
        }));

        // Calculate payment analytics
        const totalPayments = payments.length;
        const successfulPayments = payments.filter(p => p.status === 'COMPLETED').length;
        const failedPayments = totalPayments - successfulPayments;
        const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        res.json({
            success: true,
            data: {
                payments,
                analytics: {
                    totalPayments,
                    successfulPayments,
                    failedPayments,
                    totalAmount,
                    successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0
                },
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: subscriptions.length === parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment history',
            error: error.message
        });
    }
};

/**
 * Get user's usage analytics
 * GET /api/subscription-dashboard/:userId/usage
 */
exports.getUsageAnalytics = async (req, res) => {
    try {
        const { userId } = req.params;
        const { userType } = req.query;

        const usage = await getUserUsage(userId, userType);

        res.json({
            success: true,
            data: usage
        });

    } catch (error) {
        console.error('Error fetching usage analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch usage analytics',
            error: error.message
        });
    }
};

/**
 * Helper function to calculate monthly spending
 */
function calculateMonthlySpending(subscriptions) {
    const monthlyData = {};
    
    subscriptions.forEach(sub => {
        const date = new Date(sub.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { 
                month: monthKey, 
                amount: 0, 
                count: 0,
                subscriptions: []
            };
        }
        
        monthlyData[monthKey].amount += sub.amount || 0;
        monthlyData[monthKey].count += 1;
        monthlyData[monthKey].subscriptions.push({
            id: sub._id,
            planName: sub.planName,
            amount: sub.amount
        });
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Helper function to calculate spending trend
 */
function calculateSpendingTrend(monthlySpending) {
    if (monthlySpending.length < 2) return 'stable';
    
    const recent = monthlySpending.slice(-2);
    const change = recent[1].amount - recent[0].amount;
    const percentChange = recent[0].amount > 0 ? (change / recent[0].amount) * 100 : 0;
    
    if (percentChange > 10) return 'increasing';
    if (percentChange < -10) return 'decreasing';
    return 'stable';
}

/**
 * Helper function to calculate retention rate
 */
function calculateRetentionRate(subscriptions) {
    const activeCount = subscriptions.filter(sub => sub.status === 'active').length;
    const totalCount = subscriptions.length;
    
    return totalCount > 0 ? (activeCount / totalCount) * 100 : 0;
}

/**
 * Helper function to get user usage data
 * This would integrate with your actual usage tracking system
 */
async function getUserUsage(userId, userType) {
    // Placeholder implementation - replace with actual usage tracking
    const defaultUsage = {
        employee: {
            jobApplicationsUsed: 0,
            jobApplicationsLimit: 10,
            jobSearchesUsed: 0,
            jobSearchesLimit: 50,
            profileViewsUsed: 0,
            profileViewsLimit: 100,
            companyViewsUsed: 0,
            companyViewsLimit: 25
        },
        employer: {
            jobPostsUsed: 0,
            jobPostsLimit: 5,
            candidateViewsUsed: 0,
            candidateViewsLimit: 20,
            searchesUsed: 0,
            searchesLimit: 50,
            applicationReviewsUsed: 0,
            applicationReviewsLimit: 100
        }
    };

    // Try to get actual usage from your usage tracking system
    try {
        // This would be replaced with actual usage API calls
        // const actualUsage = await UsageTrackingService.getUserUsage(userId);
        // return actualUsage;
        
        return defaultUsage[userType] || defaultUsage.employee;
    } catch (error) {
        console.log('Using default usage data:', error.message);
        return defaultUsage[userType] || defaultUsage.employee;
    }
}

module.exports = exports;