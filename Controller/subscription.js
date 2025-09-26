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

// Get all subscriptions with enhanced features
exports.getSubscriptions = async (req, res) => {
  try {
    const {
      type,
      isActive,
      duration,
      minPrice,
      maxPrice,
      sort = 'price',
      limit = 50,
      offset = 0
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

    // Build sort object with enhanced options
    let sortObj = {};
    switch (sort) {
      case 'price':
        sortObj.price = 1;
        break;
      case '-price':
        sortObj.price = -1;
        break;
      case 'name':
        sortObj.displayName = 1;
        break;
      case '-name':
        sortObj.displayName = -1;
        break;
      case 'popular':
        sortObj.isPopular = -1;
        sortObj.price = 1;
        break;
      case 'created':
        sortObj.createdAt = -1;
        break;
      default:
        // Default sort: popular first, then by price
        sortObj.isPopular = -1;
        sortObj.price = 1;
    }

    // Get total count for pagination
    const totalCount = await Subscription.countDocuments(filter);

    // Fetch subscriptions with pagination
    const subscriptions = await Subscription.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-__v')
      .lean();

    // Enhance subscription data
    const enhancedSubscriptions = subscriptions.map(sub => {
      // Calculate savings for yearly plans
      let savings = null;
      if (sub.duration === 'yearly' && sub.monthlyEquivalent) {
        savings = {
          amount: (sub.monthlyEquivalent * 12) - sub.price,
          percentage: Math.round(((sub.monthlyEquivalent * 12 - sub.price) / (sub.monthlyEquivalent * 12)) * 100)
        };
      }

      // Add popularity score based on various factors
      let popularityScore = 0;
      if (sub.isPopular) popularityScore += 100;
      if (sub.isMostPurchased) popularityScore += 50;
      if (sub.price > 0 && sub.price < 1000) popularityScore += 25; // Sweet spot pricing
      
      return {
        ...sub,
        savings,
        popularityScore,
        isRecommended: sub.isPopular || popularityScore > 75,
        formattedPrice: formatCurrency(sub.price),
        featureCount: sub.highlightedFeatures?.length || 0
      };
    });

    // Group subscriptions by type with enhanced data
    const grouped = enhancedSubscriptions.reduce((acc, sub) => {
      if (!acc[sub.type]) {
        acc[sub.type] = [];
      }
      acc[sub.type].push(sub);
      return acc;
    }, {});

    // Add type-specific metadata
    Object.keys(grouped).forEach(type => {
      grouped[type] = {
        plans: grouped[type],
        count: grouped[type].length,
        priceRange: {
          min: Math.min(...grouped[type].map(p => p.price)),
          max: Math.max(...grouped[type].map(p => p.price))
        },
        hasFreePlan: grouped[type].some(p => p.price === 0),
        recommendedPlan: grouped[type].find(p => p.isRecommended) || grouped[type][0]
      };
    });

    res.status(200).json({
      success: true,
      count: enhancedSubscriptions.length,
      totalCount,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + enhancedSubscriptions.length) < totalCount
      },
      data: {
        all: enhancedSubscriptions,
        grouped
      },
      meta: {
        filters: { type, isActive, duration, minPrice, maxPrice },
        sort,
        totalPlans: totalCount,
        planTypes: Object.keys(grouped)
      }
    });
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: err.message
    });
  }
};

// Helper function to format currency
function formatCurrency(amount) {
  if (amount === 0) return 'Free';
  
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
  
  return formatter.format(amount);
}

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

// Get featured/recommended subscriptions
exports.getFeaturedSubscriptions = async (req, res) => {
  try {
    const { type, limit = 3 } = req.query;
    
    const filter = { isActive: true };
    if (type) filter.type = type;
    
    const featuredSubscriptions = await Subscription.find(filter)
      .sort({ isPopular: -1, isFeatured: -1, price: 1 })
      .limit(parseInt(limit))
      .select('-__v')
      .lean();

    const enhancedSubscriptions = featuredSubscriptions.map(sub => ({
      ...sub,
      formattedPrice: formatCurrency(sub.price),
      isRecommended: sub.isPopular || sub.isFeatured,
      featureCount: sub.highlightedFeatures?.length || 0
    }));

    res.status(200).json({
      success: true,
      count: enhancedSubscriptions.length,
      data: enhancedSubscriptions,
      meta: {
        type: type || 'all',
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error fetching featured subscriptions:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured subscriptions',
      error: err.message
    });
  }
};

// Get subscription analytics
exports.getSubscriptionAnalytics = async (req, res) => {
  try {
    const { type, period = '30d' } = req.query;
    
    const filter = {};
    if (type) filter.type = type;

    // Date range for trends
    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));

    // Get basic stats
    const totalPlans = await Subscription.countDocuments(filter);
    const activePlans = await Subscription.countDocuments({ ...filter, isActive: true });
    const freePlans = await Subscription.countDocuments({ ...filter, price: 0 });
    
    // Get price analytics
    const priceStats = await Subscription.aggregate([
      { $match: { ...filter, isActive: true } },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalRevenuePotential: { $sum: '$price' }
        }
      }
    ]);

    // Get plans by duration
    const plansByDuration = await Subscription.aggregate([
      { $match: { ...filter, isActive: true } },
      {
        $group: {
          _id: '$duration',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get plans by type distribution
    const plansByType = await Subscription.aggregate([
      { $match: { ...filter, isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalRevenue: { $sum: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity trend (if createdAt exists)
    let recentTrend = [];
    try {
      recentTrend = await Subscription.aggregate([
        { 
          $match: { 
            ...filter, 
            createdAt: { $gte: startDate }
          } 
        },
        {
          $group: {
            _id: {
              $dateToString: { 
                format: "%Y-%m-%d", 
                date: "$createdAt" 
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    } catch (error) {
      console.log('Recent trend data not available (createdAt field may not exist)');
    }

    // Get popular features (if features field exists)
    let popularFeatures = [];
    try {
      popularFeatures = await Subscription.aggregate([
        { $match: { ...filter, isActive: true, features: { $exists: true, $ne: [] } } },
        { $unwind: '$features' },
        {
          $group: {
            _id: '$features',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
    } catch (error) {
      console.log('Popular features data not available');
    }

    const pricing = priceStats[0] || {
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      totalRevenuePotential: 0
    };

    // Round pricing values for better display
    pricing.avgPrice = Math.round(pricing.avgPrice || 0);
    pricing.minPrice = Math.round(pricing.minPrice || 0);
    pricing.maxPrice = Math.round(pricing.maxPrice || 0);
    pricing.totalRevenuePotential = Math.round(pricing.totalRevenuePotential || 0);

    // Calculate health metrics
    const healthMetrics = {
      activeRatio: totalPlans > 0 ? Math.round((activePlans / totalPlans) * 100) : 0,
      freeRatio: totalPlans > 0 ? Math.round((freePlans / totalPlans) * 100) : 0,
      paidRatio: totalPlans > 0 ? Math.round(((totalPlans - freePlans) / totalPlans) * 100) : 0,
      avgRevenuePerPlan: activePlans > 0 ? Math.round(pricing.totalRevenuePotential / activePlans) : 0
    };

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalPlans,
          activePlans,
          freePlans,
          paidPlans: totalPlans - freePlans,
          activePercentage: healthMetrics.activeRatio
        },
        pricing,
        distribution: {
          byDuration: plansByDuration,
          byType: plansByType
        },
        trends: {
          period: period,
          recentActivity: recentTrend,
          popularFeatures: popularFeatures,
          growthRate: recentTrend.length > 1 ? 
            Math.round(((recentTrend[recentTrend.length - 1]?.count || 0) / 
            (recentTrend[0]?.count || 1) - 1) * 100) : 0
        },
        health: healthMetrics
      },
      meta: {
        type: type || 'all',
        period: period,
        generatedAt: new Date().toISOString(),
        dataPoints: {
          subscriptions: totalPlans,
          trends: recentTrend.length,
          features: popularFeatures.length
        }
      }
    });
  } catch (err) {
    console.error('Error fetching subscription analytics:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription analytics',
      error: err.message
    });
  }
};