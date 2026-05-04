const express = require('express');
const trackingController = require('../Controller/trackingController');
const authController = require('../Controller/authController');

const router = express.Router();

router.use(authController.protect);

// Update employee's current location
router.post('/update-location', trackingController.updateLocation);

// Get employee's current location (for employers/admin)
router.get(
    '/employee/:userId',
    authController.restrictTo('employer', 'admin'),
    trackingController.getEmployeeLocation
);

// Get employee's location history (for employers/admin)
router.get(
    '/employee/:userId/history',
    authController.restrictTo('employer', 'admin'),
    trackingController.getLocationHistory
);

module.exports = router;
