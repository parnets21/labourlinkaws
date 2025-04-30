const mongoose = require("mongoose");

const  feedback=new mongoose.Schema({
  name: { type: String, default: 'Anonymous' },
  email: { type: String },
  communationskill:{type:String},
  
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})
module.exports=mongoose.model("Feedback",feedback);