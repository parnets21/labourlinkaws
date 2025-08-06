// const Subscription = require('../Model/subscription');

// // @desc    Create a new subscription
// // @route   POST /api/subscriptions
// // @access  Public (or Private/Admin based on your needs)
// exports.createSubscription = async (req, res) => {
//   try {
//     const { name, features } = req.body;

//     // Basic validation
//     if (!name || !features || !Array.isArray(features)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Name and features array are required' 
//       });
//     }

//     const subscription = new Subscription({
//       name,
//       features
//     });

//     const savedSubscription = await subscription.save();
    
//     res.status(201).json({
//       success: true,
//       data: savedSubscription
//     });
//   } catch (err) {
//     res.status(500).json({ 
//       success: false,
//       message: err.message 
//     });
//   }
// };

// // @desc    Get all subscriptions
// // @route   GET /api/subscriptions
// // @access  Public
// exports.getSubscriptions = async (req, res) => {
//   try {
//     const subscriptions = await Subscription.find();
    
//     res.status(200).json({
//       success: true,
//       count: subscriptions.length,
//       data: subscriptions
//     });
//   } catch (err) {
//     res.status(500).json({ 
//       success: false,
//       message: err.message 
//     });
//   }
// };

// // @desc    Get single subscription
// // @route   GET /api/subscriptions/:id
// // @access  Public
// exports.getSubscription = async (req, res) => {
//   try {
//     const subscription = await Subscription.findById(req.params.id);
    
//     if (!subscription) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Subscription not found' 
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       data: subscription
//     });
//   } catch (err) {
//     res.status(500).json({ 
//       success: false,
//       message: err.message 
//     });
//   }
// };

// // @desc    Update subscription
// // @route   PUT /api/subscriptions/:id
// // @access  Private/Admin
// exports.updateSubscription = async (req, res) => {
//   try {
//     const { name, features } = req.body;
    
//     const subscription = await Subscription.findByIdAndUpdate(
//       req.params.id,
//       { name, features },
//       { new: true, runValidators: true }
//     );
    
//     if (!subscription) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Subscription not found' 
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       data: subscription
//     });
//   } catch (err) {
//     res.status(500).json({ 
//       success: false,
//       message: err.message 
//     });
//   }
// };

// // @desc    Delete subscription
// // @route   DELETE /api/subscriptions/:id
// // @access  Private/Admin
// exports.deleteSubscription = async (req, res) => {
//   try {
//     const subscription = await Subscription.findByIdAndDelete(req.params.id);
    
//     if (!subscription) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Subscription not found' 
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       data: {}
//     });
//   } catch (err) {
//     res.status(500).json({ 
//       success: false,
//       message: err.message 
//     });
//   }
// };





const Subscription = require('../Model/subscription');

// Create subscription
exports.createSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.create(req.body);
    res.status(201).json(subscription);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single subscription
exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    res.json(subscription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update subscription
exports.updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    res.json(subscription);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete subscription
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    res.json({ message: 'Subscription deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};