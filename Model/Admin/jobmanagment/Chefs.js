const mongoose = require("mongoose");

// Define Chef Schema
const ChefSchema = new mongoose.Schema(
  {
    chefCategory: {
      type: String,
      required: [true, "Chef Category is required"],
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
  },
  {
    timestamps: true, // Auto-manages createdAt and updatedAt
  }
);

// Auto-generate sequential chefId (e.g., SK001, SK002) if not provided
ChefSchema.pre("save", async function (next) {
  try {
    if (!this.chefId) {
      // Fetch all chefIds, parse to integers for sorting
      const allRecords = await this.constructor.find({}, { chefId: 1 }).lean();
      const existingIds = allRecords
        .map(record => parseInt(record.chefId.replace("SK", ""), 10))
        .filter(num => !isNaN(num)); // Safety check in case of bad data

      // Find the smallest missing number in sequence
      let newIdNumber = 1;
      while (existingIds.includes(newIdNumber)) {
        newIdNumber++;
      }

      // Assign formatted chefId (e.g., SK001)
      this.chefId = `SK${String(newIdNumber).padStart(3, "0")}`;
      console.log("Generated chefId:", this.chefId);
    }
    next();
  } catch (error) {
    next(error); // Pass errors to Mongoose
  }
});

// Export Chef model
module.exports = mongoose.model("Chef", ChefSchema);
