const mongoose = require("mongoose");

const ChefSchema = new mongoose.Schema(
  {
    chefCategory: {
      type: String,
      required: [true, "ChefsCategory is required"],
      trim: true,
      unique: true,
    },
    chefId: {
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

ChefSchema.pre("save", async function (next) {
  if (!this.chefId) {
    // Fetch all chefId, sort them numerically
    const allRecords = await this.constructor.find({}, { chefId: 1 }).lean();
    const existingIds = allRecords.map((record) => parseInt(record.chefId.replace("SK", ""), 10));

    // Find the smallest missing number
    let newIdNumber = 1;
    while (existingIds.includes(newIdNumber)) {
      newIdNumber++; // Keep incrementing until we find a missing ID
    }

    // Assign new sequential ID
    this.chefId = `SK${String(newIdNumber).padStart(3, "0")}`;
    console.log("Generated chefId:", this.chefId);
  }
  next();
});

module.exports = mongoose.model("Chef", ChefSchema);