const jwt = require('jsonwebtoken');
const Admin = require('../Model/Admin/admin'); // Adjust path as needed

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Check if token is properly formatted (basic validation)
    if (!token || token === 'null' || token === 'undefined' || token.length < 10) {
      console.error('Malformed token received:', token);
      return res.status(401).json({
        success: false,
        message: 'Malformed token - please login again'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find admin user
    const admin = await Admin.findById(decoded.id || decoded.adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - admin not found'
      });
    }

    // Add admin to request object
    req.admin = admin;
    req.user = admin; // For compatibility
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Malformed token - please login again'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired - please login again'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Optional: Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin
};