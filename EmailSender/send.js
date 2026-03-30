var nodemailer = require("nodemailer"); 
const axios = require("axios");
 

const sendMail = async (name, email, msg) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "support@laborlink.in",
        pass: "qnxucahhbfbzaxie",
      },
      port: 465,
      host: "gsmtp.gmail.com",
    });

    var mailOptions = {
      from:"labor link",
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
// const sendUserRegisteredWhatsapp = async ({ name, mobile }) => {
//   try {
//     const formattedMobile = String(mobile).replace(/\D/g, ""); // ensure only digits

//     const payload = {
//       apiKey:
//         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ19UUklBTCIsImlhdCI6MTc1NDQ3NTUzNH0.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
//       campaignName: "register",
//       destination: formattedMobile,
//       userName: `${name}`,
//       templateParams: [name, mobile], 
//       source: "new-landing-page form",
//       media: {},
//       buttons: [],
//       carouselCards: [],
//       location: {},
//       attributes: {},
//       paramsFallbackValue: {
//         FirstName: name || "user" // inject name here
//       }
//     };

//     const response = await axios.post(
//       "https://backend.api-wa.co/campaign/combirds/api/v2",
//       payload,
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json"
//         }
//       }
//     );

//     return response.data;
//   } catch (err) {
//     console.error("WhatsApp API Error (Register):", {
//       status: err.response?.status,
//       data: err.response?.data
//     });
//     throw err;
//   }
// };
const sendUserRegisteredWhatsapp = async ({ name, mobile }) => {
  try {
    let formattedMobile = String(mobile).replace(/\D/g, ""); // remove non-digits
    if (!formattedMobile.startsWith("91")) {
      formattedMobile = `91${formattedMobile}`; // ensure country code
    }

    const payload = {
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ19UUklBTCIsImlhdCI6MTc1NDQ3NTUzNH0.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
      campaignName: "register",
      destination: formattedMobile,
      userName: "Labor Link",
      templateParams: [name],
      source: "new-landing-page form",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {
        FirstName: name || "user"
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

// Send Subscription Confirmation Email
const sendSubscriptionConfirmationEmail = async (name, email, planName, amount, startDate, endDate, userType) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "support@laborlink.in",
        pass: "qnxucahhbfbzaxie",
      },
      port: 465,
      host: "gsmtp.gmail.com",
    });

    const formattedStartDate = new Date(startDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    
    const formattedEndDate = new Date(endDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .plan-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .highlight { color: #667eea; font-weight: bold; font-size: 24px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Subscription Activated!</h1>
            <p>Welcome to Labor Link Premium</p>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for subscribing to Labor Link. Your <strong>${planName}</strong> subscription has been successfully activated.</p>
            
            <div class="plan-details">
              <h3 style="margin-top: 0; color: #667eea;">Subscription Details</h3>
              <div class="detail-row">
                <span class="detail-label">Plan Name:</span>
                <span class="detail-value">${planName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">User Type:</span>
                <span class="detail-value">${userType === 'employee' ? 'Employee' : 'Employer'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value highlight">${formattedAmount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span>
                <span class="detail-value">${formattedStartDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Valid Until:</span>
                <span class="detail-value">${formattedEndDate}</span>
              </div>
            </div>

            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Access all premium features immediately</li>
              <li>${userType === 'employee' ? 'Apply to unlimited jobs' : 'Post unlimited job openings'}</li>
              <li>Get priority support from our team</li>
              <li>Enjoy enhanced visibility in searches</li>
            </ul>

            <div style="text-align: center;">
              <a href="https://laborlink.in" class="button">Open Labor Link App</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              If you have any questions or need assistance, please contact our support team at support@laborlink.in
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Labor Link. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    var mailOptions = {
      from: "Labor Link <support@laborlink.in>",
      to: email,
      subject: `🎉 Your ${planName} Subscription is Active - Labor Link`,
      html: emailHTML,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Subscription email error:", error.message);
      } else {
        console.log("Subscription confirmation email sent: " + info.response);
      }
    });
  } catch (err) {
    console.log("Error sending subscription email:", err);
  }
};

// Send Registration OTP via SMS
const sendRegistrationOTPSMS = async (mobile, otp) => {
  console.log("📱 Sending Registration OTP SMS to:", mobile, "OTP:", otp);
  
  try {
    const formattedMobile = String(mobile).replace(/\D/g, '');

    // Send debug hash for testing — switch to ukJ5CiNnO4B for release build
    const message = `Your OTP for Labor Link app registration is ${otp}. Do not share it with anyone.\nfObcn2UnCzX`;

    const payload = {
      number: [`91${formattedMobile}`],
      message: message,
      senderId: "LBRLNK",
      templateId: "1707177469649187037"
    };

    console.log("SMS OTP Payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      "https://smsapi.edumarcsms.com/api/v1/sendsms",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "apikey": "ffe14f876d5444038bfe71cddef56f49"
        },
        timeout: 10000
      }
    );

    console.log("✅ SMS OTP sent:", response.status, JSON.stringify(response.data));
    return response.data;
  } catch (err) {
    console.error("❌ SMS OTP Error:", err.message, err.response?.data);
    throw err;
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    console.log("=== TESTING EMAIL CONFIGURATION ===");
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "support@laborlink.in",
        pass: "qnxucahhbfbzaxie",
      },
      port: 587,
      host: "smtp.gmail.com",
      secure: false, // Use TLS
      requireTLS: true,
    });

    // Verify the transporter configuration
    const verified = await transporter.verify();
    console.log("Email transporter verified:", verified);
    return verified;
  } catch (error) {
    console.log("=== EMAIL CONFIGURATION ERROR ===");
    console.log("Error:", error.message);
    console.log("Error code:", error.code);
    console.log("Full error:", error);
    return false;
  }
};

// Send Registration OTP via Email
const sendRegistrationOTPEmail = async (name, email, otp) => {
  try {
    console.log("=== EMAIL FUNCTION DEBUG ===");
    console.log("Function called with:", { name, email, otp });
    
    // Test configuration first
    const configValid = await testEmailConfiguration();
    if (!configValid) {
      throw new Error("Email configuration is invalid");
    }
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "support@laborlink.in",
        pass: "qnxucahhbfbzaxie",
      },
      port: 587,
      host: "smtp.gmail.com",
      secure: false, // Use TLS
      requireTLS: true,
    });

    console.log("Transporter created successfully");

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #134083 0%, #1e5aa8 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .otp-box { background: #f8f9fa; border: 2px dashed #134083; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #134083; letter-spacing: 8px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 Labor Link</div>
            <h1>Verification Code</h1>
            <p>Complete your registration with the OTP below</p>
          </div>
          <div class="content">
            <h2>Hello ${name || 'User'}!</h2>
            <p>Thank you for registering with Labor Link. To complete your registration, please use the verification code below:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 18px; color: #666;">Your Verification Code</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; color: #666; font-size: 14px;">Valid for 10 minutes</p>
            </div>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This OTP is confidential. Never share it with anyone. Labor Link will never ask for your OTP over phone or email.
            </div>

            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Enter this OTP in the app to verify your account</li>
              <li>Complete your profile setup</li>
              <li>Start exploring job opportunities</li>
            </ul>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              If you didn't request this verification code, please ignore this email or contact our support team at support@laborlink.in
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Labor Link. All rights reserved.</p>
            <p>This is an automated email for account verification.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    var mailOptions = {
      from: "Labor Link <support@laborlink.in>",
      to: email,
      subject: `🔐 Your Labor Link Verification Code: ${otp}`,
      html: emailHTML,
    };

    console.log("Mail options prepared:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log("=== EMAIL SEND ERROR ===");
          console.log("OTP email error:", error.message);
          console.log("Error code:", error.code);
          console.log("Error command:", error.command);
          console.log("Error response:", error.response);
          console.log("Error responseCode:", error.responseCode);
          console.log("Full error:", error);
          reject(error);
        } else {
          console.log("=== EMAIL SEND SUCCESS ===");
          console.log("OTP email sent successfully: " + info.response);
          console.log("Message ID:", info.messageId);
          console.log("Accepted:", info.accepted);
          console.log("Rejected:", info.rejected);
          resolve(info);
        }
      });
    });
  } catch (err) {
    console.log("=== EMAIL FUNCTION ERROR ===");
    console.log("Error in sendRegistrationOTPEmail:", err);
    console.log("Error stack:", err.stack);
    throw err;
  }
};
const sendRegistrationOTPWhatsapp = async (mobile, otp) => {
  try {
    let formattedMobile = String(mobile).replace(/\D/g, "");
    // Ensure country code 91 is present
    if (!formattedMobile.startsWith("91")) {
      formattedMobile = `91${formattedMobile}`;
    }

    console.log("Sending WhatsApp OTP to:", formattedMobile, "OTP:", otp);

    const payload = {
      apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ19UUklBTCIsImlhdCI6MTc1NDQ3NTUzNH0.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
      campaignName: "registerotp",
      destination: formattedMobile,
      userName: "Labor Link",
      templateParams: [String(otp)],
      source: "new-landing-page form",
      media: {},
      buttons: [
        {
          type: "button",
          sub_type: "url",
          index: 0,
          parameters: [
            {
              type: "text",
              text: String(otp)
            }
          ]
        }
      ],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: { FirstName: "user" }
    };

    console.log("WhatsApp OTP Payload:", JSON.stringify(payload, null, 2));

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

    console.log("WhatsApp OTP sent successfully:", response.data);
    return response.data;
  } catch (err) {
    console.error("WhatsApp OTP API Error:", {
      status: err.response?.status,
      data: err.response?.data
    });
    throw err;
  }
};
  
//  sendregisterSMS("7238861147","Welcome Amit to Labor Link. Your registration is successful. Complete your profile to start applying for jobs today.")
//sendInterviewDetailsSMS("7238861147","amit","developer","14thsep","3:30PM")
module.exports = {
  sendMail,
  sendWhatsAppShortlisted,sendShortlistedSMS,sendregisterSMS,sendInterviewDetailsSMS,sendSelectedSMS,sendSelectedWhatsapp,sendInterviewDetails,sendUserRegisteredWhatsapp,sendRejectedWhatsapp,sendRegistrationOTPWhatsapp,sendRegistrationOTPSMS,sendRegistrationOTPEmail,sendSubscriptionConfirmationEmail,testEmailConfiguration
};
