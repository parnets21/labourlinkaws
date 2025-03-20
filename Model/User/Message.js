const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, // Job seeker who receives the message

  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  }, // Recruiter or system who sends the message (optional)

  type: {
    type: String,
    enum: ['interview', 'job_match', 'hr_message', 'application_update'],
    required: true
  },
  company: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  unread: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema); 