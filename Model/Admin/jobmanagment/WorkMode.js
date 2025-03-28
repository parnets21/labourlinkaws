const mongoose = require("mongoose");

const WorkModeSchema = new mongoose.Schema({
  workMode: { type: String, required: true, unique: true },
  action: { type: String, required: false },
});

// Middleware to generate sequential modeId before saving
WorkModeSchema.pre("save", async function (next) {
  if (!this.modeId) {
    const lastRecord = await this.constructor.findOne({}, { modeId: 1 }).sort({ modeId: -1 });

    // Extract last numeric part and increment
    let newIdNumber = lastRecord ? parseInt(lastRecord.modeId, 10) + 1 : 1;

    // Format it as 001, 002, etc.
    this.modeId = newIdNumber.toString().padStart(3, "0");
  }
  next();
});

module.exports = mongoose.model("WorkMode", WorkModeSchema);
