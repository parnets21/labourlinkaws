const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const jobSchema = new Schema(
  {
    companyName: String,
    companywebsite: String,
    companymobile: String,
    companyindustry: String,
    companytype: String,
    department: String,
    industryId: {
      type: ObjectId,
      ref: 'Industry',
      required: false,
      index: true
    },
    categoryId: {
      type: ObjectId,
      ref: 'Category',
      required: false,
      index: true
    },
    subCategoryId: {
      type: ObjectId,
      ref: 'SubCategory',
      required: false,
      index: true
    },
    companyaddress: String,
    address: String,
    jobtitle: String,
    jobProfile: String,
    description: String,
    openings: { type: Number, default: 1 }, // Changed from String to Number
    location: String,
    minSalary: Number,
    maxSalary: Number,
    salarytype: String,
    averageIncentive: String,
    benefits: String,
    requirements: String,
    responsibilities: String,
    workSchedule: String,
    locationDetails: String,
    preferredQualifications: String,
    additionalNotes: String,
    skill: [{ type: String, required: true }],
    email: String,
    logo: String,
    jdPdf: String,
    businessImages: [{ type: String }],
    english: String,
    experience: String,
    interview: String,
    typeofjob: String,
    jobRoles: String,
    period: String,
    typeofwork: String,
    typeofeducation: String,
    education: String,
    experiencerequired: { type: Number, default: 0 },
    gendertype: String,
    typeofqualification: String,
    category: String,
    reason: String, // Fixed typo
    time: String,
    whatsapp: String,
    adminId: { type: ObjectId, ref: "admin" },
    employerId: { type: ObjectId, ref: "Employer" },
    jobId: ObjectId,
    interviewername: String,
    isPrime: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false }, // Added missing fields
    isVerify: { type: Boolean, default: false },
    isBlock: { type: Boolean, default: false },
    
  },
  { timestamps: true }
);

// Indexes for classification fields
jobSchema.index({ industryId: 1 });
jobSchema.index({ categoryId: 1 });
jobSchema.index({ subCategoryId: 1 });
jobSchema.index({ industryId: 1, categoryId: 1, subCategoryId: 1 });

module.exports = mongoose.model("job", jobSchema);
