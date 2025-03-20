const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    referringUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    status: { type: String, enum: ['pending', 'hired', 'rejected'], default: 'pending' },
    bonusStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Referral', referralSchema);

