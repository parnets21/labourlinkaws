const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId
const callSchema = new Schema(
    {
      userId: { type: String, required: true },
      schedule: { type: Date, required: true },
      status: { type: String, required: true },
      employerId: { type: String, required: true },
      // name: { type: String, required: true },
      meetingPassword: { type: String, required: true },
      meetingLink: { type: String, required: true },
      email: { type: String, required: true },
      companyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Company" }, // Changed to ObjectId
      platform: { type: String, required: true },
      interviewNotes: { type: String },
      duration: { type: Number, required: true }
    }, { timestamps: true });

module.exports = mongoose.model("interviewcall", callSchema);