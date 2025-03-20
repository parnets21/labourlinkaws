const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../Model/User');
const JobApplication = require('../Model/JobApplication');

class PaymentService {
    static async createPaymentIntent(amount, currency = 'inr', metadata = {}) {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100, // Convert to cents
                currency,
                metadata
            });
            return paymentIntent;
        } catch (error) {
            console.error('Payment intent creation error:', error);
            throw error;
        }
    }

    static async processApplicationFee(applicationId) {
        try {
            const application = await JobApplication.findById(applicationId)
                .populate('job')
                .populate('applicant');

            if (!application) {
                throw new Error('Application not found');
            }

            const paymentIntent = await this.createPaymentIntent(
                application.job.isPremium ? process.env.PREMIUM_APPLICATION_FEE : process.env.STANDARD_APPLICATION_FEE,
                'inr',
                { applicationId: application._id.toString() }
            );

            application.applicationFee = {
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                status: 'pending',
                transactionId: paymentIntent.id
            };

            await application.save();
            return paymentIntent;
        } catch (error) {
            console.error('Application fee processing error:', error);
            throw error;
        }
    }

    static async processReferralBonus(referralId) {
        try {
            const referringUser = await User.findOne({
                'referrals._id': referralId
            });

            if (!referringUser) {
                throw new Error('Referral not found');
            }

            const referral = referringUser.referrals.id(referralId);
            
            if (referral.bonusStatus === 'paid') {
                throw new Error('Bonus already paid');
            }

            // Calculate bonus amount based on job category
            const application = await JobApplication.findOne({
                applicant: referral.referredUser,
                status: 'selected'
            }).populate('job');

            if (!application) {
                throw new Error('No successful application found for referred user');
            }

            const bonusAmount = this.calculateBonusAmount(application.job.category);

            // Process transfer to referring user's connected account
            const transfer = await stripe.transfers.create({
                amount: bonusAmount * 100,
                currency: 'inr',
                destination: referringUser.stripeAccountId,
                description: `Referral bonus for ${referral.referredUser}`
            });

            // Update referral status
            referral.bonusStatus = 'paid';
            referral.bonusDetails = {
                amount: bonusAmount,
                transferId: transfer.id,
                paidAt: new Date()
            };

            await referringUser.save();
            return transfer;
        } catch (error) {
            console.error('Referral bonus processing error:', error);
            throw error;
        }
    }

    static calculateBonusAmount(jobCategory) {
        const baseBonusAmount = 5000; // Base amount in INR
        const categoryMultiplier = {
            'entry': 1,
            'mid': 1.5,
            'senior': 2,
            'executive': 3
        };
        return baseBonusAmount * (categoryMultiplier[jobCategory] || 1);
    }

    static async verifyPayment(paymentIntentId) {
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            
            if (paymentIntent.status === 'succeeded') {
                // Update application fee status if this was an application payment
                if (paymentIntent.metadata.applicationId) {
                    await JobApplication.findByIdAndUpdate(
                        paymentIntent.metadata.applicationId,
                        {
                            'applicationFee.status': 'paid'
                        }
                    );
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Payment verification error:', error);
            throw error;
        }
    }

    static async createStripeAccount(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Create a Connected Account for the user
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'IN',
                email: user.email,
                capabilities: {
                    transfers: {requested: true}
                }
            });

            user.stripeAccountId = account.id;
            await user.save();

            // Create an account link for onboarding
            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: `${process.env.FRONTEND_URL}/stripe/refresh`,
                return_url: `${process.env.FRONTEND_URL}/stripe/return`,
                type: 'account_onboarding'
            });

            return accountLink;
        } catch (error) {
            console.error('Stripe account creation error:', error);
            throw error;
        }
    }
}

module.exports = PaymentService;
