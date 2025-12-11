const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: [true, 'User ID is required'],
    index: true
  },

  // Subscription Information
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: false, // Made optional for IAP purchases
    index: true
  },
  planName: {
    type: String,
    required: true,
    trim: true
  },
  userType: {
    type: String,
    enum: ['employee', 'employer'],
    required: true
  },

  // Payment Information
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['PhonePe', 'Razorpay', 'Apple IAP', 'Google Play', 'Free', 'Manual'],
    default: 'PhonePe'
  },

  // Subscription Status
  status: {
    type: String,
    required: true,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'active',
    index: true
  },

  // Subscription Dates
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },

  // Service Information
  serviceType: {
    type: String,
    default: 'job_portal_subscription'
  },
  serviceDescription: {
    type: String
  },

  // IAP Specific Fields
  iapReceipt: {
    type: String,
    description: 'Apple IAP receipt data'
  },
  iapProductId: {
    type: String,
    description: 'Apple IAP product ID'
  },
  iapEnvironment: {
    type: String,
    enum: ['sandbox', 'production'],
    description: 'Apple IAP environment'
  },
  originalTransactionId: {
    type: String,
    description: 'Original transaction ID from Apple'
  },

  // Auto-renewal Information
  autoRenew: {
    type: Boolean,
    default: false
  },
  renewalDate: {
    type: Date
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    description: 'Additional subscription metadata'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSubscriptionSchema.index({ userId: 1, status: 1 });
userSubscriptionSchema.index({ status: 1, endDate: 1 });
userSubscriptionSchema.index({ createdAt: -1 });

// Virtual fields
userSubscriptionSchema.virtual('isActive').get(function() {
  if (this.status !== 'active') return false;
  if (!this.endDate) return true;
  return new Date() < this.endDate;
});

userSubscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const diff = this.endDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Instance Methods
userSubscriptionSchema.methods.expire = function() {
  this.status = 'expired';
  return this.save();
};

userSubscriptionSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.autoRenew = false;
  return this.save();
};

userSubscriptionSchema.methods.renew = function(newEndDate) {
  this.status = 'active';
  this.endDate = newEndDate;
  this.renewalDate = newEndDate;
  return this.save();
};

// Static Methods
userSubscriptionSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    userId,
    status: 'active',
    $or: [
      { endDate: null },
      { endDate: { $gt: new Date() } }
    ]
  }).populate('subscriptionId');
};

userSubscriptionSchema.statics.findByTransactionId = function(transactionId) {
  return this.findOne({ transactionId }).populate('userId subscriptionId');
};

userSubscriptionSchema.statics.getExpiringSoon = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    endDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  }).populate('userId subscriptionId');
};

// Pre-save middleware
userSubscriptionSchema.pre('save', function(next) {
  // Auto-expire if end date has passed
  if (this.endDate && new Date() > this.endDate && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Export model, checking if it already exists to avoid OverwriteModelError
module.exports = mongoose.models.UserSubscription || mongoose.model('UserSubscription', userSubscriptionSchema);
