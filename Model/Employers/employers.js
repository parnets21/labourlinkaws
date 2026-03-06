const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const employerSchema = new Schema(
  {
    mobile: { type: Number, required: true, unique: true },
    age: { type: Number, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    
    // Address details
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: Number },
    country: { type: String },
    address: { type: String },

    // Company details
    hiring: { type: Boolean, default: false },
    MyCompany: { type: Boolean, default: false },
    CompanyName: { type: String },
    companyWebsite: { type: String },
    numberOfemp: { type: Number },
    // Cascading dropdown fields - store IDs for proper relationships
    industryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Industry',
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true
    },
    jobRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory', // SubCategory is the job role
      index: true
    },
    // Legacy field - kept for backward compatibility
    industry: { type: String },
    GstNum: { type: String },
    PanNum: { type: String },
    TanNum: { type: String }, // Add TAN field
    isIndividualEmployer: { type: Boolean, default: false }, // Add individual employer flag
    deviceId: { type: String },
    platform: { type: String, enum: ["android", "ios"] },
    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now },
    EmployerImg:String,
    fcmToken: { type: String },
    
    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    
    // Document verification fields
    documents: [{
      type: Schema.Types.ObjectId,
      ref: 'Document'
    }],
    documentVerificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true
    },
    requiredDocuments: {
      type: [String],
      default: function() {
        // Default required documents for employers: GST + PAN
        return ['gst', 'pan'];
      }
    },
    documentSubmittedAt: { 
      type: Date,
      default: null
    },
    // Employer type for document requirements
    employerType: {
      type: String,
      enum: ['employer', 'startup_employer'],
      default: 'employer'
    },
    
    // Additional fields
    isPrime: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false }, // Only approved employers can post jobs
    status: { type: String, default: "Pending", enum: ["Pending", "Active","Approved", "Rejected"] },
    isDelete: { type: Boolean, default: false },
    isBlock: { type: Boolean, default: false },
    searchCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Instance method to check if all required documents are uploaded
employerSchema.methods.hasAllRequiredDocuments = function() {
  return this.documents && this.documents.length >= this.requiredDocuments.length;
};

// Instance method to get missing documents
employerSchema.methods.getMissingDocuments = async function() {
  if (!this.documents || this.documents.length === 0) {
    return this.requiredDocuments;
  }
  
  const Document = mongoose.model('Document');
  const uploadedDocs = await Document.find({
    _id: { $in: this.documents },
    isActive: true
  }).select('documentType');
  
  const uploadedTypes = uploadedDocs.map(doc => doc.documentType);
  return this.requiredDocuments.filter(type => !uploadedTypes.includes(type));
};

// Instance method to update required documents based on employer type
employerSchema.methods.updateRequiredDocuments = function() {
  switch (this.employerType) {
    case 'employer':
      this.requiredDocuments = ['gst', 'pan'];
      break;
    case 'startup_employer':
      this.requiredDocuments = ['pan', 'tin'];
      break;
    default:
      this.requiredDocuments = ['gst', 'pan'];
  }
};

module.exports = mongoose.model("Employer", employerSchema);
