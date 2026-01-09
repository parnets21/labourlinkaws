const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  slug: { 
    type: String, 
    required: [true, 'Slug is required'],
    unique: true, 
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  type: { 
    type: String, 
    enum: {
      values: ["employee", "employer"],
      message: '{VALUE} is not a valid subscription type'
    },
    required: [true, 'Subscription type is required']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    description: "Marketing-friendly name shown to users"
  },
  shortDescription: {
    type: String,
    trim: true,
    description: "Brief description shown in plan listings"
  },
  highlightedFeatures: [{
    type: String,
    trim: true
  }],
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    max: [1000000, 'Price cannot exceed 1,000,000'],
    validate: {
      validator: Number.isFinite,
      message: '{VALUE} is not a valid price'
    }
  },
  duration: { 
    type: String, 
    enum: {
      values: ["monthly", "quarterly", "yearly", "lifetime"],
      message: '{VALUE} is not a valid duration'
    },
    required: [true, 'Duration is required']
  },
  displayPrice: {
    type: String,
    trim: true,
    description: "Formatted price string for display (e.g., '₹999/month', 'Free')"
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price cannot be negative'],
    description: "Original price for showing discounts"
  },
  discountText: {
    type: String,
    trim: true,
    maxlength: [50, 'Discount text cannot exceed 50 characters'],
    description: "e.g., 'Save 20%', '2 months free'"
  },
  recommendedFor: {
    type: String,
    trim: true,
    maxlength: [100, 'Recommended for text cannot exceed 100 characters'],
    description: "e.g., 'Best for startups', 'Perfect for enterprises'"
  },
  features: {
    // Basic Features (Common)
    profileCreation: {
      type: Boolean,
      default: true,
      description: "Create and manage detailed professional/company profile"
    },
    workExperience: {
      type: Boolean,
      default: true,
      description: "Add work experience details / company background"
    },
    educationDetails: {
      type: Boolean,
      default: true,
      description: "Add education history (employee only)"
    },
    skillsManagement: {
      type: Boolean,
      default: true,
      description: "Add and manage professional skills (employee only)"
    },
    preferredSalary: {
      type: Boolean,
      default: true,
      description: "Set salary preferences (employee only)"
    },
    locationPreferences: {
      type: Boolean,
      default: true,
      description: "Set preferred work locations / office locations"
    },

    // Employee Features
    jobApplications: {
      type: Boolean,
      default: true,
      description: "Apply to jobs"
    },
    applicationTracking: {
      type: Boolean,
      default: true,
      description: "Track application status"
    },
    jobAlerts: {
      type: Boolean,
      default: true,
      description: "Receive relevant job notifications"
    },
    applicationHistory: {
      type: Boolean,
      default: true,
      description: "View and manage past applications"
    },
    employerChat: {
      type: Boolean,
      default: true,
      description: "Chat with potential employers"
    },
    applicationMessages: {
      type: Boolean,
      default: true,
      description: "Receive application-related communications"
    },

    // Interview Features (Common)
    onlineInterviews: {
      type: Boolean,
      default: true,
      description: "Participate in/conduct online interviews"
    },
    interviewScheduling: {
      type: Boolean,
      default: true,
      description: "Schedule and manage interview timings"
    },
    interviewAvailability: {
      type: Boolean,
      default: true,
      description: "Set availability for interviews (employee only)"
    },
    interviewFeedback: {
      type: Boolean,
      default: true,
      description: "Receive/provide interview feedback"
    },

    // Employee Feature Limits
    enableJobSearch: {
      type: Boolean,
      default: true,
      description: "Enable job search limits"
    },
    enableJobApplications: {
      type: Boolean,
      default: true,
      description: "Enable job application limits"
    },
    enableProfileUpdates: {
      type: Boolean,
      default: true,
      description: "Enable profile update limits"
    },
    enableInterviews: {
      type: Boolean,
      default: true,
      description: "Enable interview limits"
    },
    enableCommunication: {
      type: Boolean,
      default: true,
      description: "Enable communication limits"
    },

    // Employee Numeric Limits
    jobSearchPerDay: {
      type: Number,
      default: 50,
      min: 0,
      description: "Daily job search limit"
    },
    jobApplicationsPerMonth: {
      type: Number,
      default: 30,
      min: 0,
      description: "Monthly application limit"
    },
    jobApplicationsPerDay: {
      type: Number,
      default: 5,
      min: 0,
      description: "Daily application limit"
    },
    jobApplicationsPerCategory: {
      type: Number,
      default: 10,
      min: 0,
      description: "Applications per job category"
    },
    simultaneousApplications: {
      type: Number,
      default: 3,
      min: 0,
      description: "Active applications at once"
    },
    companyViewsPerDay: {
      type: Number,
      default: 15,
      min: 0,
      description: "Company profiles viewable per day"
    },
    salaryViewsPerMonth: {
      type: Number,
      default: 10,
      min: 0,
      description: "Salary insights viewable per month"
    },
    applicationPriority: {
      type: Boolean,
      default: false,
      description: "Priority in application queue"
    },
    reapplicationDays: {
      type: Number,
      default: 30,
      min: 0,
      description: "Days before reapplying to same job"
    },
    similarJobApplications: {
      type: Number,
      default: 2,
      min: 0,
      description: "Applications to similar jobs"
    },
    profileUpdatesPerMonth: {
      type: Number,
      default: 5,
      min: 0,
      description: "Monthly profile updates allowed"
    },
    skillAssessmentsPerMonth: {
      type: Number,
      default: 2,
      min: 0,
      description: "Monthly skill assessments allowed"
    },
    certificateUploads: {
      type: Number,
      default: 5,
      min: 0,
      description: "Total certificates uploadable"
    },
    interviewsPerMonth: {
      type: Number,
      default: 5,
      min: 0,
      description: "Monthly interview limit"
    },
    interviewReschedules: {
      type: Number,
      default: 2,
      min: 0,
      description: "Interview reschedules allowed"
    },
    messagesPerThread: {
      type: Number,
      default: 50,
      min: 0,
      description: "Messages per conversation thread"
    },
    customJobAlerts: {
      type: Number,
      default: 3,
      min: 0,
      description: "Custom job alerts allowed"
    },

    // Employer Features
    enableJobPosting: {
      type: Boolean,
      default: true,
      description: "Enable job posting limits"
    },
    enableCandidateSearch: {
      type: Boolean,
      default: true,
      description: "Enable candidate search limits"
    },
    enableEmployerInterviews: {
      type: Boolean,
      default: true,
      description: "Enable employer interview limits"
    },
    enableEmployerCommunication: {
      type: Boolean,
      default: true,
      description: "Enable employer communication limits"
    },

    // Employer Numeric Limits
    activeJobPosts: {
      type: Number,
      default: 3,
      min: 0,
      description: "Maximum active job postings"
    },
    jobPostDuration: {
      type: Number,
      default: 30,
      min: 0,
      description: "Job post duration in days"
    },
    candidateSearchesPerDay: {
      type: Number,
      default: 50,
      min: 0,
      description: "Daily candidate search limit"
    },
    candidateViewsPerDay: {
      type: Number,
      default: 30,
      min: 0,
      description: "Candidate profiles viewable per day"
    },
    applicationReviewsPerDay: {
      type: Number,
      default: 100,
      min: 0,
      description: "Applications reviewable per day"
    },
    interviewSlotsPerJob: {
      type: Number,
      default: 10,
      min: 0,
      description: "Interview slots per job posting"
    },
    skillTestsPerJob: {
      type: Number,
      default: 2,
      min: 0,
      description: "Skill assessments per job posting"
    },
    messageThreadsPerJob: {
      type: Number,
      default: 30,
      min: 0,
      description: "Message threads per job posting"
    },
    messagesPerCandidate: {
      type: Number,
      default: 50,
      min: 0,
      description: "Messages per candidate conversation"
    },
    customTestQuestions: {
      type: Number,
      default: 10,
      min: 0,
      description: "Custom assessment questions allowed"
    },

    // Common Features
    messageThreads: {
      type: Number,
      default: 10,
      min: 0,
      description: "Total message threads allowed"
    },
    bulkInterviewScheduling: {
      type: Boolean,
      default: false,
      description: "Bulk interview scheduling capability"
    },
    bulkMessages: {
      type: Boolean,
      default: false,
      description: "Bulk messaging capability"
    },
    reportingFrequency: {
      type: String,
      enum: ["weekly", "monthly", "quarterly"],
      default: "monthly",
      description: "Analytics reporting frequency"
    },
    customReports: {
      type: Number,
      default: 0,
      min: 0,
      description: "Custom reports allowed"
    },
    exportLimit: {
      type: Number,
      default: 100,
      min: 0,
      description: "Data export limit per month"
    },
    analyticsAccess: {
      type: Boolean,
      default: false,
      description: "Access to detailed analytics"
    }
  },
  isActive: { 
    type: Boolean, 
    default: true, 
    required: [true, 'isActive status is required']
  }
}, { 
  timestamps: true,
  id: false
});

module.exports = mongoose.model("Subscription", subscriptionPlanSchema);
