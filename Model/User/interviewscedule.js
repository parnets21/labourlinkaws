const mongoose = require("mongoose");

const InterviewSchema = new mongoose.Schema({

  candidate: { type: mongoose.Schema.Types.ObjectId, 
    ref:"user",
    required: true 
  }, 
  position: { type: String, required: true }, 
  dateTime: { type: Date, required: true }, 
  time:{type:String ,required:true},
  type: { type: String, enum: ["Online", "Offline"], required: true }, 
  interviewer: { type: String, required: true },
  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Cancelled", "Pending"],
    default: "Scheduled",
  }, 
});

module.exports = mongoose.model("Interview", InterviewSchema);
