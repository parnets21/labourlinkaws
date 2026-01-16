const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const documentSchema = new Schema(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      required: true,
      refPath: 'userModel' // Dynamic reference based on userModel field
    },
    userModel: {
      type: String,
      required: true,
      enum: ['user', 'Employer'] // References either User or Employer model
    },
    documentType: { 
      type: String, 
      required: true,
      enum: ['gst', 'pan', 'aadhar', 'tin'],
      index: true
    },
    originalName: { 
      type: String, 
      required: true 
    },
    s3Url: { 
      type: String, 
      required: true 
    },
    s3Key: { 
      type: String, 
      required: true 
    },
    fileSize: { 
      type: Number, 
      required: true 
    },
    mimeType: { 
      type: String, 
      required: true 
    },
    uploadedAt: { 
      type: Date, 
      default: Date.now,
      index: true
    },
    verificationStatus: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true
    },
    verifiedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'Admin',
      default: null
    },
    verifiedAt: { 
      type: Date,
      default: null
    },
    rejectionReason: { 
      type: String,
      default: null
    },
    isActive: { 
      type: Boolean, 
      default: true,
      index: true
    },
    // Unique document ID for tracking
    documentId: {
      type: String,
      unique: true,
      required: true
    }
  },
  { 
    timestamps: true,
    // Compound indexes for efficient queries
    indexes: [
      { userId: 1, documentType: 1, isActive: 1 },
      { verificationStatus: 1, uploadedAt: -1 },
      { userModel: 1, verificationStatus: 1 }
    ]
  }
);

// Generate unique document ID before saving
documentSchema.pre('save', function(next) {
  if (!this.documentId) {
    this.documentId = `doc_${this.userId}_${this.documentType}_${Date.now()}`;
  }
  next();
});

// Instance method to get document URL with expiration
documentSchema.methods.getSecureUrl = function() {
  return {
    url: this.s3Url,
    documentId: this.documentId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  };
};

// Static method to find documents by user and type
documentSchema.statics.findByUserAndType = function(userId, documentType, userModel = 'user') {
  return this.findOne({
    userId,
    documentType,
    userModel,
    isActive: true
  });
};

// Static method to get all pending documents for admin review
documentSchema.statics.getPendingDocuments = function(limit = 50) {
  return this.find({
    verificationStatus: 'pending',
    isActive: true
  })
  .populate('userId', 'fullName email name CompanyName')
  .sort({ uploadedAt: 1 })
  .limit(limit);
};

module.exports = mongoose.model("Document", documentSchema);