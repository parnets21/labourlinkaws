const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: [true, "Skill name is required"],
      trim: true,
      unique: true,
    },
    skillId: {
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
    timestamps: true,
  }
);

skillSchema.pre("save", async function (next) {
  if (!this.skillId) {
    // Fetch all skillIds, sort them numerically
    const allRecords = await this.constructor.find({}, { skillId: 1 }).lean();
    const existingIds = allRecords.map((record) => parseInt(record.skillId.replace("SK", ""), 10));

    // Find the smallest missing number
    let newIdNumber = 1;
    while (existingIds.includes(newIdNumber)) {
      newIdNumber++; // Keep incrementing until we find a missing ID
    }

    // Assign new sequential ID
    this.skillId = `SK${String(newIdNumber).padStart(3, "0")}`;
    console.log("Generated skillId:", this.skillId);
  }
  next();
});

module.exports = mongoose.model("Skill", skillSchema);