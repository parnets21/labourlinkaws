const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId
const applySchema = new Schema(
    {
        companyId:{
            type:ObjectId,
            ref:"job"
        },
        userId:{
            type:ObjectId,
            ref:"user"
        },
        
        status:{
            type:String,
            default:"Applied"
        },
        isSelected:{
             type:Boolean,
            default:false
        },
         NotSelected:{
             type:Boolean,
            default:false
        },
        isDelete:{
            type:Boolean,
           default:false
       }
    }, { timestamps: true });

module.exports = mongoose.model("apply", applySchema);