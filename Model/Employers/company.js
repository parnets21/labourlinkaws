const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const jobShema = new Schema(
  {
  
    companyName: {
      type: String,
    },
     averageIncentive: {
      type: String,
    },
    openings: {
      type: String,
    },
    address: {
      type: String,
  
    },
    companyaddress: {
      type: String,
  
    },
    companymobile : {
        type: String, 
    },
    companyindustry:{
                type: String,
    },
    companywebsite : {
          type: String,
    },
    
    skill:{type: String},
      benefits:{type: String},
    //  skillSet:[{
    //         skill:{type: String},
    //         level:{type:String}
    //     }],
    //     benefitsSet:[{
    //         benefits:{type: String},
    //         level:{type:String}
    //     }],
        
    night: {
      type: String,
     
    },
    fee: { type: String },
    email: {
      type: String,
    },
    english: {
      type: String,
    },
    experience: {
      type: String,
    },
    interview: {
      type: String,
    },
    
    description: {
      type: String,
    },
    typeofjob: {
      type: String,
    },
    period: {
      type: String,
    },
     typeofwork: {
      type: String,
    },
     typeofeducation: {
      type: String,
    },
     education: {
      type: String,
    },
    experiencerequired: {
        type: String,
    },
    gendertype: {
        type: String,
    },
     jobProfile: {
        type: String,
    },
     minSalary: {
        type: Number,
    },
     maxSalary: {
        type: Number,
    },
     typeofqualification:{
        type: String, 
     },
     category :{
          type: String,
     },
    
     location: {
        type: String,
    },
    reason:{
        type: String,
    },
     time: {
        type: String,
    },
     whatsapp: {
        type: String,
    },
    adminId: {
      type: ObjectId,
      ref: "admin",
    },
    employerId: {
      type: ObjectId,
      ref: "employer",
    },
     jobId: {
      type: ObjectId,
      
    },
   
    salarytype: {
      type: String,
    },
   
    interviewername: { type: String },
   isPrime: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      default: "Pending",
    },
    reasion: {
      type: String,
    },
    
    isDelete: {
      type: Boolean,
      default: false,
    },
    
   
    isVerify: {
      type: Boolean,
      default: false,
    },
    isBlock:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("job", jobShema);
