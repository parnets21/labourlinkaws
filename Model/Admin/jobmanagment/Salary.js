const mongoose = require("mongoose");

const SalarySchema = new mongoose.Schema({
  salaryRangeId: { type: String, unique: true }, // SAL001, SAL002 format
  minSalary: { type: Number, required: true },
  maxSalary: { type: Number, required: true },
  action: { type: String, required: false },
});

// Middleware to generate sequential salaryRangeId before saving
SalarySchema.pre("save", async function (next) {
  if (!this.salaryRangeId) {
    const lastRecord = await this.constructor.findOne({}, { salaryRangeId: 1 }).sort({ salaryRangeId: -1 });

    // Extract last numeric part and increment
    let newIdNumber = lastRecord ? parseInt(lastRecord.salaryRangeId.replace("SAL", ""), 10) + 1 : 1;

    // Format it as SAL001, SAL002, etc.
    this.salaryRangeId = `SAL${newIdNumber.toString().padStart(3, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Salary", SalarySchema);
