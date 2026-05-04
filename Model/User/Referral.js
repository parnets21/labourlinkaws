const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    referringUser: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: false }, // Made optional for registration-based referrals
    status: { type: String, enum: ['pending', 'completed', 'hired', 'rejected'], default: 'pending' },
    bonusStatus: { type: String, enum: ['pending', 'approved', 'paid', 'unpaid'], default: 'pending' },
    bonusAmount: { type: Number, default: 0 },
    referralType: { type: String, enum: ['registration', 'job'], default: 'registration' }, // Track referral type
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Referral', referralSchema);