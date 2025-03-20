const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    profile: { type: String }, // Profile logo
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
      starting: Number, // Will store dates as YYYYMM
      passOut: Number, // Will store dates as YYYYMM
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
    // experience: { type: Number, default: 0 },
    preferredLocation: { type: String },
    preferredSalary: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", userSchema);
