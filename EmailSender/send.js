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
  mobile,msg
) => {
  try {
    const formattedMobile = String(mobile).replace(/\D/g, '');
    const finalMobile = formattedMobile.length === 10 ? `91${formattedMobile}` : formattedMobile;

    console.log(`Attempting to send WhatsApp to: ${finalMobile}`);

    const payload = {
      apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ19UUklBTCIsImlhdCI6MTc1NDQ3NTUzNH0.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
      campaignName: "interviewdtls",   
      destination: finalMobile,         
      userName: "Labor Link",
      templateParams: [
        name,                          
        date || "Not Specified",                      
        time || "Not Specified",                      
        duration || "Not Specified",                 
        platform || "Not Specified",                 
        meetingLink || "Not Specified",               
        meetingPassword || "Not Required",            
        interviewNotes || "Not Specified"
      ],
      source: "labor-link-system",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {
        FirstName: name || "user"
      }
    };

    console.log("Sending WhatsApp payload:", payload);

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

    console.log("WhatsApp API Success:", response.data);
    return response.data;

  } catch (err) {
    const errorInfo = {
      message: err.message,
      status: err.response?.status,
      responseData: err.response?.data,
      mobile: mobile,
      timestamp: new Date().toISOString()
    };

    console.error("WhatsApp Send Failed:", errorInfo);
    throw new Error(`WhatsApp notification failed: ${err.message}`);
  }
};

module.exports = { 
  sendMail,
  sendWhatsAppShortlisted,sendSelectedWhatsapp,sendInterviewDetails
};
