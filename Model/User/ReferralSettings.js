const mongoose = require('mongoose');

const referralSettingsSchema = new mongoose.Schema({
    referrerBonusAmount: {
        type: Number,
        default: 100,
        required: true
    },
    currency: {
        type: String,
        default: 'INR',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    minimumWithdrawal: {
        type: Number,
        default: 500
    },
    description: {
        type: String,
        default: 'Refer friends and earn rewards!'
    },
    termsAndConditions: {
        type: String,
        default: 'Terms and conditions apply.'
    }
}, {
    timestamps: true
});

// Ensure only one settings document exists
referralSettingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({
            referrerBonusAmount: 100,
            currency: 'INR',
            isActive: true
        });
    }
    return settings;
};

module.exports = mongoose.model('ReferralSettings', referralSettingsSchema);
