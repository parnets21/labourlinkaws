const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: String,
    enum: ['Skin', 'Screen', 'Offer', 'Template'],
    required: true,
  },
  image: {
    type: String, // URL or filename
  },
  tags: [String],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  type: {
    type: String,
    enum: ['employee', 'employer'],
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);
