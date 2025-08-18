var nodemailer = require("nodemailer"); 
const axios = require("axios");

// 	  user: "donotreply@mitrakart.com",
// pass: "MITRAKART@123",
// yzbzpllsthbvrdal

const sendMail = async (name, email, msg) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "amitparnets@gmail.com",
        pass: "yzbzpllsthbvrdal",
      },
      port: 465,
      host: "gsmtp.gmail.com",
    });

    var mailOptions = {
      from:"amitparnets@gmail.com",
      to: email,
      subject: "Labor Link information",
      text: "Job Alert",
      html: '<h1> Hello ' + name + " </h1><p>" + msg + "</p>",
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (err) {
    console.log(err);
  }
}; 
 


// const sendWhatsAppShortlisted = async (name, mobile,msg,) => {
//   try {
//     const response = await axios.post(
//       "https://backend.api-wa.co/campaign/combirds/api/v2",
//       {
//         apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ1RSSUFMIiwiaWF0IjoxNzU0NDc1NTM0fQ.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
//         campaignName: "ShortListed Message",
//         destination: mobile, 
//         userName: "Labor Link",
//         templateParams: [name, msg], 
//         source: "new-landing-page form",
//         media: {},
//         buttons: [],
//         carouselCards: [],
//         location: {},
//         attributes: {},
//         paramsFallbackValue: {
//           FirstName: "user",
//         },
//       },
//       {
//         headers: { "Content-Type": "application/json" },
//       }
//     );

//     console.log("✅ WhatsApp Shortlist message sent:", response.data);
//     return response.data;
//   } catch (err) {
//     console.error("❌ Error sending WhatsApp Shortlist:", err.message);
//     throw err;
//   }
// };   
 
const sendWhatsAppShortlisted = async (name, mobile, msg) => {
  try {
    // Ensure mobile is a STRING with country code but no + sign
    const formattedMobile = String(mobile).replace(/\D/g, ''); // Remove all non-digits
    
    const payload = {
      apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ19UUklBTCIsImlhdCI6MTc1NDQ3NTUzNH0.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
      campaignName: "ShortListed Message",
      destination: formattedMobile, 
      userName: "Labor Link",
      templateParams: [name, msg],
      source: "new-landing-page form",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: { FirstName: "user" }
    };

    const response = await axios.post(
      "https://backend.api-wa.co/campaign/combirds/api/v2",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );

    return response.data;
  } catch (err) {
    console.error("WhatsApp API Error:", {
      status: err.response?.status,
      data: err.response?.data,
      config: {
        url: err.config?.url,
        data: err.config?.data
      }
    });
    throw err;
  }
};
 
const sendSelectedWhatsapp = async (name,mobile,msg) =>{  
    try {

    const formattedMobile = String(mobile).replace(/\D/g, ''); // Remove all non-digits
    
    const payload = {
      apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ19UUklBTCIsImlhdCI6MTc1NDQ3NTUzNH0.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
      campaignName: "selected candidates",
      destination: formattedMobile, 
      userName: "Labor Link",
      templateParams: [name, msg],
      source: "new-landing-page form",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: { FirstName: "user" }
    };

    const response = await axios.post(
      "https://backend.api-wa.co/campaign/combirds/api/v2",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );

    return response.data;
  } catch (err) {
    console.error("WhatsApp API Error:", {
      status: err.response?.status,
      data: err.response?.data,
      config: {
        url: err.config?.url,
        data: err.config?.data
      }
    });
    throw err;
  }
}; 
// const sendInterviewDetails = async (name, mobile, interviewDetails) => {
//   try {
  

 
//     const formattedMobile = String(mobile).replace(/\D/g, '');
    
//     // Ensure proper formatting (91 for India + 10 digits)
//     const finalMobile = formattedMobile.length === 10 ? `91${formattedMobile}` : formattedMobile;
    
//     console.log(`Attempting to send WhatsApp to: ${finalMobile}`);

//     const payload = {
//       apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ19UUklBTCIsImlhdCI6MTc1NDQ3NTUzNH0.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4", // Your API key
//       campaignName: "interview_schedule", 
//       userName: "Labor Link",
//       templateParams: [name], 
//       source: "labor-link-system",
//       media: {},
//       buttons: [],
//       attributes: {
//       interview_details: interviewDetails 
//       },
//       paramsFallbackValue: {
//         FirstName: name || "Candidate"
//       }
//     };

//     console.log("Sending WhatsApp payload:", payload);

//     const response = await axios.post(
//       "https://backend.api-wa.co/campaign/combirds/api/v2",
//       payload,
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "Accept": "application/json"
//         },
//         timeout: 10000 // 10 second timeout
//       }
//     );

//     console.log("WhatsApp API Success:", response.data);
//     return response.data;

//   } catch (err) {
//     const errorInfo = {
//       message: err.message,
//       status: err.response?.status,
//       responseData: err.response?.data,
//       mobile: mobile,
//       timestamp: new Date().toISOString()
//     };
    
//     console.error("WhatsApp Send Failed:", errorInfo);
//     throw new Error(`WhatsApp notification failed: ${err.message}`);
//   }
// };



const sendInterviewDetails = async (
  name,
  mobile,
  interviewDate,
  interviewTime,
  duration,
  platform,
  meetingLink,
  meetingPassword,
  interviewNotes
) => {
  console.log('[WhatsApp] Starting sendInterviewDetails function');
  console.log('[WhatsApp] Input parameters:', {
    name,
    mobile,
    interviewDate,
    interviewTime,
    duration,
    platform,
    meetingLink,
    meetingPassword,
    interviewNotes
  });

  try {
    console.log('[WhatsApp] Formatting mobile number...');
    const formattedMobile = String(mobile).replace(/\D/g, '');
    console.log('[WhatsApp] After removing non-digits:', formattedMobile);
    
    const finalMobile = formattedMobile.length === 10 ? `91${formattedMobile}` : formattedMobile;
    console.log('[WhatsApp] Final formatted mobile:', finalMobile);

    console.log('[WhatsApp] Building payload...');
    const payload = {
      apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ19UUklBTCIsImlhdCI6MTc1NDQ3NTUzNH0.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
      campaignName: "interviewdtls",
      destination: finalMobile,
      userName: "Labor Link",
      templateParams: [
        name,
        interviewDate,
        interviewTime,
        duration,
        platform || "Not Specified",
        meetingLink || "Not Specified",
        meetingPassword || "Not Required",
        interviewNotes || "None"
      ],
      source: "labor-link-system",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {
        FirstName: name || "Candidate"
      }
    };

    console.log('[WhatsApp] Final payload:', JSON.stringify(payload, null, 2));

    console.log('[WhatsApp] Sending to WhatsApp API...');
    const response = await axios.post(
      "https://backend.api-wa.co/campaign/combirds/api/v2",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        timeout: 10000
      }
    );

    console.log('[WhatsApp] API Response:', {
      status: response.status,
      data: response.data
    });

    return response.data;

  } catch (err) {
    console.error('[WhatsApp] ERROR DETAILS:', {
      message: err.message,
      stack: err.stack,
      responseStatus: err.response?.status,
      responseData: err.response?.data,
      config: {
        url: err.config?.url,
        method: err.config?.method,
        data: err.config?.data
      }
    });
    throw err;
  }
};

// Updated callinterview endpoint with comprehensive logging
async function callinterview(req, res) {
  console.log('[API] callinterview endpoint hit');
  console.log('[API] Request body:', req.body);
  console.log('[API] Request params:', req.params);

  try {
    const {
      userId, schedule, slotId, status, employerId, feedback,
      Position, name, meetingPassword, meetingLink, email,
      companyId, platform, interviewNotes, duration
    } = req.body;

    console.log('[API] Validating required fields...');
    if (!userId || !employerId || !email || !companyId) {
      console.error('[API] Validation failed - missing required fields');
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Handle slot booking if slotId provided
    if (slotId) {
      console.log('[API] Slot ID provided:', slotId);
      const slot = await Appointment.findById(slotId);
      console.log('[API] Found slot:', slot);

      if (!slot) {
        console.error('[API] Slot not found');
        return res.status(404).json({ error: "Slot not found" });
      }
      if (slot.status === "booked") {
        console.error('[API] Slot already booked');
        return res.status(400).json({ error: "Slot already booked" });
      }

      console.log('[API] Updating slot status to booked');
      slot.status = "booked";
      await slot.save();
      console.log('[API] Slot updated successfully');
    }

    console.log('[API] Fetching user data for userId:', userId);
    const userData = await userModel.findById(userId);
    if (!userData) {
      console.error('[API] User not found');
      return res.status(404).json({ error: "User not found" });
    }
    console.log('[API] User found:', userData);

    console.log('[API] Checking for existing interview calls...');
    const existingCall = await callModel.findOne({
      userId,
      employerId,
      companyId
    });

    if (existingCall) {
      console.log('[API] Existing interview found:', existingCall);
      return res.status(200).json({
        user: userData,
        success: "Interview already scheduled!"
      });
    }

    console.log('[API] Creating new interview call...');
    const newCall = await callModel.create({
      employerId,
      userId,
      schedule: slotId ? (await Appointment.findById(slotId)).date : schedule,
      status: status || "Scheduled",
      name,
      email,
      companyId,
      platform,
      meetingPassword,
      meetingLink,
      interviewNotes,
      duration: slotId ? (await Appointment.findById(slotId))?.duration : duration,
      feedback,
      Position,
    });
    console.log('[API] New interview created:', newCall);

    // Send notifications
    try {
      console.log('[API] Preparing to send notifications...');
      if (slotId) {
        console.log('[API] Sending notification with slot details');
        const slot = await Appointment.findById(slotId);
        await sendInterviewDetails(
          name,
          userData.mobile,
          slot.date.toDateString(),
          slot.time,
          slot.duration,
          platform,
          meetingLink,
          meetingPassword,
          interviewNotes
        );
      } else {
        console.log('[API] Sending notification with schedule details');
        const interviewDate = new Date(schedule);
        await sendInterviewDetails(
          name,
          userData.mobile,
          interviewDate.toDateString(),
          interviewDate.toTimeString().split(' ')[0],
          duration,
          platform,
          meetingLink,
          meetingPassword,
          interviewNotes
        );
      }
      console.log('[API] Notifications sent successfully');
    } catch (notificationError) {
      console.error('[API] Notification failed (proceeding anyway):', notificationError);
    }

    console.log('[API] Returning success response');
    return res.status(201).json({
      success: "Interview scheduled successfully",
      userData
    });

  } catch (error) {
    console.error('[API] ERROR in callinterview:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      requestParams: req.params
    });
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message
    });
  }
}

module.exports = { 
  sendMail,
  sendWhatsAppShortlisted,sendSelectedWhatsapp,sendInterviewDetails
};
