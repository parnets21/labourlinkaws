const User = require('../Model/User');
const Job = require('../Model/Job');
const JobApplication = require('../Model/JobApplication');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createReferral = async (req, res) => {
    try {
        const { email, jobId } = req.body;

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            throw new Error('Job not found');
        }

        // Check if referred email already exists
        let referredUser = await User.findOne({ email });
        
        if (!referredUser) {
            // Create new user account with temporary password
            const tempPassword = Math.random().toString(36).slice(-8);
            referredUser = await User.create({
                email,
                password: tempPassword,
                role: 'employee',
                isActive: false // Requires activation
            });

            // Send invitation email with temporary password
            // Implementation depends on your email service
        }

        // Add referral to referring user
        const referringUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: {
                    referrals: {
                        referredUser: referredUser._id,
                        status: 'pending'
                    }
                }
            },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            data: {
                referral: referringUser.referrals[referringUser.referrals.length - 1]
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.processReferralBonus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        
        const application = await JobApplication.findById(applicationId)
            .populate('applicant')
            .populate('job');

        if (!application) {
            throw new Error('Application not found');
        }

        // Find referring user
        const referringUser = await User.findOne({
            'referrals.referredUser': application.applicant._id
        });

        if (!referringUser) {
            throw new Error('No referral found for this application');
        }

        // Get the specific referral
        const referral = referringUser.referrals.find(
            ref => ref.referredUser.toString() === application.applicant._id.toString()
        );

        if (referral.status === 'hired') {
            throw new Error('Referral bonus already processed');
        }

        // Calculate bonus based on job category/level
        const bonusAmount = calculateBonusAmount(application.job);

        // Create transfer to referring user's bank account
        const transfer = await stripe.transfers.create({
            amount: bonusAmount * 100, // Convert to cents
            currency: 'inr',
            destination: referringUser.stripeAccountId, // Assuming user has connected Stripe account
            description: `Referral bonus for ${application.applicant.email}`
        });

        // Update referral status
        referral.status = 'hired';
        referral.bonusStatus = 'paid';
        await referringUser.save();

        res.status(200).json({
            status: 'success',
            data: {
                transfer,
                referral
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Helper function to calculate bonus amount based on job details
const calculateBonusAmount = (job) => {
    const baseBonusAmount = 5000; // Base amount in INR
    
    // Multiply base amount based on job category
    const categoryMultiplier = {
        'entry': 1,
        'mid': 1.5,
        'senior': 2,
        'executive': 3
    };

    return baseBonusAmount * (categoryMultiplier[job.category] || 1);
};
