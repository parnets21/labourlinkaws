const express = require('express');
const offerController = require('../Controller/offerController');
const authController = require('../Controller/authController');

const router = express.Router();

router.use(authController.protect);

router.post(
    '/generate/:applicationId',
    authController.restrictTo('employer', 'admin'),
    offerController.generateOfferLetter
);

router.post(
    '/respond/:applicationId',
    authController.restrictTo('employee'),
    offerController.respondToOffer
);

module.exports = router;
