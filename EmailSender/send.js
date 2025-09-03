var nodemailer = require("nodemailer"); 
const axios = require("axios");
 

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
const sendWhatsAppShortlisted = async (name, mobile, msg) => {
  try {
    // Ensure mobile is a STRING with country code but no + sign
    const formattedMobile = String(mobile).replace(/\D/g, '');  
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
const sendInterviewDetails = async (name,mobile,date,time,duration,platform,plink,password,note) =>{  
    try {

    const formattedMobile = String(mobile).replace(/\D/g, ''); // Remove all non-digits
    
     const payload = {
       apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ19UUklBTCIsImlhdCI6MTc1NDQ3NTUzNH0.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
      campaignName: "interviewdtls",
      destination: formattedMobile,
      userName: "Labor Link",
      templateParams: [name, date,time,duration,platform,plink,password,note],
      source: "new-landing-page form",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {
        FirstName: name || "Candidate"
      }
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
const sendUserRegisteredWhatsapp = async ({ name, mobile }) => {
  try {
    const formattedMobile = String(mobile).replace(/\D/g, ""); // ensure only digits

    const payload = {
      apiKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ19UUklBTCIsImlhdCI6MTc1NDQ3NTUzNH0.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
      campaignName: "register",
      destination: formattedMobile,
      userName: "Labor Link",
      templateParams: ["$FirstName"], // must be same as template param
      source: "new-landing-page form",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {
        FirstName: name || "user" // inject name here
      }
    };

    const response = await axios.post(
      "https://backend.api-wa.co/campaign/combirds/api/v2",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      }
    );

    return response.data;
  } catch (err) {
    console.error("WhatsApp API Error (Register):", {
      status: err.response?.status,
      data: err.response?.data
    });
    throw err;
  }
};
const sendShortlistedSMS = async (mobile, msg) => {
  try {
    const formattedMobile = String(mobile).replace(/\D/g, ''); 

    const payload = {
      number: [`91${formattedMobile}`],
      message: msg,
      senderId: "LBRLNK",
      templateId: "1707175610201513656", 
    };

    const response = await axios.post(
      "https://smsapi.edumarcsms.com/api/v1/sendsms",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "apikey": "ffe14f876d5444038bfe71cddef56f49"
        }
      }
    );

    return response.data;
  } catch (err) {
    console.error("SMS API Error:", {
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
const sendSelectedSMS = async (mobile, msg) => {
  try {
    const formattedMobile = String(mobile).replace(/\D/g, ''); 

    const payload = {
      number: [`91${formattedMobile}`],
      message: msg,
      senderId: "LBRLNK",
      templateId: "1707175671850574302", 
    };

    const response = await axios.post(
      "https://smsapi.edumarcsms.com/api/v1/sendsms",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "apikey": "ffe14f876d5444038bfe71cddef56f49"
        }
      }
    );

    return response.data;
  } catch (err) {
    console.error("SMS API Error:", {
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
// const sendInterviewDetailsSMS = async (mobile,msg) => {
//   try {
//     const formattedMobile = String(mobile).replace(/\D/g, ''); 

//     const payload = {
//       number: [`91${formattedMobile}`],
//       message: msg,
//       senderId: "LBRLNK",
//       templateId: "1707175672187250636", 
//     };

//     const response = await axios.post(
//       "https://smsapi.edumarcsms.com/api/v1/sendsms",
//       payload,
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "apikey": "5e0069bdeb7441cf90c12fe1c33e045c"
//         }
//       }
//     );

//     return response.data;
//   } catch (err) {
//     console.error("SMS API Error:", {
//       status: err.response?.status,
//       data: err.response?.data,
//       config: {
//         url: err.config?.url,
//         data: err.config?.data
//       }
//     });
//     throw err;
//   }
// }; 
 
const sendInterviewDetailsSMS= async (mobile, name, position, date, time) => {
  try {
    const formattedMobile = String(mobile).replace(/\D/g, ''); 
    
    // Format the message to match your template exactly
    // Template: Hi{#var#} Your interview for{#var#} is scheduled on{#var#} at{#var#} - Labor Link
    const message = `Hi ${name} Your interview for ${position} is scheduled on ${date} at ${time} - Labor Link`;

    console.log("=== SMS PAYLOAD DEBUG ===");
    console.log("Formatted Mobile:", formattedMobile);
    console.log("Template Variables:");
    console.log("- Name:", name);
    console.log("- Position:", position);
    console.log("- Date:", date);
    console.log("- Time:", time);
    console.log("Final Message:", message);

    const payload = {
      number: [`91${formattedMobile}`],
      message: message,
      senderId: "LBRLNK",
      templateId: "1707175672187250636", 
    };

    console.log("SMS API Payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      "https://smsapi.edumarcsms.com/api/v1/sendsms",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "apikey": "ffe14f876d5444038bfe71cddef56f49"
        }
      }
    );

    console.log("SMS API Full Response:", response.data);
    return response.data;
  } catch (err) {
    console.error("=== SMS API DETAILED ERROR ===");
    console.error("Error Status:", err.response?.status);
    console.error("Error Data:", err.response?.data);
    console.error("Error Headers:", err.response?.headers);
    console.error("Request Config:", {
      url: err.config?.url,
      data: err.config?.data,
      headers: err.config?.headers
    });
    throw err;
  }
};
const sendRejectedWhatsapp = async (name,mobile,msg) =>{  
    try {

    const formattedMobile = String(mobile).replace(/\D/g, ''); // Remove all non-digits
    
    const payload = {
     apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ19UUklBTCIsImlhdCI6MTc1NDQ3NTUzNH0.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
  campaignName: "Rejected",
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
const sendregisterSMS = async (mobile, name) => {
  try {
    const formattedMobile = String(mobile).replace(/\D/g, ''); 

    const payload = {
      number: [`91${formattedMobile}`],
      message: name, // ✅ pass only the variable value
      senderId: "LBRLNK",
      templateId: "1707175672728517784",
    };

    const response = await axios.post(
      "https://smsapi.edumarcsms.com/api/v1/sendsms",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "apikey": "ffe14f876d5444038bfe71cddef56f49"
        }
      }
    );

    return response.data;
  } catch (err) {
    console.error("SMS API Error:", {
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
  
//  sendregisterSMS("7238861147","Welcome Amit to Labor Link. Your registration is successful. Complete your profile to start applying for jobs today.")
// sendInterviewDetailsSMS("9902742423","Hi Kiran Your interview for developer is scheduled on 15th September at12:30PM- Labor Link")
module.exports = {
  sendMail,
  sendWhatsAppShortlisted,sendShortlistedSMS,sendregisterSMS,sendInterviewDetailsSMS,sendSelectedSMS,sendSelectedWhatsapp,sendInterviewDetails,sendUserRegisteredWhatsapp,sendRejectedWhatsapp
};
