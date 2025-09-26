const express = require('express');
const router = express.Router();
const enhancedPhonepeController = require('../Controller/EnhancedPhonepeController');

// Middleware for request logging
const logPaymentRequest = (req, res, next) => {
  console.log(`Payment API Request: ${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'GET' ? req.query : { ...req.body, mobile: req.body.mobile ? '***' + req.body.mobile.slice(-4) : undefined }
  });
  next();
};

// Middleware for request validation
const validatePaymentRequest = (req, res, next) => {
  const { userId, amount } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }
  
  if (amount && (isNaN(amount) || parseFloat(amount) <= 0)) {
    return res.status(400).json({
      success: false,
      error: 'Valid amount is required'
    });
  }
  
  next();
};

// Apply logging middleware to all routes
router.use(logPaymentRequest);

// Payment Creation Routes
router.post('/create-web-payment', validatePaymentRequest, enhancedPhonepeController.createWebPayment);
router.post('/create-mobile-payment', validatePaymentRequest, enhancedPhonepeController.createMobilePayment);

// Legacy route for backward compatibility
router.post('/addpaymentphonepay', validatePaymentRequest, enhancedPhonepeController.createWebPayment);
router.post('/addpaymentmobile', validatePaymentRequest, enhancedPhonepeController.createMobilePayment);

// Payment Status and Management Routes
router.get('/check-payment/:id/:userId', enhancedPhonepeController.checkPaymentStatus);
router.get('/check-payment/:id', enhancedPhonepeController.checkPaymentStatus); // Without userId validation

// Legacy route for backward compatibility
router.get('/checkPayment/:id/:userId', enhancedPhonepeController.checkPaymentStatus);

// Payment Callback Route
router.post('/payment-callback', enhancedPhonepeController.handlePaymentCallback);

// Transaction History Routes
router.get('/transactions/:userId', enhancedPhonepeController.getTransactionHistory);
router.get('/transaction-history/:userId', enhancedPhonepeController.getTransactionHistory);

// Reporting Routes (Admin/Internal use)
router.get('/payment-report', enhancedPhonepeController.generatePaymentReport);

// Health Check Route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Enhanced Payment Service is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Payment Route Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: 'Payment service error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
