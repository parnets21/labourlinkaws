const mongoose = require("mongoose");

const IndustrySchema = new mongoose.Schema({
  industryId: { type: String, unique: true }, // 001, 002, 003 format
  industryName: { type: String, required: true, unique: true },
  action: { type: String, required: false },
});

// Middleware to generate sequential industryId before saving
IndustrySchema.pre("save", async function (next) {
  if (!this.industryId) {
    const lastRecord = await this.constructor.findOne({}, { industryId: 1 }).sort({ industryId: -1 });

    // Extract last numeric part and increment
    let newIdNumber = lastRecord ? parseInt(lastRecord.industryId, 10) + 1 : 1;

    // Format it as 3-digit (001, 002, etc.)
    this.industryId = newIdNumber.toString().padStart(3, "0");
  }
  next();
});

module.exports = mongoose.model("Industry", IndustrySchema);
