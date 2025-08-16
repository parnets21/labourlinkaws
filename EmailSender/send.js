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
 


const sendWhatsAppShortlisted = async (name, mobile,msg) => {
  try {
    const response = await axios.post(
      "https://backend.api-wa.co/campaign/combirds/api/v2",
      {
        apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTMyYzBlZmY4NGRiMGMwZjNlNDg4ZiIsIm5hbWUiOiJMYWJvciBMaW5rIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4OTMyYzBkZmY4NGRiMGMwZjNlNDg4NyIsImFjdGl2ZVBsYW4iOiJCQVNJQ1RSSUFMIiwiaWF0IjoxNzU0NDc1NTM0fQ.1SEjuYr_EQBgevXcTCP2wMTQ-M_EuznoS_-3XEiEeK4",
        campaignName: "ShortListed Message",
        destination: mobile, 
        userName: "Labor Link",
        templateParams: [name, msg], 
        source: "new-landing-page form",
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: {
          FirstName: "user",
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("✅ WhatsApp Shortlist message sent:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Error sending WhatsApp Shortlist:", err.message);
    throw err;
  }
};

module.exports = { sendWhatsAppShortlisted };


module.exports = { sendMail };
