const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  features: [{
    type: String,
    required: true,
    trim: true
  }],
  type:{
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);