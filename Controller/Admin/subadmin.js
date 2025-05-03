const subadminModel = require("../../Model/Admin/subadmin");
const {isValid, isValidEmail, phonenumber, isValidString}=require("../../Config/function");
const adminModel=require('../../Model/Admin/admin');
const bcrypt = require("bcryptjs");
const nodemailer=require('nodemailer')
class Subadmin { 

    async SubAdminSignup(req, res) {
        let { name, email, password, mobile,Subscription,rfqEnquiry,payments, date,graphics,notification,industries,intrested,subadmin,category,services,employee,employer,home,appliedDetails,PostedJob,verifiedJob,ourClient,adminId } = req.body
        if(!isValidString(name)) return res.status(400).json({error:"Name should be alphabets minmum size 3-25!"})
        if(!isValidEmail(email)) return res.status(400).json({error:"Invalid email id!"})
        if(!phonenumber(mobile)) return res.status(400).json({error:"Invalid mobile number!"});
        let adminCheck=await adminModel.findOne({ _id: adminId });

        if(!adminCheck) return res.status(400).json({error:"Not allow"})
        let check = await subadminModel.findOne({ mobile: mobile });
        if (check)
          return res
            .status(400)
            .json({ error: "Mobile number is already exist" });
        
     let check2 = await subadminModel.findOne({ email: email });

            if (check2)
              return res.status(400).json({ error: "Email Id is already exist" });
    

        try {
            let Newuser = new subadminModel({
               adminId, name, email, password, mobile,Subscription,rfqEnquiry,payments, date,graphics,notification,industries,intrested,subadmin,category,services,employee,employer,home,appliedDetails,PostedJob,verifiedJob,ourClient
            });
            Newuser.save().then((data) => {
                console.log(data)
                return res.status(200).json({ success: "success" })
            })
        } catch (error) {
            console.log(error);
        }
    }

async udateSubAdmin(req,res){
    // try {
        let { name1, email1, password1, mobile1,graphics1,notification1,industries1,intrested1,subadmin1,category1,
               employee1,employer1,home1,appliedDetails1,PostedJob1,verifiedJob1,ourClient1,adminId ,subadminId,date} = req.body
    
      try {
      let updatedsubadmin = await subadminModel.findOneAndUpdate(
        {_id:subadminId},
        {
         name:name1, email:email1, password:password1, mobile:mobile1,graphics:graphics1,notification:notification1,industries:industries1,
         intrested:intrested1,subadmin:subadmin1,category:category1,
               employee:employee1,employer:employer1,home:home1,appliedDetails:appliedDetails1,PostedJob:PostedJob1,
               verifiedJob:verifiedJob1,ourClient:ourClient1,adminId,date
        },{new:true}
      
      );

     
      if (updatedsubadmin) {
        console.log(updatedsubadmin);
        return res.json({ success: "Updated successfully" });
      } else {
        return res.status(500).json({ error: "cannot able to do" });
      }
    } catch (error) {
      console.log(error);
    }
  }

//         let obj={}
       
//         let data=await subadminModel.findOneAndUpdate({_id:subadminId},{$set:obj},{new:true})
//         if(!data) return res.status(400).json({error:"Something went worng!"});
//         return res.status(200).json({success:data,msg:"Successfully updated"})
//     } catch (error) {
//         console.log(error);
//     }
// }
    async PostSubAdminlogin(req, res) {
        let { email, password } = req.body;
        try {
            if (!email || !password) {
                return res.status(500).json({ error: "Please fill all fields" })
            } else {
                const data = await subadminModel.findOne({ email, password })
                if (!data) {
                    return res.status(500).json({ error: "invalid email or password" })
                } else {
                    return res.status(200).json({ success: "login success",  admin: data})
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    async SubAdminSignout(req, res) {
        let signout = req.params.adminid;
        try {
            await subadminModel.findOneAndUpdate({ _id: signout }, { status: "Offline" })
                .then((data) => { return res.json({ Success: "Signout Successfully" }) })
            //  .catch((err)=> {return res.status({error:"Something went wrong"})})
        } catch (error) {
            console.log(error)
        }
    }

    async GetAllSubadmin(req, res) {
        try {
            let data = await subadminModel.find({});
            if (data) {
                return res.status(200).json({ subAdminList: data })
            } else {
                return res.status(200).json({ error: "not able to do" })
            }
        } catch (error) {
            console.log(error)
        }
    }

async postmail(req, res){
    let { email } = req.body;
    if(!isValid(email)) return res.status(400).json({error:"Please enter email Id!"})
    let data = await subadminModel.findOne({email: email});
    function randomString(length, chars) {
      var mask = '';
      if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
      if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (chars.indexOf('#') > -1) mask += '0123456789';
      if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
      var result = '';
      for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
      return result;
  }
  if (data) {
    let newPassword = randomString(10, 'aA#');
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user:"amitparnets@gmail.com",
        pass:"yzbzpllsthbvrdal",
      },
      port: 465,
      host: "gsmtp.gmail.com",
    });
   
    const mailOptions = {
      from: "amitparnets@gmail.com",
      to: email ,
      subject: 'Your Labor Link new genarated password',
      html:`<h1>Hi ${data.name}</h1><p>Seems like you forgot your password for UNIVI. Your password is :</p> <b> ${newPassword}</b>
     
     
     <p> If you did not initiate this request, please contact us immediately
  at ${process.env.NODE_SENDER_MAIL}</p>
  <h3>Thank you <br>Labor Link Team</h3>`,
     
    };
  
   
 
    //   newPassword = bcrypt.hashSync(newPassword, 10);
      let passChange = subadminModel.findOneAndUpdate({email : email} , {
        $set:{password: newPassword},
      });
    passChange.exec((err, result) => {
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
  
      }
    });
    return res.status(200).json({success: "mail send"})
  });  
  }else{
    return res.status(400).json({error: "Email not Register"})
  }
  }
    async deletesubadmin(req, res) {
        let id = req.params.subadminid;
        const data = await subadminModel.deleteOne({ _id: id });
        if (data) {
            console.log(data);
            return res.json({ success: "deleted successfully" });
        } else {
            return res.status(500).json({ error: "cannot able to do" });
        }
    }
}



const subadminauthontroller = new Subadmin();
module.exports = subadminauthontroller;