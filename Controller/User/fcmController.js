const FCMtoken = require("../../Model/User/FCMtoken")
const User = require("../../Model/User/user")
const admin = require("firebase-admin");
const serviceAccount = require('../../serviceAccountKey.json');

if (!admin.apps.length) {
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
}


exports.updateFCMToken =  async(req,res) => {
    try {
        const {employeeId,token,deviceId,platform} = req.body

        if(!employeeId || !token || !deviceId || !platform){
            return res.status(400).json({
                success:false,
                message:"Missing required fields : employeeId , token , deviceId , platform"
            })
        }

        const employee = await User.findById(employeeId)
        if(!employee){
            return res.status(404).json({
                success:false,
                message:"Employee not found"
            })
        }

        const fcmToken = await FCMtoken.findOneAndUpdate(
            {employeeId}, {
                fcmToken:token,
                deviceId,
                platform,
                isActive:true,
                lastUpdated:new Date(),
            },
            {upsert:true, new :true}
        )

        res.json({
            success:true,
            message:"FCM token updated successfully",
            data:{tokenId:fcmToken._id}
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


     