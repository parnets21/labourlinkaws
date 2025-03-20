const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const employerschema = new Schema(
  {
    mobile: { type: Number },
    profile: { type: String },
    age: { type: String },
    name: { type: String },
    userName: { type: String },
    email: { type: String },
    password: { type: String },
    gender: { type: String },    
    // Company details
    hiring: { type: String },
    MyCompany: { type: String },
    CompanyName: { type: String },
    companyWebsite: { type: String },
    address: { type: String },
    numberOfemp: { type: String },
    industry: { type: String },
    CompanyInd: { type: String },
    CompanydocType: { type: String },
    GstNum:{type:String},
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: Number },
    country: { type: String },
    
    isPrime: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false }, // ✅ Only approved employers can post jobs

    status: { type: String, default: "Pending" },
    status1: { type: String, default: "Scheduled" },
    reasion: { type: String },
    schedule: { type: String },
    online: { type: String, default: "Offline" },
    isDelete: { type: Boolean, default: false },
    isBlock: { type: Boolean, default: false },
    searchCount: { type: Number, default: 0 }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("employer", employerschema);
