const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId
const primeSchema = new Schema(
    {
        employerId:{
            type:ObjectId,
            ref:"employer"
        },
        userId:{
            type:ObjectId,
            ref:"user"
        },
        views:{
            type:Number
        },
        expirePlan:{
            type:Date
        },
        amount:{
            type:String
        }
    }, { timestamps: true });

module.exports = mongoose.model("prime", primeSchema);