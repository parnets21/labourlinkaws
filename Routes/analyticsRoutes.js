const express = require('express');
const analyticsController = require('../Controller/analyticsController');
const authController = require('../Controller/authController');

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/revenue', analyticsController.getRevenueStats);
router.get('/placements', analyticsController.getPlacementStats);

module.exports = router;
