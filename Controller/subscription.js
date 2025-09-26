const Subscription = require('../Model/subscription');
const mongoose = require('mongoose');

// Validation helper
const validateSubscriptionInput = (data) => {
  const errors = {};

  // Basic field validation
  if (!data.displayName) errors.displayName = 'Display name is required';
  if (!data.type) errors.type = 'Subscription type is required';
  if (!data.price) errors.price = 'Price is required';
  if (!data.duration) errors.duration = 'Duration is required';

  // Type validation
  if (data.type && !['employee', 'employer'].includes(data.type)) {
    errors.type = 'Invalid subscription type';
  }

  // Duration validation
  if (data.duration && !['monthly', 'quarterly', 'yearly', 'lifetime'].includes(data.duration)) {
    errors.duration = 'Invalid duration';
  }

  // Price validation
  if (data.price) {
    if (typeof data.price !== 'number') errors.price = 'Price must be a number';
    if (data.price < 0) errors.price = 'Price cannot be negative';
    if (data.price > 1000000) errors.price = 'Price cannot exceed 1,000,000';
  }

  // Text content validation
  if (data.displayName && data.displayName.length > 100) {
    errors.displayName = 'Display name cannot exceed 100 characters';
  }
  if (data.shortDescription && data.shortDescription.length > 200) {
    errors.shortDescription = 'Short description cannot exceed 200 characters';
  }

  // Highlighted features validation
  if (data.highlightedFeatures) {
    if (!Array.isArray(data.highlightedFeatures)) {
      errors.highlightedFeatures = 'Highlighted features must be an array';
    } else {
      data.highlightedFeatures.forEach((feature, index) => {
        if (typeof feature !== 'string') {
          errors[`highlightedFeatures.${index}`] = 'Feature must be a string';
        }
        if (feature.length > 100) {
          errors[`highlightedFeatures.${index}`] = 'Feature cannot exceed 100 characters';
        }
      });
    }
  }


  // Features validation
  if (data.features) {
    const { features } = data;
    
    // Boolean Features Validation
    const booleanFeatures = [
      'profileCreation', 'workExperience', 'educationDetails', 'skillsManagement',
      'preferredSalary', 'locationPreferences', 'jobApplications', 'applicationTracking',
      'jobAlerts', 'applicationHistory', 'employerChat', 'applicationMessages',
      'onlineInterviews', 'interviewScheduling', 'interviewAvailability', 'interviewFeedback',
      'enableJobSearch', 'enableJobApplications', 'enableProfileUpdates', 'enableInterviews',
      'enableCommunication', 'enableJobPosting', 'enableCandidateSearch', 'enableEmployerInterviews',
      'enableEmployerCommunication', 'applicationPriority', 'bulkInterviewScheduling',
      'bulkMessages', 'analyticsAccess'
    ];
    
    booleanFeatures.forEach(field => {
      if (features[field] !== undefined && typeof features[field] !== 'boolean') {
        errors[`features.${field}`] = `${field} must be a boolean value`;
      }
    });

    // Numeric Features Validation
    const numericFeatures = [
      'jobSearchPerDay', 'jobApplicationsPerMonth', 'jobApplicationsPerDay',
      'jobApplicationsPerCategory', 'simultaneousApplications', 'companyViewsPerDay',
      'salaryViewsPerMonth', 'reapplicationDays', 'similarJobApplications',
      'profileUpdatesPerMonth', 'skillAssessmentsPerMonth', 'certificateUploads',
      'interviewsPerMonth', 'interviewReschedules', 'messagesPerThread',
      'customJobAlerts', 'activeJobPosts', 'jobPostDuration', 'candidateSearchesPerDay',
      'candidateViewsPerDay', 'applicationReviewsPerDay', 'interviewSlotsPerJob',
      'skillTestsPerJob', 'messageThreadsPerJob', 'messagesPerCandidate',
      'customTestQuestions', 'messageThreads', 'customReports', 'exportLimit'
    ];
    
    numericFeatures.forEach(field => {
      if (features[field] !== undefined) {
        if (typeof features[field] !== 'number') {
          errors[`features.${field}`] = `${field} must be a number`;
        } else if (features[field] < 0) {
          errors[`features.${field}`] = `${field} cannot be negative`;
        }
      }
    });

    // String enum validation
    if (features.reportingFrequency && !['weekly', 'monthly', 'quarterly'].includes(features.reportingFrequency)) {
      errors['features.reportingFrequency'] = 'Invalid reporting frequency';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Create subscription
exports.createSubscription = async (req, res) => {
  try {
    // Validate input
    const { isValid, errors } = validateSubscriptionInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    // Generate slug if not provided
    if (!req.body.slug) {
      req.body.slug = req.body.displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Format display price if not provided
    if (!req.body.displayPrice) {
      if (req.body.price === 0) {
        req.body.displayPrice = 'Free';
      } else {
        const formatter = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        });
        if (req.body.duration === 'lifetime') {
          req.body.displayPrice = `${formatter.format(req.body.price)} (Lifetime)`;
        } else {
          req.body.displayPrice = `${formatter.format(req.body.price)}/${req.body.duration}`;
        }
      }
    }

    const subscription = await Subscription.create(req.body);

    res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        errors: { slug: 'A subscription with this slug already exists' }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: err.message
    });
  }
};

// Get all subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const {
      type,
      isActive,
      duration,
      minPrice,
      maxPrice,
      sort = 'price'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (duration) filter.duration = duration;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // Build sort object
    let sortObj = {};
    if (sort === 'price') {
      sortObj.price = 1;
    } else if (sort === '-price') {
      sortObj.price = -1;
    } else if (sort === 'name') {
      sortObj.name = 1;
    } else if (sort === '-name') {
      sortObj.name = -1;
    }

    const subscriptions = await Subscription.find(filter)
      .sort(sortObj)
      .select('-__v');

    // Group subscriptions by type
    const grouped = subscriptions.reduce((acc, sub) => {
      if (!acc[sub.type]) {
        acc[sub.type] = [];
      }
      acc[sub.type].push(sub);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: {
        all: subscriptions,
        grouped
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: err.message
    });
  }
};

// Get single subscription
exports.getSubscription = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format'
      });
    }

    const subscription = await Subscription.findById(req.params.id)
      .select('-__v');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Get related subscriptions of the same type
    const relatedSubscriptions = await Subscription.find({
      type: subscription.type,
      _id: { $ne: subscription._id },
      isActive: true
    })
    .select('name displayName price duration displayPrice')
    .limit(3);

    res.status(200).json({
      success: true,
      data: {
        subscription,
        relatedSubscriptions
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: err.message
    });
  }
};

// Update subscription
exports.updateSubscription = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format'
      });
    }

    // Validate input
    const { isValid, errors } = validateSubscriptionInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    // Update display price if price or duration changed
    if ((req.body.price !== undefined || req.body.duration !== undefined) && !req.body.displayPrice) {
      const subscription = await Subscription.findById(req.params.id);
      const price = req.body.price !== undefined ? req.body.price : subscription.price;
      const duration = req.body.duration !== undefined ? req.body.duration : subscription.duration;

      if (price === 0) {
        req.body.displayPrice = 'Free';
      } else {
        const formatter = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        });
        req.body.displayPrice = `${formatter.format(price)}/${duration}`;
      }
    }

    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-__v');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        errors: { slug: 'A subscription with this slug already exists' }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating subscription',
      error: err.message
    });
  }
};

// Delete subscription
exports.deleteSubscription = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format'
      });
    }

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Optional: Check for active subscribers before deletion
    // const activeSubscribers = await UserSubscription.countDocuments({ 
    //   subscriptionId: req.params.id,
    //   status: 'active'
    // });
    // if (activeSubscribers > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete subscription with ${activeSubscribers} active subscribers`
    //   });
    // }

    await subscription.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting subscription',
      error: err.message
    });
  }
};

// Get subscription comparison
exports.compareSubscriptions = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of subscription IDs to compare'
      });
    }

    // Validate all IDs are valid MongoDB ObjectIDs
    const validIds = ids.every(id => mongoose.Types.ObjectId.isValid(id));
    if (!validIds) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format'
      });
    }

    const subscriptions = await Subscription.find({
      _id: { $in: ids }
    }).select('-__v');

    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No subscriptions found'
      });
    }

    // Create comparison matrix
    const comparison = {
      basic: {
        price: subscriptions.map(s => s.displayPrice),
        duration: subscriptions.map(s => s.duration),
        type: subscriptions.map(s => s.type)
      },
      features: {}
    };

    // Compare all possible features
    const allFeatures = new Set();
    subscriptions.forEach(sub => {
      Object.keys(sub.features).forEach(feature => allFeatures.add(feature));
    });

    // Build feature comparison
    Array.from(allFeatures).forEach(feature => {
      comparison.features[feature] = subscriptions.map(sub => 
        sub.features[feature] !== undefined ? sub.features[feature] : false
      );
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        comparison
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error comparing subscriptions',
      error: err.message
    });
  }
};