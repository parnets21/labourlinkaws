const Message = require('../../Model/User/Message');
const mongoose = require('mongoose');


// Get all messages
exports.getAllMessages = async (req, res) => {
  try {
    const { userId, type } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const trimmedUserId = userId.trim(); // Remove spaces or newlines

    if (!mongoose.Types.ObjectId.isValid(trimmedUserId)) {
      return res.status(400).json({ success: false, error: 'Invalid User ID' });
    }

    let query = { receiver: new mongoose.Types.ObjectId(trimmedUserId) };

    if (type && type !== 'all') {
      query.type = type;
    }

    const messages = await Message.find(query).sort({ createdAt: -1 });
    const unreadCount = await Message.countDocuments({ receiver: new mongoose.Types.ObjectId(trimmedUserId), unread: true });

    res.status(200).json({
      success: true,
      unreadCount,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
// Create new message
exports.createMessage = async (req, res) => {
  try {
    const { receiver, sender, type, company, logo, title, message, time } = req.body;

    if (!receiver || !type || !company || !title || !message) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const newMessage = new Message({
      receiver,  // Job seeker who will receive the message
      sender,    // (Optional) Recruiter or system sending the message
      type,
      company,
      logo,
      title,
      message,
      time,
      unread: true  // Default to unread
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};


// Get single message
exports.getMessage = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const message = await Message.findOne({ _id: req.params.id, receiver: userId });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, receiver: userId },
      { unread: false },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};


// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const message = await Message.findOneAndDelete({ _id: req.params.id, receiver: userId });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
