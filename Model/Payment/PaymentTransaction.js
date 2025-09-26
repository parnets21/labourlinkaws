const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: [true, 'User ID is required'],
    index: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v); // Indian mobile number validation
      },
      message: 'Please enter a valid 10-digit mobile number'
    }
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },

  // Order Information
  orderId: {
    type: String,
    required: [true, 'Order ID is required'],
    unique: true,
    index: true
  },
  merchantTransactionId: {
    type: String,
    required: [true, 'Merchant transaction ID is required'],
    unique: true,
    index: true
  },

  // Payment Information
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v * 100); // Ensure amount has max 2 decimal places
      },
      message: 'Amount can have maximum 2 decimal places'
    }
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR'],
    uppercase: true
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['PhonePe', 'Razorpay', 'Stripe', 'PayPal', 'Manual'],
    default: 'PhonePe'
  },

  // Transaction Status
  status: {
    type: String,
    required: true,
    enum: ['INITIATED', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'],
    default: 'INITIATED',
    index: true
  },
  transactionStatus: {
    type: String,
    enum: ['CR', 'DR', 'PENDING', 'FAILED'],
    default: 'PENDING'
  },

  // Gateway Information
  gatewayTransactionId: {
    type: String,
    sparse: true, // Allows multiple null values
    index: true
  },
  gatewayOrderId: {
    type: String,
    sparse: true
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    description: 'Complete gateway response for debugging'
  },

  // URLs and Configuration
  successUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Success URL must be a valid HTTP/HTTPS URL'
    }
  },
  failedUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Failed URL must be a valid HTTP/HTTPS URL'
    }
  },
  callbackUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Callback URL must be a valid HTTP/HTTPS URL'
    }
  },

  // Subscription Configuration (for subscription payments)
  subscriptionConfig: {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    planName: String,
    activationUrl: String,
    activationMethod: {
      type: String,
      enum: ['POST', 'PUT', 'PATCH'],
      default: 'POST'
    },
    activationData: mongoose.Schema.Types.Mixed
  },

  // Legacy config field (for backward compatibility)
  config: {
    type: String,
    description: 'Legacy configuration field - use subscriptionConfig instead'
  },

  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  failedAt: Date,
  refundedAt: Date,

  // Additional Information
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    description: 'Additional transaction metadata'
  },
  
  // Retry Information
  retryCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  lastRetryAt: Date,

  // Audit Fields
  ipAddress: String,
  userAgent: String,
  deviceInfo: {
    platform: String,
    version: String,
    deviceId: String
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
paymentTransactionSchema.index({ userId: 1, status: 1 });
paymentTransactionSchema.index({ createdAt: -1 });
paymentTransactionSchema.index({ status: 1, createdAt: -1 });
paymentTransactionSchema.index({ 'subscriptionConfig.subscriptionId': 1 });

// Virtual fields
paymentTransactionSchema.virtual('isCompleted').get(function() {
  return this.status === 'COMPLETED';
});

paymentTransactionSchema.virtual('isFailed').get(function() {
  return ['FAILED', 'CANCELLED'].includes(this.status);
});

paymentTransactionSchema.virtual('isPending').get(function() {
  return ['INITIATED', 'PENDING'].includes(this.status);
});

paymentTransactionSchema.virtual('amountInPaise').get(function() {
  return Math.round(this.amount * 100);
});

// Instance Methods
paymentTransactionSchema.methods.markCompleted = function(gatewayData = {}) {
  this.status = 'COMPLETED';
  this.completedAt = new Date();
  if (gatewayData.transactionId) {
    this.gatewayTransactionId = gatewayData.transactionId;
  }
  if (gatewayData.orderId) {
    this.gatewayOrderId = gatewayData.orderId;
  }
  this.gatewayResponse = gatewayData;
  return this.save();
};

paymentTransactionSchema.methods.markFailed = function(reason = '', gatewayData = {}) {
  this.status = 'FAILED';
  this.failedAt = new Date();
  this.metadata = { ...this.metadata, failureReason: reason };
  this.gatewayResponse = gatewayData;
  return this.save();
};

paymentTransactionSchema.methods.incrementRetry = function() {
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  return this.save();
};

// Static Methods
paymentTransactionSchema.statics.findByOrderId = function(orderId) {
  return this.findOne({ orderId }).populate('userId subscriptionConfig.subscriptionId');
};

paymentTransactionSchema.statics.findByGatewayTransactionId = function(gatewayTransactionId) {
  return this.findOne({ gatewayTransactionId }).populate('userId subscriptionConfig.subscriptionId');
};

paymentTransactionSchema.statics.getTransactionHistory = function(userId, limit = 10, offset = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('subscriptionConfig.subscriptionId');
};

paymentTransactionSchema.statics.getTransactionsByStatus = function(status, limit = 50) {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId subscriptionConfig.subscriptionId');
};

paymentTransactionSchema.statics.getPendingTransactions = function() {
  return this.find({ 
    status: { $in: ['INITIATED', 'PENDING'] },
    createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
  }).populate('userId subscriptionConfig.subscriptionId');
};

paymentTransactionSchema.statics.getFailedTransactionsForRetry = function() {
  return this.find({
    status: 'FAILED',
    retryCount: { $lt: 3 },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  }).populate('userId subscriptionConfig.subscriptionId');
};

// Pre-save middleware
paymentTransactionSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate merchant transaction ID if not provided
    if (!this.merchantTransactionId) {
      this.merchantTransactionId = this._id.toString();
    }
    
    // Set initiated timestamp
    if (!this.initiatedAt) {
      this.initiatedAt = new Date();
    }
  }
  
  // Update completion timestamp
  if (this.isModified('status')) {
    if (this.status === 'COMPLETED' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (['FAILED', 'CANCELLED'].includes(this.status) && !this.failedAt) {
      this.failedAt = new Date();
    }
  }
  
  next();
});

// Post-save middleware for logging
paymentTransactionSchema.post('save', function(doc) {
  console.log(`Payment transaction ${doc._id} status updated to: ${doc.status}`);
});

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
