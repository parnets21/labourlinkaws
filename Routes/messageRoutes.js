const express = require('express');
const router = express.Router();
const {
  getAllMessages,
  createMessage,
  getMessage,
  updateMessage,
  deleteMessage,
  markAsRead
} = require('../controllers/messageController');

// Get all messages and Create new message
router.route('/')
  .get(getAllMessages)
  .post(createMessage);

// Get single message, Update message, and Delete message
router.route('/:id')
  .get(getMessage)
  .put(updateMessage)
  .delete(deleteMessage);

// Mark message as read
router.put('/:id/read', markAsRead);

module.exports = router; 