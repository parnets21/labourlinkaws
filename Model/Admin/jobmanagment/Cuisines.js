const mongoose = require("mongoose");

// Define CuisineId Schema
const CuisineSchema = new mongoose.Schema(
  {
    Cuisine: {
      type: String,
      required: [true, "Cuisine  is required"],
      trim: true,
      unique: true,
    },
    CuisineId: {
      type: String,
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

// Auto-generate sequential CuisineId (e.g., SK001, SK002) if not provided
CuisineSchema.pre("save", async function (next) {
  try {
    if (!this.CuisineId) {
      // Fetch all CuisineId, parse to integers for sorting
      const allRecords = await this.constructor.find({}, { CuisineId: 1 }).lean();
      const existingIds = allRecords
        .map(record => parseInt(record.CuisineId.replace("CN", ""), 10))
        .filter(num => !isNaN(num)); // Safety check in case of bad data

      // Find the smallest missing number in sequence
      let newIdNumber = 1;
      while (existingIds.includes(newIdNumber)) {
        newIdNumber++;
      }

      // Assign formatted CuisineId (e.g., SK001)
      this.CuisineId = `SK${String(newIdNumber).padStart(3, "0")}`;
      console.log("Generated CuisineId:", this.CuisineId);
    }
    next();
  } catch (error) {
    next(error); 
  }
});

module.exports = mongoose.model("Cuisine", CuisineSchema);
