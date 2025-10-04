const FCMtoken = require("../../Model/User/FCMtoken")
const User = require("../../Model/User/user")
const Employer = require("../../Model/Employers/employers")
const admin = require("firebase-admin");
const serviceAccount = require('../../serviceAccountKey.json');

if (!admin.apps.length) {
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
}


exports.updateFCMToken =  async(req,res) => {
    try {
        // Support both field names for backward compatibility
        const {employeeId, userId, token, fcmToken, deviceId, platform} = req.body
        
        // Use userId if employeeId is not provided (frontend sends userId)
        const actualUserId = userId || employeeId;
        // Use fcmToken if token is not provided (frontend sends fcmToken)
        const actualToken = fcmToken || token;
        // Generate deviceId if not provided
        const actualDeviceId = deviceId || `device_${actualUserId}_${Date.now()}`;

        if(!actualUserId || !actualToken || !platform){
            return res.status(400).json({
                success:false,
                message:"Missing required fields : userId/employeeId , fcmToken/token , platform"
            })
        }

        let employee = await User.findById(actualUserId)
        if(!employee){
          employee = await Employer.findById(actualUserId)
        }
        
       
        if(!employee){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        const fcmTokenRecord = await FCMtoken.findOneAndUpdate(
            {employeeId: actualUserId}, {
                fcmToken: actualToken,
                deviceId: actualDeviceId,
                platform,
                isActive:true,
                lastUpdated:new Date(),
            },
            {upsert:true, new :true}
        )

        res.json({
            success:true,
            message:"FCM token updated successfully",
            data:{tokenId:fcmTokenRecord._id}
        })
    } catch (error) {
        console.error("Error updating FCM token:",error)
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
} 
  

exports.sendNotificationToEmployee = async(req,res) => {
     const { token, title, body } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ error: 'Missing token, title, or body' });
  }

  const message = {
    token,
    notification: {
      title,
      body,
    },
    data: {
      type: 'employee_notification',
    },
  };
  try {
    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('FCM Error:', error);
    res.status(500).json({ success: false, error });
  }
}


exports.sendBulkNotification = async (req, res) => {
  const { employeeIds, title, body } = req.body;

  if (!employeeIds || !Array.isArray(employeeIds) || !title || !body) {
    return res.status(400).json({ error: 'employeeIds (array), title, and body are required' });
  }

  try {
    // Fetch active tokens from DB
    const fcmRecords = await FCMtoken.find({
      employeeId: { $in: employeeIds },
      isActive: true
    });

    const tokens = fcmRecords.map(record => record.fcmToken).filter(Boolean);

    if (tokens.length === 0) {
      return res.status(404).json({ success: false, message: 'No valid FCM tokens found' });
    }

    const message = {
      notification: { title, body },
      data: { type: 'bulk_notification' },
      tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    const { successCount, failureCount, responses } = response;

    res.status(200).json({
      success: true,
      message: 'Bulk notification sent',
      successCount,
      failureCount,
      responses
    });
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.clearFCMToken = async (req, res) => {
  try {
    const { userId, employeeId, deviceId } = req.body;
    
    // Support both userId and employeeId for backward compatibility
    const actualUserId = userId || employeeId;
    
    if (!actualUserId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: userId or employeeId'
      });
    }

    // Build query - if deviceId is provided, clear specific device, otherwise clear all devices for user
    const query = { employeeId: actualUserId };
    if (deviceId) {
      query.deviceId = deviceId;
    }

    // Find and update FCM token(s)
    const updateResult = await FCMtoken.updateMany(
      query,
      { 
        isActive: false,
        lastUpdated: new Date()
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No FCM token found for this user'
      });
    }

    res.status(200).json({
      success: true,
      message: `FCM token(s) cleared successfully`,
      data: {
        userId: actualUserId,
        deviceId: deviceId || 'all devices',
        clearedCount: updateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error clearing FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// Get FCM token by user ID
exports.getFCMTokenByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const fcmRecord = await FCMtoken.findOne({ 
      employeeId: userId, 
      isActive: true 
    });
    
    if (!fcmRecord) {
      return res.status(404).json({
        success: false,
        message: 'No active FCM token found for this user'
      });
    }
    
    res.json({
      success: true,
      data: {
        fcmToken: fcmRecord.fcmToken,
        deviceId: fcmRecord.deviceId,
        platform: fcmRecord.platform,
        lastUpdated: fcmRecord.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error getting FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Get all active FCM tokens (for admin purposes)
exports.getAllActiveTokens = async (req, res) => {
  try {
    const activeTokens = await FCMtoken.find({ isActive: true })
      .populate('employeeId', 'name email')
      .sort({ lastUpdated: -1 });
    
    res.json({
      success: true,
      data: activeTokens,
      count: activeTokens.length
    });
  } catch (error) {
    console.error('Error getting all active tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Reactivate FCM token (useful for re-login scenarios)
exports.reactivateFCMToken = async (req, res) => {
  try {
    const { userId, employeeId, deviceId } = req.body;
    const actualUserId = userId || employeeId;
    
    if (!actualUserId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: userId or employeeId'
      });
    }

    const query = { employeeId: actualUserId };
    if (deviceId) {
      query.deviceId = deviceId;
    }

    const updateResult = await FCMtoken.updateMany(
      query,
      { 
        isActive: true,
        lastUpdated: new Date()
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No FCM token found for this user'
      });
    }

    res.status(200).json({
      success: true,
      message: 'FCM token(s) reactivated successfully',
      data: {
        userId: actualUserId,
        deviceId: deviceId || 'all devices',
        reactivatedCount: updateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error reactivating FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// Delete FCM token permanently (not just deactivate)
exports.deleteFCMToken = async (req, res) => {
  try {
    const { userId, employeeId, deviceId } = req.body;
    const actualUserId = userId || employeeId;
    
    if (!actualUserId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: userId or employeeId'
      });
    }

    const query = { employeeId: actualUserId };
    if (deviceId) {
      query.deviceId = deviceId;
    }

    const deleteResult = await FCMtoken.deleteMany(query);

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No FCM token found for this user'
      });
    }

    res.status(200).json({
      success: true,
      message: 'FCM token(s) deleted permanently',
      data: {
        userId: actualUserId,
        deviceId: deviceId || 'all devices',
        deletedCount: deleteResult.deletedCount
      }
    });
  } catch (error) {
    console.error('Error deleting FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// Get FCM token statistics
exports.getFCMTokenStats = async (req, res) => {
  try {
    const totalTokens = await FCMtoken.countDocuments();
    const activeTokens = await FCMtoken.countDocuments({ isActive: true });
    const inactiveTokens = await FCMtoken.countDocuments({ isActive: false });
    
    const platformStats = await FCMtoken.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]);

    const recentTokens = await FCMtoken.countDocuments({
      lastUpdated: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    res.json({
      success: true,
      data: {
        total: totalTokens,
        active: activeTokens,
        inactive: inactiveTokens,
        platformBreakdown: platformStats,
        recent24h: recentTokens
      }
    });
  } catch (error) {
    console.error('Error getting FCM token stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

     