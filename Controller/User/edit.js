const User = require('../models/userModel');
const multer = require('multer');
const path = require('path');

// Configure storage for different file types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profile') {
      cb(null, './uploads/profiles');
    } else if (file.fieldname === 'resume') {
      cb(null, './uploads/resumes');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'profile') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Please upload only images'), false);
    }
  } else if (file.fieldname === 'resume') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Please upload only PDF files'), false);
    }
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Add Education
exports.addEducation = async (req, res) => {
  try {
    const { userId, education } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { education: education } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Education added successfully',
      data: user.education
    });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add education',
      error: error.message
    });
  }
};

// Remove Education
exports.removeEducation = async (req, res) => {
  try {
    const { userId, removeId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { education: { _id: removeId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Education removed successfully',
      data: user.education
    });
  } catch (error) {
    console.error('Remove education error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove education',
      error: error.message
    });
  }
};

// Add Skill
exports.addSkill = async (req, res) => {
  try {
    const { userId, skill } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { skills: skill } }, // Using addToSet to prevent duplicates
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Skill added successfully',
      data: user.skills
    });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add skill',
      error: error.message
    });
  }
};

// Remove Skill
exports.removeSkill = async (req, res) => {
  try {
    const { userId, removeId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { skills: removeId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Skill removed successfully',
      data: user.skills
    });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove skill',
      error: error.message
    });
  }
};

// Update Profile/Resume
exports.updateProfileOrResume = async (req, res) => {
  const uploadFields = upload.fields([
    { name: 'profile', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
  ]);

  uploadFields(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      const userId = req.body.userId;
      const updates = {};

      if (req.files.profile) {
        updates.profile = req.files.profile[0].path;
      }
      if (req.files.resume) {
        updates.resume = req.files.resume[0].path;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        data: user
      });
    } catch (error) {
      console.error('Update profile/resume error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile/resume',
        error: error.message
      });
    }
  });
};