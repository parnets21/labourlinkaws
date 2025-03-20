const mongoose = require("mongoose");

const companylocation = new mongoose.Schema({
  locationId: { type: String, unique: true }, // 0001, 0002, 0003 format
  locationName: { type: String, required: true, unique: true },
  action: { type: String, required: false },
});

// Middleware to generate sequential locationId before saving
companylocation.pre("save", async function (next) {
  if (!this.locationId) {
    const lastRecord = await this.constructor.findOne({}, { locationId: 1 }).sort({ locationId: -1 });

    // Extract last numeric part and increment
    let newIdNumber = lastRecord ? parseInt(lastRecord.locationId, 10) + 1 : 1;

    // Format it as 0001, 0002, etc.
    this.locationId = newIdNumber.toString().padStart(4, "0");
  }
  next();
});

module.exports = mongoose.model("companylocation", companylocation);
