const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const employerschema = new Schema(
  {
    mobile: {
      type: Number,
    },
    profile: {
      type: String,
    },
    age: {
      type: String,
    },
    name: {
      type: String,
    },
    userName: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    gender: {
      type: String,
    },
    backgroundImage: {
      type: String,
    },
 
    skillSet: {
      type: String,
    },
  
    //company details
    hiring: {
      type: String,
    },
    MyCompany: {
      type: String,
    },
    CompanyName: {
      type: String,
    },
    companyWebsite: {
      type: String,
    },
    companyWebsiteclient: {
      type: String,
    },
     address: {
      type: String,
    },
    numberOfemp: {
      type: String,
    },
    industry: { type: String },
    CompanyInd: { type: String },
    CompanydocType: { type: String },
    Companydoc: { type: String },
    EmployerdocType: { type: String },
    Employerdoc: { type: String },

    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: Number },
    country: { type: String },

    profileViews: [
      {
        userId: {
          type: Boolean,
          ref: "user",
        },
      },
    ],
    isPrime: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      default: "Pending",
    },
       status1: {
      type: String,
      default: "Scheduled",
    },
    reasion: {
      type: String,
    },
    schedule: {
      type: String,
    },
    online: {
      type: String,
      default: "Ofline",
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("employer", employerschema);
