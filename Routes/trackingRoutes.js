const express = require('express');
const trackingController = require('../Controller/trackingController');
const authController = require('../Controller/authController');

const router = express.Router();

router.use(authController.protect);

router.post('/update-location', trackingController.updateLocation);
router.get(
    '/employee/:userId',
    authController.restrictTo('employer', 'admin'),
    trackingController.getEmployeeLocation
);

module.exports = router;
