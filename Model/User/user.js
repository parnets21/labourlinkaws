const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    profile: { type: String }, 
    fullName: { type: String },
    email: {
      type: String,
      // required: true,
      // unique: true,
      // match: [/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/, "Invalid email format"],
    },
    phone: { type: Number },
    location: { type: String },
    password: { type: String },
    confirmPassword: { type: String },
    
    // User type for subscription management
    userType: {
      type: String,
      enum: ['employee', 'employer'],
      default: 'employee'
    },

    //admin 
    jobRole: { type: String },
    companyType: { type: String },
    department: { type: String },
    workMode: { type: String },
    

    // ✅ Work Experience Section
    workExperience: { type: Boolean }, // Yes/No
    // Total years of experience

    // ✅ Nested Schema for Experience (only if workExperience = true)
    experiences: {
      years: { type: Number },
      jobTitle: { type: String } ,
      jobRoles: [{ type: String }],
      companyName: { type: String },
      industry: [{ type: String }],
      salary: { type: Number },
      // startDate: { type: Date },
      startDate: { 
        month: { type: String }, 
        year: { type: String } 
      },
       
      endDate: { type: Date },
        // skillSet: [{ type: String, uppercase: true }],
    },
    

    jobType: { type: String },
    resume: { type: String },
    address: { type: String },

    education:[ {
      institute: String,
      course: String,
      field: String,
      starting: Number, 
      passOut: Number, 
      grade: String

   
    }],
    bio: { type: String },
    country: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: Number },
    online: { type: String, default: "Offline" },
    isDelete: { type: Boolean, default: false },
    isBlock: { type: Boolean, default: false },
    appliedOn: { type: Date, default: Date.now },

    skills: [{
        type: String, required: true   
    }],
    
    preferredLocation: { type: String },
    preferredSalary: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    fcmToken: { type: String },


    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    documents: [{
      type: Schema.Types.ObjectId,
      ref: 'Document'
    }],
    

    aadharNumber: { 
      type: String,
      trim: true,
      index: true
    },
    panNumber: { 
      type: String,
      trim: true,
      uppercase: true,
      index: true
    },
    
    documentVerificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true
    },
    requiredDocuments: {
      type: [String],
      default: function() {
       
        return ['pan', 'aadhar'];
      }
    },
    documentSubmittedAt: { 
      type: Date,
      default: null
    },

    userRole: {
      type: String,
      enum: ['employee', 'individual_employer'],
      default: 'employee'
    }

  },
  { timestamps: true }
);
userSchema.methods.hasAllRequiredDocuments = function() {
  return this.documents && this.documents.length >= this.requiredDocuments.length;
};

userSchema.methods.getMissingDocuments = async function() {
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
userSchema.methods.updateRequiredDocuments = function() {
  switch (this.userRole) {
    case 'employee':
      this.requiredDocuments = ['pan', 'aadhar'];
      break;
    case 'individual_employer':
      this.requiredDocuments = ['pan', 'aadhar'];
      break;
    default:
      this.requiredDocuments = ['pan', 'aadhar'];
  }
};
module.exports = mongoose.model("user", userSchema);
