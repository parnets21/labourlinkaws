const applyModel = require("../../Model/Employers/apply");
const userModel = require("../../Model/User/user");
const bcrypt = require("bcryptjs");
const send = require("../../EmailSender/send");
const intrestedModel=require("../../Model/Employers/intrested");
const nodemailer=require('nodemailer')
const saltRounds = 10;
const {isValid, isValidEmail, phonenumber, isValidString}=require("../../Config/function")
const resumeModel=require("../../Model/User/resume");


class user {
  async register(req, res) {
    try {
      const {
        mobile,
        skill,
        age,
        name,
        userName,
        email,
        password,
        address,
        street,
        city,
        state,
        int,
        int1,
        int2,
        pincode,
        gender,
        country,
        industry,
        bio,
      } = req.body;
      let interest = { int, int1, int2 };
      let encryptedPassword = bcrypt.hash(password, 10).then((hash) => {
        return hash;
      });
      
      let pwd = await encryptedPassword;
      if(!isValidString(name)) return res.status(400).json({error:"Name should be alphabets minimum size 3-25!"})
          if(password.length<8) return res.status(400).json({error:"Password should be minimum 8 characters!"})
        // if(!industry) return res.status(400).json({error:"Please enter category!"});
      if(!isValidEmail(email)) return res.status(400).json({error:"Invalid email id!"})
      if(!phonenumber(mobile)) return res.status(400).json({error:"Invalid mobile number!"});
  
    //   let userN = await userModel.findOne({ userName: userName ,isDelete:false});

    //   if (userN)
    //     return res.status(400).json({ error: "try to different user name" });

      let check = await userModel.findOne({ mobile: mobile ,isDelete:false});

      if (check)
        return res
          .status(400)
          .json({ error: "Mobile number is already exist" });
      let check2 = await userModel.findOne({ email: email ,isDelete:false});
      if (check2)
        return res.status(400).json({ error: "Email Id is already exist" });

      await userModel.create({
        mobile,
        skill,
        userName,
        street,
        city,
        state,
        address,
        pincode,
        password: pwd,
        age,
        name,
        interest: interest,
        email,
        gender,
        country,
        bio,
        industry
      });
      let ab = send.sendMail(name, email,` welcome to UNIVI INDIA<h3>Thank you <br>UNIVI INDIA Team</h3>`);
      console.log(ab);
      return res.status(200).json({ success: "Successfully registered" });
    } catch (err) {
      console.log(err);
    }
  }
  async editProfile(req, res) {
    try {
      const {
        userId,
        mobile,
        skill,
        age,
        password,
        cpassword,
        userName,
        name,
        address,
        skillSet,
        email,
        street,
        city,
        state,
        pincode,
        gender,
        int,
        int1,
        int2,
        country,
        bio,
        int3,
        industry
      } = req.body;
      let obj = {};
      if(industry){
        obj["industry"]=industry;
      }
      if (mobile) {
        if(!phonenumber(mobile)) return res.status(400).json({error:"Invalid mobile number!"});
        let check = await userModel.findOne({ mobile: mobile,isDelete:false });
        // if (check)
        //   return res
        //     .status(400)
        //     .json({ error: "Mobile number is already exist" });
        obj["mobile"] = mobile;
      }
      if (email) {
        if(!isValidEmail(email)) return res.status(400).json({error:"Invalid email id!"})
        let check2 = await userModel.findOne({ email: email,isDelete:false });
        // if (check2)
        //   return res.status(400).json({ error: "Email Id is already exist" });
         obj["email"] = email;
      }
      if (name) {
        if(!isValidString(name)) return res.status(400).json({error:"Name should be alphabets minmum size 3-25!"})
        obj["name"] = name;
      }
      if (age) {
        obj["age"] = age;
      }
      if (skill) {
        obj["skill"] = skill;
      }
      if (gender) {
        obj["gender"] = gender;
      }
      if (address) {
        obj["address"] = address;
      }
      if (userName) {
        let check3 = await userModel.findOne({ userName: userName,isDelete:false });
        if (check3)
          return res
            .status(400)
            .json({ error: "try to different user name" });

        obj["userName"] = userName;
      }
      if (street) {
        obj["street"] = street;
      }
      if (city) {
        obj["city"] = city;
      }
      if (state) {
        obj["state"] = state;
      }
      if (pincode) {
        if (!/^[0-9]{6}$/.test(pincode)) return res.status(400).send({ error: "Invalid pin code" });
        obj["pincode"] = pincode;
      }

      if (password) {

        if(password!==cpassword) return res.status(400).json({error:"Confirm password dose not match!"})

        // send.sendMail()
        let encryptedPassword = bcrypt
          .hash(password, saltRounds)
          .then((hash) => {
            return hash;
          });
        let pwd = await encryptedPassword;

        obj["password"] = pwd;
      }
      if (int) {
        obj["interest.int"] = int;
      }
      if (int1) {
        obj["interest.int1"] = int1;
      }
      if (int2) {
        obj["interest.int2"] = int2;
      }
      if (int3) {
        obj["interest.int3"] = int3;
      }
      if (country) {
        obj["country"] = country;
      }
      if (bio) {
        obj["bio"] = bio;
      }
      if (skillSet) {
        obj["skillSet"] = skillSet;
      }

      if (req.files.length != 0) {
        let arr = req.files;
        let i;
        for (i = 0; i < arr.length; i++) {
          if (arr[i].fieldname == "resume") {
            obj["resume"] = arr[i].filename;
          }
          if (arr[i].fieldname == "profile") {
            obj["profile"] = arr[i].filename;
          }
          if (arr[i].fieldname == "backgroundImage") {
            obj["backgroundImage"] = arr[i].filename;
          }
        }
      }
     
      let updateUser = await userModel.findOneAndUpdate(
        { _id: userId },
        { $set: obj },
        { new: true }
      );
      if (!updateUser)
        return res.status(400).json({ error: "Something went worng" });
      return res
        .status(200)
        .json({ success: "Successfully updated", success1: updateUser });
    } catch (err) {
      console.log(err);
    }
  }
  async AddSkill(req, res) {
    try {
      const { skill, userId, Experience } = req.body;
      if(!isValid(skill)) return res.status(400).json({error:"Please enter skill!"});
    //   if(!isValid(Experience)) return res.status(400).json({error:"Please enter experience!"})
      let obj = { skill };

      let add = await userModel.findOneAndUpdate(
        { _id: userId },
        { $push: { skillSet: obj } },
        { new: true }
      );
      if (!add)
        return res.status(400).json({ error: "Something went worng" });
      return res.status(200).json({ success: "Successfully added" });
    } catch (err) {
      console.log(err);
    }
  }

  async removeSkill(req, res) {
    try {
      let removeId = req.params.removeId;
      let userId = req.params.userId;
      let add = await userModel.findOneAndUpdate(
        { _id: userId },
        { $pull: { skillSet: { _id: removeId } } },
        { new: true }
      );
      if (!add)
        return res.status(400).json({ success: "Something went worng" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (err) {
      console.log(err);
    }
  }
  async AddEducation(req, res) {
    try {
      const { Institue, userId, field, starting, passOut, Course, Location } =
        req.body;
        if(!isValid(Institue))return res.status(400).json({error:"Please enter institute name!"})
        if(!isValid(Course)) return res.status(400).json({error:"Please enter course!"});
        if(!isValid(field)) return res.status(400).json({error:"Please enter branch!"});
        if(!isValid(starting)) return res.status(400).json({error:"Please enter starting year!"});
        if(!isValid(passOut)) return res.status(400).json({error:"Please enter passout year!"})
      let obj = { Institue, Course, Location, field, starting, passOut };

      let add = await userModel.findOneAndUpdate(
        { _id: userId },
        { $push: { education: obj } },
        { new: true }
      );
      if (!add)
        return res.status(400).json({ error: "Something went worng" });
      return res.status(200).json({ success: "Successfully added" });
    } catch (err) {
      console.log(err);
    }
  }
  async removeEducation(req, res) {
    try {
      let removeId = req.params.removeId;
      let userId = req.params.userId;
      let add = await userModel.findOneAndUpdate(
        { _id: userId },
        { $pull: { education: { _id: removeId } } },
        { new: true }
      );
      if (!add)
        return res.status(400).json({ success: "Something went worng" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (err) {
      console.log(err);
    }
  }
  async addWorkExperience(req, res) {
    try {
      const { Company, userId, Period, Skill, Experience } = req.body;
      if(!isValid(Company)) return res.status(400).json({error:"Please enter company name!"});
      if(!isValid(Skill)) return res.status(400).json({error:"Please enter your job profile!"});
      if(!isValid(Period)) return res.status(400).json({error:"Please enter enter duration!"});
       if(!isValid(Experience)) return res.status(400).json({error:"Please enter enter experience!"});
      let obj = { Company, Period, Skill, Experience };
      let add = await userModel.findOneAndUpdate(
        { _id: userId },
        { $push: { workAndExperience: obj } },
        { new: true }
      );
      if (!add)
        return res.status(400).json({ error: "Something went worng" });
      return res.status(200).json({ success: "Successfully added" });
    } catch (err) {
      console.log(err);
    }
  }
  async removeWorkExperience(req, res) {
    try {
      let removeId = req.params.removeId;
      let userId = req.params.userId;
      let add = await userModel.findOneAndUpdate(
        { _id: userId },
        { $pull: { workAndExperience: { _id: removeId } } },
        { new: true }
      );
      if (!add)
        return res.status(400).json({ success: "Something went worng" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (err) {
      console.log(err);
    }
  }

  async getAllProfile(req, res) {
    try {
      let findData = await userModel.find().sort({ _id: -1 });
      if (findData.length <= 0)
        return res.status(400).json({ success: "Data not found" });
 
      return res.status(200).json({ success: findData });
    } catch (err) {
      console.log(err);
    }
  }
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if(!isValid(email)) return res.status(400).json({error:"Please enter your email!"})
      if(!isValid(password)) return res.status(400).json({error:"Please enter your password!"})
      let hash
    
       if(!phonenumber(email)){
             hash = await userModel.findOne({ email: email ,isDelete:false});
            }else{
                  hash=  await userModel.findOne({mobile:email ,isDelete:false})
            }
        
      if (!hash)
        return res.status(400).json({ error: "Please enter register Id!" });

      let compare = await bcrypt
        .compare(password, hash.password)
        .then((res) => {
          return res;
        });

      if (!compare) {
        return res.status(400).send({ error: "Invalid password!" });
      }
      let updateData= await userModel.findOneAndUpdate({_id:hash._id},{$set:{online:"online"}},{new:true})
      return res.status(200).json({ msg: "Successfully login", success: updateData });
    } catch (err) {
      console.log(err);
    }
  }
async login1(req, res) {
    try {
      const { mobile, password } = req.body;
      if(!isValid(mobile)) return res.status(400).json({error:"Please enter your mobile number!"})
      if(!isValid(password)) return res.status(400).json({error:"Please enter your password!"})
      let hash = await userModel.findOne({
        $or: [{ mobile: mobile }, { userName: mobile }],isDelete:false
      });
      if (!hash)
        return res.status(400).json({ error: "Please enter register mobile number!" });

      let compare = await bcrypt
        .compare(password, hash.password)
        .then((res) => {
          return res;
        });

      if (!compare) {
        return res.status(400).send({ error: "Invalid password!" });
      }
      let updateData= await userModel.findOneAndUpdate({_id:hash._id},{$set:{online:"online"}},{new:true})
      return res.status(200).json({ msg: "Successfully login", success: updateData });
    } catch (err) {
      console.log(err);
    }
  }
  async deleteProfile(req, res) {
    try { 
      const {userId,reasion}=req.body
      let data = await userModel.findOneAndUpdate({ _id: userId },{$set:{reasion:reasion,isDelete:true}},{new:true});
      if (!data)
        return res.status(404).json({ success: "data not found" });
        
     await applyModel.deleteMany({userId:userId});
        await intrestedModel.deleteMany({userId:userId});
         await resumeModel.deleteOne({userId:userId});
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (err) {
      console.log(err);
    }
  }

  async deleteProfileParmanet(req, res) {
    try { 
     let userId=req.params.userId;
     let data=await userModel.deleteOne({_id:userId});
     if(data.deletedCount===0) return res.status(400).json({error:"Data not found"});
   return res.status(200).json({success:"Successfully deleted"})
    } catch (err) {
      console.log(err);
    }
  }
  async applyNow(req, res) {
    try {
      const { companyId, userId } = req.body;
      let check = await applyModel.findOne({
        companyId: companyId,
        userId: userId,
      });
      if (check) return res.status(400).json({ error: "You are already applied!" });
      await applyModel.create({ companyId, userId });

      return res.status(200).json({ success: "Successfully applied" });
    } catch (err) {
      console.log(err);
    }
  }

  async getApplyCompanyList(req, res) {
    try {
      let userId = req.params.userId;
   
      let data = await applyModel
        .find({ userId: userId })
        .sort({ _id: -1 })
        .populate("companyId");
   
      return res.status(200).json({ success: data });
    } catch (err) {
      console.log(err);
    }
  }

  async rejectApply(req, res) {
    try {
      let userId = req.params.userId;
      let data = await applyModel
        .find({ userId: userId, status: "rejected" })
        .sort({ _id: -1 })
        .populate("companyId");
      if (data.length <= 0)
        return res.status(400).json({ success: "Data not found" });
      return res.status(200).json({ success: data });
    } catch (err) {}
  }

  async getUserById(req, res) {
    try {
      let userId = req.params.userId;
      let data = await userModel.findById(userId);
      if (!data) return res.status(400).json({ success: "Data not found" });
      return res.status(200).json({ success: data });
    } catch (err) {
      console.log(err);
    }
  }

//forget password 

async postmail(req, res){
  let { email } = req.body;
  if(!isValid(email)) return res.status(400).json({error:"Please enter your email!"})
  let data = await userModel.findOne({email: email,isDelete:false});
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
      user: "amitparnets@gmail.com",
      pass: "yzbzpllsthbvrdal",
    },
    port: 465,
    host: "gsmtp.gmail.com",
  });
 
  const mailOptions = {
    from: "amitparnets@gmail.com",
    to: email ,
    subject: 'Your UNIVI INDIA new genarated password',
    html:`<h1>Hi ${data.name}</h1><p>Seems like you forgot your password for UNIVI. Your password is :</p> <b> ${newPassword}</b>
   
   
   <p> If you did not initiate this request, please contact us immediately
at ${process.env.NODE_SENDER_MAIL}</p>
"<h3>Thank you <br>UNIVI INDIA Team</h3>"`,
   
  };

 

    newPassword = bcrypt.hashSync(newPassword, 10);
    let passChange = userModel.findOneAndUpdate({email : email} , {
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

async deleteOfline(req,res){
  try {
      let employer=await userModel.find({updatedAt:{$lte:new Date(Date.now() - 24*60*60*365 * 1000)}});
      if(employer.length!==0){
         for (let index = 0; index < employer.length; index++) {
          // await employerModel.deleteOne({_id:employer[index]._id})
        await applyModel.deleteMany({userId:employer[index]._id});
          await intrestedModel.deleteMany({userId:employer[index]._id});
          await resumeModel.deleteMany({userId:employer[index]._id});
          // console.log("daleted employee name=",employer[index].name)
         }
      }
      
  } catch (error) {
      console.log(error);
  }
}
async makEverifyUnverify(req,res){
  try {
      const {userId,status,reasion,isDelete}=req.body;
      let obj={status}
      if(reasion){
          obj["reasion"]=reasion
      }
      if(isDelete){
        obj["isDelete"]=isDelete
      }
      let data=await userModel.findOneAndUpdate({_id:userId},{$set:obj},{new:true});
      if(!data) return res.status(400).json({error:"Something went wong!"});
      if(data.status=="verify"){
          send.sendMail(data.name,data.email, `Your profile is approved now you can post job,
          <h3>Thank you <br>UNIVI INDIA Team</h3>
          `);
      }else{
          send.sendMail(data.name,data.email, `Your profile is ${data.status} because ${data.reasion} please complete your profile,
          <h3>Thank you <br>UNIVI INDIA Team</h3>
          `);
      }
      return res.status(200).json({success:"success"})
  } catch (error) {
      console.log(error);
  }
}
 async makeBlockUnBlock(req,res){
        try {
            const {userId,reasion,isBlock}=req.body;
            let obj={isBlock}
                obj["reasion"]=reasion
        
            let data=await userModel.findOneAndUpdate({_id:userId},{$set:obj},{new:true});
            if(!data) return res.status(400).json({error:"Something went wong!"});
            if(data.isBlock==false){
                send.sendMail(data.name,data.email, `Your profile is un bloked now you can apply job,
                <h3>Thank you <br>UNIVI INDIA Team</h3>
                `);
            }else{
                send.sendMail(data.name,data.email, `Your profile is blocked  please contact admin,
                <h3>Thank you <br>UNIVI INDIA Team</h3>
                `);
            }
            return res.status(200).json({success:"success"})
        } catch (error) {
            console.log(error);
        }
    }

}

module.exports = new user();
