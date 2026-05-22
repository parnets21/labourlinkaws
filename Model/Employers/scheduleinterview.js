const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const callSchema = new Schema(
    {
      userId: { type: ObjectId, ref: "user", required: true },
      schedule: { type: Date, required: true },
      status: { type: String, required: true },
      employerId: { type: String, required: true },
      name: { type: String },                          
      meetingPassword: { type: String, default: "" },  
      meetingLink: { type: String, default: "" },
      email: { type: String, required: true },
      companyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "job" },
      platform: { type: String, required: true },
      interviewNotes: { type: String },
      duration: { type: String, required: true },
      interviewDate: { type: String },                 // human-readable date string (DD/MM/YYYY)
      interviewTime: { type: String },                 // human-readable time string (HH:MM AM/PM)
      interviewLocation: { type: String },             // physical location or video link
      feedback: {
        technicalSkills: String,
        communicationskill: String
      },
      Position: { type: String }
    }, { timestamps: true });

module.exports = mongoose.model("interviewcall", callSchema);