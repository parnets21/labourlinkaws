const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    // Note: This can reference either 'user' (employee) or 'Employer' model
    // We don't set a static ref here to allow flexibility
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: [true, 'Subscription ID is required']
  },
  planName: {
    type: String,
    required: [true, 'Plan name is required']
  },
  type: {
    type: String,
    enum: ['employee', 'employer'],
    required: [true, 'Subscription type is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'cancelled'],
    default: 'active',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentMethod: {
    type: String,
    enum: ['PhonePe', 'Free', 'Razorpay', 'Stripe', 'Manual'],
    required: [true, 'Payment method is required']
  },
  transactionId: {
    type: String,
    sparse: true // Allows multiple null values
  },
  features: {
    type: mongoose.Schema.Types.Mixed,
    description: 'Subscription features available to the user'
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  renewalDate: {
    type: Date
  },
  cancellationDate: {
    type: Date
  },
  cancellationReason: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    description: 'Additional subscription metadata'
  }
}, {
  timestamps: true,
  id: false
});

// Indexes for performance
userSubscriptionSchema.index({ userId: 1, status: 1 });
userSubscriptionSchema.index({ subscriptionId: 1 });
userSubscriptionSchema.index({ endDate: 1, status: 1 });
userSubscriptionSchema.index({ userId: 1, type: 1, status: 1 });

// Virtual for checking if subscription is currently active
userSubscriptionSchema.virtual('isCurrentlyActive').get(function() {
  return this.status === 'active' && this.endDate > new Date();
});

// Method to calculate end date based on subscription duration
userSubscriptionSchema.methods.calculateEndDate = function(subscription) {
  const startDate = this.startDate || new Date();
  let endDate = new Date(startDate);
  
  switch (subscription.duration) {
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'quarterly':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case 'lifetime':
      endDate.setFullYear(endDate.getFullYear() + 100); // Set to 100 years from now
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
  }
  
  return endDate;
};

// Pre-save middleware to set end date if not provided
userSubscriptionSchema.pre('save', async function(next) {
  if (this.isNew && !this.endDate) {
    try {
      const Subscription = mongoose.model('Subscription');
      const subscription = await Subscription.findById(this.subscriptionId);
      if (subscription) {
        this.endDate = this.calculateEndDate(subscription);
        this.type = subscription.type;
        this.features = subscription.features;
      }
    } catch (error) {
      console.error('Error setting subscription end date:', error);
    }
  }
  next();
});

// Static method to get active subscription for user
userSubscriptionSchema.statics.getActiveSubscription = function(userId, type = null) {
  const query = {
    userId,
    status: 'active',
    endDate: { $gt: new Date() }
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.findOne(query)
    .populate('subscriptionId')
    .sort({ startDate: -1 });
};

// Static method to check if user has active subscription
userSubscriptionSchema.statics.hasActiveSubscription = async function(userId, type = null) {
  const subscription = await this.getActiveSubscription(userId, type);
  return !!subscription;
};

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
