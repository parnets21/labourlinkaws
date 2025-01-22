const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId
const applySchema = new Schema(
    {
        employedId:{
            type:ObjectId,
            ref:"employer"
        },
        userId:{
            type:ObjectId,
            ref:"user"
        },
        
        status:{
            type:String,
            default:"Applied"
        }
    }, { timestamps: true });

module.exports = mongoose.model("intrested", applySchema);