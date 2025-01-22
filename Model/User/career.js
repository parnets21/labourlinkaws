
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema.Types;

const careerSchema = new Schema(
    {
        title: {
            type: String,
      
        },
        description: {
            type: String,
         
        },
        adminId: {
            type: ObjectId,
            ref: "admin",  
        },
        category:{type:String} ,
        subcategory: {type:String},
        image: {type:String},
        image1: {type:String},
        

        video: {type:String},
        video1: {type:String},
   
        
    }, { timestamps: true })
    const blogModel = mongoose.model("career", careerSchema);
    module.exports = blogModel;