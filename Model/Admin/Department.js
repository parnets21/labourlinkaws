const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      unique: true,
    },
    departmentId: {
      type: String,
      required: true,
      unique: true,
    },
    action: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Enables automatic handling of createdAt and updatedAt fields
  }
);

// Middleware to generate sequential departmentId before saving
departmentSchema.pre("save", async function (next) {
  if (!this.departmentId) {
    // Fetch all departmentIds, sort them numerically
    const allRecords = await this.constructor.find({}, { departmentId: 1 }).lean();
    const existingIds = allRecords.map((record) => parseInt(record.departmentId.replace("D", ""), 10));

    // Find the smallest missing number
    let newIdNumber = 1;
    while (existingIds.includes(newIdNumber)) {
      newIdNumber++; // Keep incrementing until we find a missing ID
    }

    // Assign new sequential ID
    this.departmentId = `D${String(newIdNumber).padStart(3, "0")}`;
    console.log("Generated departmentId:", this.departmentId);
  }
  next();
});

module.exports = mongoose.model("Department", departmentSchema);
