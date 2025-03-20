const mongoose = require("mongoose");

const ExperienceLevelSchema = new mongoose.Schema({
  levelName: { type: String, required: true, unique: true }, // e.g., Entry Level, Mid-Level, Senior-Level
  action: { type: String, required: false } // e.g., Active/Inactive
});

module.exports = mongoose.model("ExperienceLevel", ExperienceLevelSchema);
