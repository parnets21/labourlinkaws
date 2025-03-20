const express = require('express');
const jobController = require('../Controller/jobController');
const authController = require('../Controller/authController');
const interviewController = require('../Controller/interviewController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Job posting routes
router.post(
    '/create',
    authController.restrictTo('employer', 'admin'),
    jobController.createJob
);

// Job search routes
router.get('/search', jobController.searchJobs);

// Job application routes
router.post(
    '/:jobId/apply',
    authController.restrictTo('employee'),
    jobController.applyForJob
);

router.patch(
    '/applications/:applicationId/status',
    authController.restrictTo('employer', 'admin'),
    jobController.updateApplicationStatus
);

// Interview routes
router.post(
    '/applications/:applicationId/interviews',
    authController.restrictTo('employer', 'admin'),
    interviewController.scheduleInterview
);

router.patch(
    '/applications/:applicationId/interviews/:interviewId',
    authController.restrictTo('employer', 'admin'),
    interviewController.updateInterviewStatus
);

router.post(
    '/applications/:applicationId/interviews/:interviewId/feedback',
    authController.restrictTo('employer', 'admin'),
    interviewController.recordInterviewFeedback
);



module.exports = router;
