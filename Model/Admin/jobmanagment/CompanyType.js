const mongoose = require("mongoose");

const companyTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, "Company type is required"],
    trim: true,
  },
  typeId: {
    type: String,
    required: true,
    unique: true,  // Ensure uniqueness
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
}, {
  timestamps: true
});
companyTypeSchema.pre("save", async function (next) {
  if (!this.typeId) {
    // Fetch all typeIds, sort them numerically
    const allRecords = await this.constructor.find({}, { typeId: 1 }).lean();
    const existingIds = allRecords.map(record => parseInt(record.typeId.replace("CT", ""), 10));
    
    // Find the smallest missing number
    let newIdNumber = 1;
    while (existingIds.includes(newIdNumber)) {
      newIdNumber++;  // Keep incrementing until we find a missing ID
    }

    // Assign new sequential ID
    this.typeId = `CT${String(newIdNumber).padStart(3, "0")}`;
    console.log("Generated typeId:", this.typeId);
  }
  next();
});


module.exports = mongoose.model("CompanyType", companyTypeSchema);
