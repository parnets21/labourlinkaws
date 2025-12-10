const SupportEnquiry = require('../Model/supportModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'Public/uploads/support';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, documents, and zip files are allowed'));
    }
  }
});

class SupportController {
  // Submit new support enquiry
  static async submitEnquiry(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const {
        name,
        email,
        phone,
        userType,
        priority,
        category,
        subject,
        description,
        tags
      } = req.body;

      // Handle file attachments
      let attachmentPaths = [];
      if (req.files && req.files.length > 0) {
        attachmentPaths = req.files.map(file => file.path);
      }

      // Create enquiry object
      const enquiryData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim(),
        userType,
        priority,
        category,
        subject: subject.trim(),
        description: description.trim(),
        attachmentPaths,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: req.body.source || 'web'
      };

      // Save to database
      const enquiry = new SupportEnquiry(enquiryData);
      await enquiry.save();

      res.status(201).json({
        success: true,
        message: 'Support enquiry submitted successfully',
        data: {
          ticketId: enquiry.ticketId,
          status: enquiry.status,
          createdAt: enquiry.createdAt
        }
      });

    } catch (error) {
      console.error('Error submitting support enquiry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit support enquiry',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get all support enquiries with filtering
  static async getEnquiries(req, res) {
    try {
      const {
        status,
        priority,
        category,
        assignedTo,
        search,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query filters
      const filters = {};
      if (status && status !== 'all') filters.status = status;
      if (priority && priority !== 'all') filters.priority = priority;
      if (category && category !== 'all') filters.category = category;
      if (assignedTo && assignedTo !== 'all') filters.assignedTo = assignedTo;

      // Date range filter
      if (dateFrom || dateTo) {
        filters.createdAt = {};
        if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filters.createdAt.$lte = new Date(dateTo);
      }

      // Search functionality
      if (search) {
        filters.$or = [
          { subject: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { ticketId: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Fetch from database with pagination
      const enquiries = await SupportEnquiry.find(filters)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('assignedTo', 'name email')
        .select('-__v');

      const total = await SupportEnquiry.countDocuments(filters);

      res.json({
        success: true,
        data: {
          enquiries,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Error fetching enquiries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch enquiries',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get enquiry by ID
  static async getEnquiryById(req, res) {
    try {
      const { id } = req.params;

      const enquiry = await SupportEnquiry.findById(id)
        .populate('assignedTo', 'name email')
        .populate('responses.respondedBy', 'name email');

      if (!enquiry) {
        return res.status(404).json({
          success: false,
          message: 'Enquiry not found'
        });
      }

      res.json({
        success: true,
        data: enquiry
      });

    } catch (error) {
      console.error('Error fetching enquiry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch enquiry',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update enquiry status
  static async updateEnquiryStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, response, resolution } = req.body;
      const updatedBy = req.user?.id || req.admin?.id;

      // Validate status
      const validStatuses = ['pending', 'in-progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }

      const enquiry = await SupportEnquiry.findById(id);
      if (!enquiry) {
        return res.status(404).json({
          success: false,
          message: 'Enquiry not found'
        });
      }

      const oldStatus = enquiry.status;
      enquiry.status = status;
      enquiry.updatedAt = new Date();

      if (resolution) {
        enquiry.resolution = resolution;
      }

      // Add status change to history
      enquiry.statusHistory = enquiry.statusHistory || [];
      enquiry.statusHistory.push({
        from: oldStatus,
        to: status,
        changedBy: updatedBy,
        changedAt: new Date(),
        note: response
      });

      if (response) {
        enquiry.responses.push({
          message: response,
          respondedBy: updatedBy,
          respondedAt: new Date(),
          isInternal: false
        });
      }

      await enquiry.save();

      res.json({
        success: true,
        message: 'Enquiry status updated successfully',
        data: {
          status,
          updatedAt: enquiry.updatedAt
        }
      });

    } catch (error) {
      console.error('Error updating enquiry status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update enquiry status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Add response to enquiry
  static async addResponse(req, res) {
    try {
      const { id } = req.params;
      const { response, isInternal = false } = req.body;
      const respondedBy = req.user?.id || req.admin?.id;

      if (!response || response.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Response message is required'
        });
      }

      const enquiry = await SupportEnquiry.findById(id);
      if (!enquiry) {
        return res.status(404).json({
          success: false,
          message: 'Enquiry not found'
        });
      }

      const newResponse = {
        message: response.trim(),
        respondedBy,
        respondedAt: new Date(),
        isInternal
      };

      enquiry.responses.push(newResponse);
      
      // Update status if it's the first response
      if (enquiry.status === 'pending') {
        enquiry.status = 'in-progress';
      }
      
      enquiry.updatedAt = new Date();
      await enquiry.save();

      res.json({
        success: true,
        message: 'Response added successfully',
        data: {
          response: newResponse
        }
      });

    } catch (error) {
      console.error('Error adding response:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add response',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get support statistics
  static async getStatistics(req, res) {
    try {
      const { dateRange = '30d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let days;
      
      switch (dateRange) {
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '90d': days = 90; break;
        default: days = 30;
      }
      
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Get statistics
      const [statusStats, priorityStats, categoryStats, totalCount] = await Promise.all([
        SupportEnquiry.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        SupportEnquiry.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        SupportEnquiry.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        SupportEnquiry.countDocuments({ createdAt: { $gte: startDate } })
      ]);

      // Format statistics
      const overview = {
        total: totalCount,
        pending: statusStats.find(s => s._id === 'pending')?.count || 0,
        inProgress: statusStats.find(s => s._id === 'in-progress')?.count || 0,
        resolved: statusStats.find(s => s._id === 'resolved')?.count || 0,
        closed: statusStats.find(s => s._id === 'closed')?.count || 0
      };

      const priority = {
        low: priorityStats.find(p => p._id === 'low')?.count || 0,
        medium: priorityStats.find(p => p._id === 'medium')?.count || 0,
        high: priorityStats.find(p => p._id === 'high')?.count || 0,
        urgent: priorityStats.find(p => p._id === 'urgent')?.count || 0
      };

      res.json({
        success: true,
        data: {
          overview,
          priority,
          categories: categoryStats,
          dateRange,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Export enquiries to CSV
  static async exportEnquiries(req, res) {
    try {
      const {
        status,
        priority,
        category,
        dateFrom,
        dateTo
      } = req.query;

      // Build filters
      const filters = {};
      if (status && status !== 'all') filters.status = status;
      if (priority && priority !== 'all') filters.priority = priority;
      if (category && category !== 'all') filters.category = category;

      if (dateFrom || dateTo) {
        filters.createdAt = {};
        if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filters.createdAt.$lte = new Date(dateTo);
      }

      // Fetch data from database
      const enquiries = await SupportEnquiry.find(filters)
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .lean();

      // Create CSV content
      const csvHeaders = [
        'Ticket ID',
        'Name',
        'Email',
        'User Type',
        'Priority',
        'Category',
        'Subject',
        'Status',
        'Created At',
        'Resolved At',
        'Assigned To'
      ];

      const csvRows = enquiries.map(enquiry => [
        enquiry.ticketId,
        enquiry.name,
        enquiry.email,
        enquiry.userType,
        enquiry.priority,
        enquiry.category,
        enquiry.subject,
        enquiry.status,
        enquiry.createdAt?.toISOString(),
        enquiry.resolvedAt?.toISOString() || '',
        enquiry.assignedTo?.name || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=support-enquiries-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);

    } catch (error) {
      console.error('Error exporting enquiries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export enquiries',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

// Validation middleware
const enquiryValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('userType').isIn(['Admin', 'Employer', 'Job Seeker', 'Interview Manager', 'Accounts Manager', 'Other']).withMessage('Invalid user type'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level'),
  body('category').notEmpty().withMessage('Category is required'),
  body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters')
];

module.exports = {
  SupportController,
  upload,
  enquiryValidation
};