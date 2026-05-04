const User = require('../Model/User/user');
const Referral = require('../Model/User/Referral');
const ReferralSettings = require('../Model/User/ReferralSettings');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate unique referral code
const generateReferralCode = (userId) => {
    const hash = crypto.createHash('sha256').update(userId.toString()).digest('hex');
    return hash.substring(0, 8).toUpperCase();
};

// Get user's referral code
exports.getReferralCode = async (req, res) => {
    try {
        const userId = req.user._id;
        const referralCode = generateReferralCode(userId);

        // For mobile app, you can use:
        // 1. Play Store link: https://play.google.com/store/apps/details?id=com.labor_link&referrer=ref%3D${referralCode}
        // 2. Deep link: laborlink://register?ref=${referralCode}
        // 3. Landing page: https://laborlink.co.in/app-download?ref=${referralCode}
        
        const shareUrl = `https://play.google.com/store/apps/details?id=com.labor_link&referrer=ref%3D${referralCode}`;

        res.status(200).json({
            status: 'success',
            data: {
                referralCode,
                shareUrl
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Create referral by sharing code
exports.createReferralByCode = async (req, res) => {
    try {
        const { referralCode } = req.body;
        const referredUserId = req.user._id;

        // Find referring user by code (use userType instead of role)
        const users = await User.find({ userType: 'employee' });
        let referringUser = null;

        for (const user of users) {
            if (generateReferralCode(user._id) === referralCode.toUpperCase()) {
                referringUser = user;
                break;
            }
        }

        if (!referringUser) {
            return res.status(404).json({
                status: 'fail',
                message: 'Invalid referral code'
            });
        }

        // Check if user is trying to refer themselves
        if (referringUser._id.toString() === referredUserId.toString()) {
            return res.status(400).json({
                status: 'fail',
                message: 'You cannot refer yourself'
            });
        }

        // Check if referral already exists
        const existingReferral = await Referral.findOne({
            referringUser: referringUser._id,
            referredUser: referredUserId
        });

        if (existingReferral) {
            return res.status(400).json({
                status: 'fail',
                message: 'Referral already exists'
            });
        }

        // Get referral settings for bonus amount
        const settings = await ReferralSettings.getSettings();
        const bonusAmount = settings.referrerBonusAmount || 100;

        // Create referral record (registration-based, no job required)
        const referral = await Referral.create({
            referringUser: referringUser._id,
            referredUser: referredUserId,
            referralType: 'registration',
            status: 'completed', // Completed immediately on registration
            bonusStatus: 'approved', // Auto-approved for registration referrals
            bonusAmount: bonusAmount
        });

        // Add to user's referrals array
        await User.findByIdAndUpdate(referringUser._id, {
            $push: {
                referrals: {
                    referredUser: referredUserId,
                    status: 'completed',
                    bonusStatus: 'approved',
                    bonusAmount: bonusAmount
                }
            }
        });

        res.status(201).json({
            status: 'success',
            message: `Referral bonus of ₹${bonusAmount} approved!`,
            data: { referral }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get user's referral statistics
exports.getReferralStats = async (req, res) => {
    try {
        console.log('📊 Get referral stats request');
        console.log('- User:', req.user?._id);
        console.log('- Auth header:', req.headers.authorization ? 'Present' : 'Missing');

        if (!req.user || !req.user._id) {
            console.log('❌ No user found in request');
            return res.status(401).json({
                status: 'fail',
                message: 'Authentication required. Please log in again.'
            });
        }

        const userId = req.user._id;
        console.log('🔍 Fetching referrals for user:', userId);

        const referrals = await Referral.find({ referringUser: userId })
            .populate('referredUser', 'fullName email')
            .populate('job', 'title company');

        console.log(`✅ Found ${referrals.length} referrals`);

        const stats = {
            totalReferrals: referrals.length,
            pendingReferrals: referrals.filter(r => r.status === 'pending').length,
            hiredReferrals: referrals.filter(r => r.status === 'hired').length,
            rejectedReferrals: referrals.filter(r => r.status === 'rejected').length,
            completedReferrals: referrals.filter(r => r.status === 'completed').length,
            totalEarnings: referrals
                .filter(r => r.bonusStatus === 'paid')
                .reduce((sum, r) => sum + (r.bonusAmount || 0), 0),
            pendingEarnings: referrals
                .filter(r => r.bonusStatus === 'approved' || r.bonusStatus === 'unpaid')
                .reduce((sum, r) => sum + (r.bonusAmount || 0), 0)
        };

        res.status(200).json({
            status: 'success',
            data: {
                stats,
                referrals
            }
        });
    } catch (err) {
        console.error('❌ Get referral stats error:', err);
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};
exports.getReferralHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const referrals = await Referral.find({ referringUser: userId })
            .populate('referredUser', 'fullName email')
            .populate('job', 'title company location')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Referral.countDocuments({ referringUser: userId });

        res.status(200).json({
            status: 'success',
            data: {
                referrals,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                total: count
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};
exports.sendReferralInvitation = async (req, res) => {
    try {
        const { email, message } = req.body;
        const userId = req.user._id;
        const user = await User.findById(userId);

        const referralCode = generateReferralCode(userId);
        const shareUrl = `https://play.google.com/store/apps/details?id=com.labor_link&referrer=ref%3D${referralCode}`;

        // Configure email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `${user.fullName || 'Someone'} invited you to join LaborLink`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>You've been invited to join LaborLink!</h2>
                    <p>${user.fullName || 'Someone'} thinks you'd be a great fit for LaborLink.</p>
                    ${message ? `<p><em>"${message}"</em></p>` : ''}
                    <p>Use the referral code below to sign up:</p>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
                        ${referralCode}
                    </div>
                    <p style="text-align: center; margin-top: 20px;">
                        <a href="${shareUrl}" style="background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Join Now
                        </a>
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            status: 'success',
            message: 'Invitation sent successfully'
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
        const { referralId } = req.params;
        const { bonusAmount = 5000 } = req.body;

        const referral = await Referral.findById(referralId)
            .populate('referringUser')
            .populate('referredUser');

        if (!referral) {
            return res.status(404).json({
                status: 'fail',
                message: 'Referral not found'
            });
        }

        if (referral.bonusStatus === 'paid') {
            return res.status(400).json({
                status: 'fail',
                message: 'Bonus already paid'
            });
        }

        // Update referral status
        referral.status = 'hired';
        referral.bonusStatus = 'paid';
        referral.bonusAmount = bonusAmount;
        await referral.save();

        // Update user's referrals array
        const user = await User.findById(referral.referringUser._id);
        const userReferral = user.referrals.find(
            r => r.referredUser.toString() === referral.referredUser._id.toString()
        );

        if (userReferral) {
            userReferral.status = 'hired';
            userReferral.bonusStatus = 'paid';
            userReferral.bonusDetails = {
                amount: bonusAmount,
                currency: 'INR',
                paidAt: new Date(),
                transactionId: `TXN${Date.now()}`
            };
            await user.save();
        }

        res.status(200).json({
            status: 'success',
            data: { referral }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};
exports.validateReferralCode = async (req, res) => {
    try {
        const { code } = req.params;
        console.log('🔍 Validating referral code:', code);

        // Use userType field (not role)
        const users = await User.find({ userType: 'employee' });
        console.log(`📊 Found ${users.length} employees to check`);
        
        if (users.length === 0) {
            console.log('⚠️ No employees found in database!');
        }
        
        let referringUser = null;

        for (const user of users) {
            const userCode = generateReferralCode(user._id);
            
            // Log first 5 codes for debugging
            if (users.indexOf(user) < 5) {
                console.log(`User ${user._id}: ${userCode} (${user.fullName || user.email})`);
            }
            
            if (userCode === code.toUpperCase()) {
                console.log(`✅ Match found! User: ${user.fullName || user.email}, Code: ${userCode}`);
                referringUser = user;
                break;
            }
        }

        if (!referringUser) {
            console.log(`❌ No match found for code: ${code} (checked ${users.length} users)`);
            return res.status(200).json({
                status: 'success',
                data: {
                    isValid: false,
                    referrerName: null
                }
            });
        }

        console.log('✅ Returning valid response for:', referringUser.fullName || referringUser.email);
        res.status(200).json({
            status: 'success',
            data: {
                isValid: true,
                referrerName: referringUser.fullName || `${referringUser.profile?.firstName || ''} ${referringUser.profile?.lastName || ''}`.trim() || 'Unknown User',
                referrerId: referringUser._id
            }
        });
    } catch (err) {
        console.error('❌ Error in validateReferralCode:', err);
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};


// Get referral settings (public - no auth required)
exports.getReferralSettings = async (req, res) => {
    try {
        const settings = await ReferralSettings.getSettings();
        
        res.status(200).json({
            status: 'success',
            data: {
                referrerBonusAmount: settings.referrerBonusAmount,
                currency: settings.currency,
                isActive: settings.isActive,
                minimumWithdrawal: settings.minimumWithdrawal,
                description: settings.description,
                termsAndConditions: settings.termsAndConditions
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Update referral settings (admin only)
exports.updateReferralSettings = async (req, res) => {
    try {
        const {
            referrerBonusAmount,
            currency,
            isActive,
            minimumWithdrawal,
            description,
            termsAndConditions
        } = req.body;

        let settings = await ReferralSettings.findOne();
        
        if (!settings) {
            settings = await ReferralSettings.create(req.body);
        } else {
            if (referrerBonusAmount !== undefined) settings.referrerBonusAmount = referrerBonusAmount;
            if (currency !== undefined) settings.currency = currency;
            if (isActive !== undefined) settings.isActive = isActive;
            if (minimumWithdrawal !== undefined) settings.minimumWithdrawal = minimumWithdrawal;
            if (description !== undefined) settings.description = description;
            if (termsAndConditions !== undefined) settings.termsAndConditions = termsAndConditions;
            
            await settings.save();
        }

        res.status(200).json({
            status: 'success',
            message: 'Referral settings updated successfully',
            data: settings
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get all referrals (admin only)
exports.getAllReferrals = async (req, res) => {
    try {
        const referrals = await Referral.find()
            .populate('referringUser', 'fullName email')
            .populate('referredUser', 'fullName email')
            .populate('job', 'title company location')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: referrals
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};
