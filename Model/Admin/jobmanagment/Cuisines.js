const mongoose = require("mongoose");

const CuisineSchema = new mongoose.Schema(
  {
    cuisineId: {
      type: String,
      unique: true,
      required: true
    },
    cuisineName: {
      type: String,
      required: [true, "Cuisine name is required"],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
);

// Auto-generate sequential cuisineId (e.g., CU001, CU002) if not provided
CuisineSchema.pre("save", async function (next) {
  try {
    if (!this.cuisineId) {
      // Fetch all cuisineIds, parse to integers for sorting
      const allRecords = await this.constructor.find({}, { cuisineId: 1 }).lean();
      const existingIds = allRecords
        .map(record => parseInt(record.cuisineId.replace("CU", ""), 10))
        .filter(num => !isNaN(num)); // Safety check in case of bad data

      // Find the smallest missing number in sequence
      let newIdNumber = 1;
      while (existingIds.includes(newIdNumber)) {
        newIdNumber++;
      }

      // Assign formatted cuisineId (e.g., CU001)
      this.cuisineId = `CU${String(newIdNumber).padStart(3, "0")}`;
    }
    
    // Update the updatedAt timestamp
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error); 
  }
});

module.exports = mongoose.model("Cuisine", CuisineSchema);
