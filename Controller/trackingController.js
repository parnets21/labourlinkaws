// const User = require('../Model/User');
// const NodeGeocoder = require('node-geocoder');

// // Initialize geocoder
// const geocoder = NodeGeocoder({
//     provider: 'google',
//     apiKey: process.env.GOOGLE_MAPS_API_KEY
// });

// exports.updateLocation = async (req, res) => {
//     try {
//         const { latitude, longitude } = req.body;

//         if (!latitude || !longitude) {
//             throw new Error('Location coordinates are required');
//         }

//         // Get address from coordinates
//         const geoResult = await geocoder.reverse({ lat: latitude, lon: longitude });
//         const address = geoResult[0]?.formattedAddress;

//         // Update user's location
//         const user = await User.findByIdAndUpdate(
//             req.user._id,
//             {
//                 'profile.location': {
//                     type: 'Point',
//                     coordinates: [longitude, latitude],
//                     address: address
//                 }
//             },
//             { new: true }
//         );

//         res.status(200).json({
//             status: 'success',
//             data: {
//                 location: user.profile.location
//             }
//         });
//     } catch (err) {
//         res.status(400).json({
//             status: 'fail',
//             message: err.message
//         });
//     }
// };

// exports.getEmployeeLocation = async (req, res) => {
//     try {
//         const user = await User.findById(req.params.userId);

//         if (!user) {
//             throw new Error('User not found');
//         }

//         // Check if requester has permission (employer or admin)
//         const hasPermission = 
//             req.user.role === 'admin' || 
//             (req.user.role === 'employer' && user.applications.some(app => 
//                 app.status === 'selected' && app.job.employer.toString() === req.user._id.toString()
//             ));

//         if (!hasPermission) {
//             throw new Error('You do not have permission to track this employee');
//         }

//         res.status(200).json({
//             status: 'success',
//             data: {
//                 location: user.profile.location
//             }
//         });
//     } catch (err) {
//         res.status(400).json({
//             status: 'fail',
//             message: err.message
//         });
//     }
// };
