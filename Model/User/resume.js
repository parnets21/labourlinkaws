const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId=Schema.Types.ObjectId
const resumeSchema = new Schema(
    {
        name: {
            type: String
        },
        
        email: {
            type: String
        },
        mobile: {
            type: Number,
        },
        profile: {
            type: String
        },
       
        jobTitle:{
            type:String
        },
        gender: {
            type: String
        },
        dateOfbirth:{
            type:String
        },
        birthofPlace:{
            type:String
        },
        declearation:{
            type:String
        },
        singn:{
            type:String
        },
        ProfessionalSummary:{
            type:String
        },
        certificate:[{
            certificate: {type:String}
        }],
        INTERESTS:{
            type:String
        },
        templet:{
            type:ObjectId
        },
         SkiilSummery:[{
            summery:{type:String},
      
        }],
       userId:{
        type:ObjectId,
        ref:"user"
       },
        education: [{
            Institue: { type: String },
            Course: { type: String }, 
            Location: { type: String },
            starting: { type: String },
        }],
        skillSet:[ {
            skill:{type: String},
            level:{type:String}
        }],
          langset:[ {
            LANGUAGES:{type: String},
            level:{type:String}
        }],
        workAndExperience: [{
            Company: { type: String },
            workPlace: { type: String },
            position: { type: String },
            session: { type: String }
        }],
        addProject: [{
            projectName: { type: String },
            projectLink: { type: String },
            discription: { type: String },
            DateOftime: { type: String }
        }],
        // webSiteAndSocial:[{
        //     label:{type:String},
        //     link:{type:String}
        // }],

        street: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: Number },
        nationality:{type:String},

       
        // extraActivies:[{
        //     label:{type:String},
        //     activite: { type: String },
        //     discription: { type: String },
        //     city: { type: String },
        //     start: { type: String },
        //     passOut:{type:String}
        // }],
        ACHIEVEMENTS:[{
            achiveName: { type: String },
            discription: { type: String },
            session: { type: String },
        }],
        Hobbies:{
            type:String
        },
        
        // reference:{
        //     name:{type:String},
        //     Company:{type:String},
        //     email:{type:String},
        //     number:{type:Number}
        // }


    }, { timestamps: true });

module.exports = mongoose.model("resume", resumeSchema);
