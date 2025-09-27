const express = require('express');
const jobController = require('../Controller/jobController');
const authController = require('../Controller/authController');
const interviewController = require('../Controller/interviewController');
const { validateSubscription, requireActiveSubscription, requireFeature } = require('../middileware/subscriptionValidationMiddleware');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Job posting routes (Employer only)
router.post(
    '/create',
    authController.restrictTo('employer', 'admin'),
    validateSubscription('post_job', { checkUsage: true }),
    jobController.createJob
);

// Job search routes (Employee only)
router.get('/search', 
    authController.restrictTo('employee'),
    validateSubscription('search_job', { checkUsage: true, usagePeriod: 'daily' }),
    jobController.searchJobs
);

// Job application routes (Employee only)
router.post(
    '/:jobId/apply',
    authController.restrictTo('employee'),
    validateSubscription('apply_job', { checkUsage: true }),
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
