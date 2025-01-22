const otpModel = require("../../Model/User/otp");
const userModel = require("../../Model/User/user");
const { default: axios } = require("axios");
const send=require('../../EmailSender/send');

class Otp {
  async sendSmsotp(req, res) {
    let { mobile ,name,email} = req.body;
    if (!mobile) {
      return res.json({ error: "No Number" });
    } else {
      try {
        let newnumber = await otpModel.findOne({ mobile: mobile });
        if (newnumber) {
          const key = "Ae97f7ad9d6c2647071d78b6e94a3c87e";
          const sid = "RDABST";
          const to = mobile;
          const body = `Hi, Your OTP for mobile verification is ${otp} Regards, Team ReadAbstract`;
          axios
            .get(
              "https://api-alerts.kaleyra.com/v4/?api_key=" +
                key +
                "&method=sms&message=" +
                body +
                "&to=" +
                to +
                "&sender=RDABST"
            )
            .then(async (data) => {
              console.log(`statusCode: ${data.status}`);
                send.sendMail(name,email,`Hi, Your OTP for Email verification is ${otp} Regards,Team JobBox`)
              return res.json({ otp: newnumber.otp });
            })
            .catch((error) => {
              console.error(error);
              return res.status(500).json({ error: error });
            });
          //
        } else {
          var otp = (Math.floor(Math.random() * 1000000) + 1000000)
            .toString()
            .substring(1);
        
          let newotp = new otpModel({
            mobile,
            otp,
          });
          let save;
          const key = "Ae97f7ad9d6c2647071d78b6e94a3c87e";
          const sid = "RDABST";
          const to = mobile;
          const body = `Hi, Your OTP for mobile verification is ${otp} Regards, Team ReadAbstract`;
          axios
            .get(
              "https://api-alerts.kaleyra.com/v4/?api_key=" +
                key +
                "&method=sms&message=" +
                body +
                "&to=" +
                to +
                "&sender=RDABST"
            )
            .then(async (data) => {
              console.log(`statusCode: ${data.status}`);
              send.sendMail(name,email,`Hi, Your OTP for Email verification is ${otp} Regards,Team JobBox`)
              save = await newotp.save();
              if (save) {
                return res.json({ success: "otp sent successfully", otp });
              }
            })
            .catch((error) => {
              console.error(error);
              return res.status(500).json({ error: error });
            });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async verifyotp(req, res) {
    const { otp, mobile } = req.body;

    // console.log(otp, mobile);
    if (!otp) {
      return res.json({ error: "enter otp" });
    } else {
      try {
        let verify = await otpModel.findOne({
          otp: otp,
          mobile: mobile,
        });
        if (verify) {
          let user = await userModel.findOne(
            {
              mobile: mobile,
            }
          );
          if(user){
            return res.json({ success: "otp verified", user: user });
          }else{
            let create=await userModel.create({mobile:mobile})
            return res.json({ success: "otp verified", user: create });
          }
        } else {
          return res.status(500).json({ error: "enter vaild otp" });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
}

const authotpController = new Otp();
module.exports = authotpController;
