const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },

  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: String,

  },
  status: {
    type: String,
    enum: ["available", "booked"],
    default: "available"
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
