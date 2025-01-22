const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId
const callSchema = new Schema(
    {
        employerId:{
            type:ObjectId,
            ref:"employer"
        },
        userId:{
            type:ObjectId,
            ref:"user"
        },
        companyId:{
            type:ObjectId,
            
        },
        schedule:{
            type:String,
        }
        ,
        status:{
            type:String,
            default:"Scheduled"
        }
    }, { timestamps: true });

module.exports = mongoose.model("interviewcall", callSchema);