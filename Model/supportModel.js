const mongoose = require('mongoose');

const supportResponseSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  respondedAt: {
    type: Date,
    default: Date.now
  },
  isInternal: {
    type: Boolean,
    default: false
  }
});

const supportEnquirySchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  userType: {
    type: String,
    required: true,
    enum: ['Admin', 'Employer', 'Job Seeker', 'Interview Manager', 'Accounts Manager', 'Other']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Technical Issue',
      'Account & Billing',
      'Job Posting',
      'Feature Request',
      'Bug Report',
      'General Inquiry',
      'Payment Issue',
      'Profile Management',
      'Interview Scheduling',
      'Other'
    ]
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  attachmentPaths: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  responses: [supportResponseSchema],
  statusHistory: [{
    from: String,
    to: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  resolution: {
    type: String,
    trim: true
  },
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5
  },
  satisfactionFeedback: {
    type: String,
    trim: true
  },
  resolvedAt: Date,
  closedAt: Date,
  ipAddress: String,
  userAgent: String,
  source: {
    type: String,
    enum: ['web', 'mobile', 'api'],
    default: 'web'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
supportEnquirySchema.index({ status: 1, priority: 1 });
supportEnquirySchema.index({ createdAt: -1 });
supportEnquirySchema.index({ email: 1 });
supportEnquirySchema.index({ category: 1 });
supportEnquirySchema.index({ assignedTo: 1 });

// Virtual for response count
supportEnquirySchema.virtual('responseCount').get(function() {
  return this.responses ? this.responses.length : 0;
});

// Virtual for time since creation
supportEnquirySchema.virtual('timeElapsed').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Pre-save middleware to generate ticket ID
supportEnquirySchema.pre('save', function(next) {
  if (!this.ticketId) {
    this.ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  // Set resolved/closed timestamps
  if (this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  if (this.status === 'closed' && !this.closedAt) {
    this.closedAt = new Date();
  }
  
  next();
});

// Static method to get statistics
supportEnquirySchema.statics.getStatistics = function(dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);
  
  return this.aggregate([
    {
      $facet: {
        statusStats: [
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        priorityStats: [
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ],
        categoryStats: [
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        totalCount: [
          { $match: { createdAt: { $gte: startDate } } },
          { $count: 'total' }
        ]
      }
    }
  ]);
};

const SupportEnquiry = mongoose.model('SupportEnquiry', supportEnquirySchema);

module.exports = SupportEnquiry;