const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Payment Method Details
  type: {
    type: String,
    required: [true, 'Payment method type is required'],
    enum: ['card', 'upi', 'netbanking', 'wallet', 'emi'],
    lowercase: true
  },
  
  provider: {
    type: String,
    required: [true, 'Payment provider is required'],
    enum: ['PhonePe', 'Razorpay', 'Stripe', 'PayPal', 'Paytm', 'GooglePay'],
    index: true
  },
  
  // Card Details (encrypted/tokenized)
  cardDetails: {
    last4: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{4}$/.test(v);
        },
        message: 'Last 4 digits must be exactly 4 numbers'
      }
    },
    brand: {
      type: String,
      enum: ['Visa', 'Mastercard', 'RuPay', 'Amex', 'Diners', 'Discover'],
      uppercase: true
    },
    expiryMonth: {
      type: Number,
      min: 1,
      max: 12
    },
    expiryYear: {
      type: Number,
      min: new Date().getFullYear()
    },
    holderName: {
      type: String,
      trim: true,
      uppercase: true
    }
  },
  
  // UPI Details
  upiDetails: {
    vpa: {
      type: String,
      lowercase: true,
      validate: {
        validator: function(v) {
          return !v || /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(v);
        },
        message: 'Please enter a valid UPI ID'
      }
    },
    provider: {
      type: String,
      enum: ['PhonePe', 'GooglePay', 'Paytm', 'BHIM', 'Other']
    }
  },
  
  // Bank Details
  bankDetails: {
    bankName: String,
    accountType: {
      type: String,
      enum: ['savings', 'current', 'cc', 'other']
    },
    ifscCode: {
      type: String,
      uppercase: true,
      validate: {
        validator: function(v) {
          return !v || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
        },
        message: 'Please enter a valid IFSC code'
      }
    }
  },
  
  // Wallet Details
  walletDetails: {
    walletId: String,
    provider: {
      type: String,
      enum: ['Paytm', 'PhonePe', 'MobiKwik', 'FreeCharge', 'AmazonPay', 'Other']
    }
  },
  
  // Gateway Integration
  gatewayDetails: {
    tokenId: String, // Gateway token for this payment method
    customerId: String, // Gateway customer ID
    methodId: String, // Gateway method ID
    fingerprint: String // Unique fingerprint for duplicate detection
  },
  
  // Status and Preferences
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Usage Statistics
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsedAt: Date,
  totalAmountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Security
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'expired'],
    default: 'pending'
  },
  verificationDate: Date,
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    description: 'Additional payment method metadata'
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
paymentMethodSchema.index({ userId: 1, isDefault: 1 });
paymentMethodSchema.index({ userId: 1, isActive: 1 });
paymentMethodSchema.index({ provider: 1, type: 1 });
paymentMethodSchema.index({ 'gatewayDetails.fingerprint': 1 }, { sparse: true });

// Virtual fields
paymentMethodSchema.virtual('displayName').get(function() {
  switch (this.type) {
    case 'card':
      return `${this.cardDetails.brand || 'Card'} ending in ${this.cardDetails.last4 || '****'}`;
    case 'upi':
      return this.upiDetails.vpa || 'UPI';
    case 'netbanking':
      return this.bankDetails.bankName || 'Net Banking';
    case 'wallet':
      return `${this.walletDetails.provider || 'Wallet'}`;
    default:
      return this.type.toUpperCase();
  }
});

paymentMethodSchema.virtual('isExpired').get(function() {
  if (this.type === 'card' && this.cardDetails.expiryMonth && this.cardDetails.expiryYear) {
    const expiryDate = new Date(this.cardDetails.expiryYear, this.cardDetails.expiryMonth - 1, 1);
    return expiryDate < new Date();
  }
  return false;
});

// Instance Methods
paymentMethodSchema.methods.markAsUsed = function(amount = 0) {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  this.totalAmountPaid += amount;
  return this.save();
};

paymentMethodSchema.methods.verify = function() {
  this.isVerified = true;
  this.verificationStatus = 'verified';
  this.verificationDate = new Date();
  return this.save();
};

paymentMethodSchema.methods.setAsDefault = async function() {
  // Remove default status from other payment methods
  await this.constructor.updateMany(
    { userId: this.userId, _id: { $ne: this._id } },
    { isDefault: false }
  );
  
  this.isDefault = true;
  return this.save();
};

// Static Methods
paymentMethodSchema.statics.getDefaultForUser = function(userId) {
  return this.findOne({ userId, isDefault: true, isActive: true });
};

paymentMethodSchema.statics.getActiveMethodsForUser = function(userId) {
  return this.find({ userId, isActive: true }).sort({ isDefault: -1, lastUsedAt: -1 });
};

paymentMethodSchema.statics.findByFingerprint = function(fingerprint) {
  return this.findOne({ 'gatewayDetails.fingerprint': fingerprint });
};

// Pre-save middleware
paymentMethodSchema.pre('save', async function(next) {
  // Ensure only one default payment method per user
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  
  // Generate fingerprint for duplicate detection
  if (this.isNew && !this.gatewayDetails.fingerprint) {
    let fingerprint = '';
    if (this.type === 'card' && this.cardDetails.last4) {
      fingerprint = `card_${this.cardDetails.last4}_${this.cardDetails.expiryMonth}_${this.cardDetails.expiryYear}`;
    } else if (this.type === 'upi' && this.upiDetails.vpa) {
      fingerprint = `upi_${this.upiDetails.vpa}`;
    }
    this.gatewayDetails.fingerprint = fingerprint;
  }
  
  next();
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
