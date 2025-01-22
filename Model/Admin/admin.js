const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminSchema = new Schema(
      {
         mobile: {
          type: Number,
        },
        profile:{
            type:String
        },
        name:{
            type:String
        },
        userName:{
            type:String
        },
        email:{
            type:String
        },
        password:{
            type:String
        },
        gender:{
            type:String
        }, 
      },{ timestamps: true });
  
  module.exports= mongoose.model("admin", adminSchema);
  