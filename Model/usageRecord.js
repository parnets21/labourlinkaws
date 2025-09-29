const mongoose = require('mongoose');

const UsageRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  usageKey: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true }, // Truncated to day
  month: { type: Date, required: true, index: true }, // First of month
  count: { type: Number, default: 0 },
  lastAction: { type: String },
  lastTimestamp: { type: Date },
  metadata: { type: Object }
}, { timestamps: true });

UsageRecordSchema.index({ userId: 1, usageKey: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('UsageRecord', UsageRecordSchema);


