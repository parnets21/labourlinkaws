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
      destination: formattedMobile, // MUST be string without + sign
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
    // Ensure mobile is a STRING with country code but no + sign
    const formattedMobile = String(mobile).replace(/\D/g, ''); // Remove all non-digits
    
    const payload = {
      apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ19UUklBTCIsImlhdCI6MTc1NDQ3NTUzNH0.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
      campaignName: "selected candidates",
      destination: formattedMobile, // MUST be string without + sign
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

module.exports = { 
  sendMail,
  sendWhatsAppShortlisted,sendSelectedWhatsapp
};
