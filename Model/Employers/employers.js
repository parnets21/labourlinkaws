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
    industry: { type: String },
    GstNum: { type: String },
    PanNum: { type: String },
    deviceId: { type: String },
    platform: { type: String, enum: ["android", "ios"] },
    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now },
    EmployerImg:String,
    fcmToken: { type: String },
    
    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    
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

module.exports = mongoose.model("Employer", employerSchema);
