const mongoose = require("mongoose");

const EducationSchema = new mongoose.Schema({
  educationId: { type: String, unique: true }, // EDU001, EDU002 format
  qualification: { type: String, required: true },
  action: { type: String, required: false },
});

// Middleware to generate sequential educationId before saving
EducationSchema.pre("save", async function (next) {
  if (!this.educationId) {
    const lastRecord = await this.constructor.findOne({}, { educationId: 1 }).sort({ educationId: -1 });

    // Extract last numeric part and increment
    let newIdNumber = lastRecord ? parseInt(lastRecord.educationId.replace("EDU", ""), 10) + 1 : 1;

    // Format it as EDU001, EDU002, etc.
    this.educationId = `EDU${newIdNumber.toString().padStart(3, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Education", EducationSchema);
