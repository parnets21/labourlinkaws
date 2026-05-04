const User = require('../Model/User/user');
const Location = require('../Model/Admin/Location');

// Update employee location
exports.updateLocation = async (req, res) => {
    try {
        const { latitude, longitude, address, type, activity, workMode } = req.body;
        const userId = req.user._id;

        console.log('📍 Update location request:', { userId, latitude, longitude, address });

        if (!latitude || !longitude) {
            return res.status(400).json({
                status: 'fail',
                message: 'Location coordinates (latitude, longitude) are required'
            });
        }

        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid coordinates'
            });
        }

        // Create location record
        const location = await Location.create({
            user: userId,
            type: type || 'Remote',
            location: {
                type: 'Point',
                coordinates: [longitude, latitude],
                address: address || 'Unknown location'
            },
            activity: activity || 'work',
            workMode: workMode || 'remote',
            status: 'active',
            tracking: {
                deviceId: req.headers['user-agent'],
                ipAddress: req.ip || req.connection.remoteAddress
            }
        });

        console.log('✅ Location updated successfully:', location._id);

        res.status(200).json({
            status: 'success',
            message: 'Location updated successfully',
            data: {
                location: location
            }
        });
    } catch (err) {
        console.error('❌ Update location error:', err);
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get employee's current location (for employers/admin)
exports.getEmployeeLocation = async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('🔍 Get employee location request:', { userId, requestedBy: req.user._id });

        if (!userId) {
            return res.status(400).json({
                status: 'fail',
                message: 'User ID is required'
            });
        }

        // Find the user
        const user = await User.findById(userId).select('fullName email phone userType');

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        // Get the latest location
        const latestLocation = await Location.findOne({ user: userId })
            .sort({ createdAt: -1 })
            .limit(1);

        if (!latestLocation) {
            return res.status(404).json({
                status: 'fail',
                message: 'No location data available for this employee. The employee needs to enable location tracking in their app.',
                data: {
                    user: {
                        id: user._id,
                        name: user.fullName,
                        email: user.email
                    },
                    hasLocation: false
                }
            });
        }

        // Check if location is recent (within last 30 minutes)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const isRecent = latestLocation.createdAt > thirtyMinutesAgo;

        console.log('✅ Location found:', {
            locationId: latestLocation._id,
            isRecent,
            lastUpdate: latestLocation.createdAt
        });

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    name: user.fullName,
                    email: user.email,
                    phone: user.phone
                },
                location: {
                    latitude: latestLocation.location.coordinates[1],
                    longitude: latestLocation.location.coordinates[0],
                    address: latestLocation.location.address,
                    type: latestLocation.type,
                    activity: latestLocation.activity,
                    workMode: latestLocation.workMode,
                    status: latestLocation.status,
                    lastUpdated: latestLocation.createdAt,
                    isRecent: isRecent
                },
                hasLocation: true
            }
        });
    } catch (err) {
        console.error('❌ Get employee location error:', err);
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get location history for an employee
exports.getLocationHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate, limit = 100 } = req.query;

        console.log('📜 Get location history request:', { userId, startDate, endDate });

        const query = { user: userId };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const locations = await Location.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .select('-tracking -__v');

        res.status(200).json({
            status: 'success',
            results: locations.length,
            data: {
                locations
            }
        });
    } catch (err) {
        console.error('❌ Get location history error:', err);
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};
