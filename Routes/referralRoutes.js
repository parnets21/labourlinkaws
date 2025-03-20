const express = require('express');
const referralController = require('../Controller/referralController');
const authController = require('../Controller/authController');

const router = express.Router();

router.use(authController.protect);

router.post(
    '/create',
    authController.restrictTo('employee'),
    referralController.createReferral
);

router.post(
    '/process-bonus/:applicationId',
    authController.restrictTo('admin'),
    referralController.processReferralBonus
);

module.exports = router;
