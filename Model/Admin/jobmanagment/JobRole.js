const mongoose = require("mongoose");

const JobRoleSchema = new mongoose.Schema({
  roleId: { type: String, unique: true }, // 001, 002, 003 format
  jobRole: { type: String, required: true, unique: true },
  action: { type: String, required: false },
});

// Middleware to generate sequential roleId before saving
JobRoleSchema.pre("save", async function (next) {
  if (!this.roleId) {
    const lastRecord = await this.constructor.findOne({}, { roleId: 1 }).sort({ roleId: -1 });

    // Extract last numeric part and increment
    let newIdNumber = lastRecord ? parseInt(lastRecord.roleId, 10) + 1 : 1;

    // Format it as 001, 002, etc.
    this.roleId = newIdNumber.toString().padStart(3, "0");
  }
  next();
});

module.exports = mongoose.model("JobRole", JobRoleSchema);
