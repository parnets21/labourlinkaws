const moment = require("moment");
const jobModel = require("../../Model/Employers/company");
const applyModel = require("../../Model/Employers/apply");
const selectModel = require("../../Model/Employers/selected");
const userModel = require("../../Model/User/user");
const send = require("../../EmailSender/send");
const sent = require("../../EmailSender/send");
const {isValid,isValidEmail,phonenumber,validUrl}=require("../../Config/function")
class company {
  async register(req, res) {
    try {
      const {
           companyName,
     averageIncentive,
    openings,
    address,
    night,
    fee,
    email,
   skill,benefits,
reason,
    english,
    experience,
    interview,
    category,
    typeofqualification,
    description,
    typeofjob,
     typeofwork,
     typeofeducation,
     education,
    experiencerequired,
    gendertype,
     jobProfile,
     minSalary,
     maxSalary,
      period,
     location,
     time,
     whatsapp,
    adminId,
    employerId,
   
   
    salarytype,
   
    interviewername
       
      } = req.body;
      
      let obj = {
       companyName,
     averageIncentive,
    openings,
    address,
    night,
    fee,
    email,
  reason,
    english,
    experience,
    interview, 
    period,
    description,
    typeofjob,
     typeofwork,
     typeofeducation,
     education,
    experiencerequired,
    gendertype,
     jobProfile,
     minSalary,
     maxSalary,
    skill,benefits,
    category,
    typeofqualification,
     location,
     time,
     whatsapp,
    adminId,
    employerId,
    salarytype,
    interviewername 
      };

    //  if(!isValid(companyName)) return res.status(400).json({error:"Please enter company Name!"})
    //   if(!isValid(jobProfile)) return res.status(400).json({error:"Please enter Job Title!"})
    //   if(!isValid(typeofjob)) return res.status(400).json({error:"Please select type of job!"})
    //   if(!isValid(openings)) return res.status(400).json({error:"Please enter No of Openings!"})
    //     if(!isValid(typeofwork)) return res.status(400).json({error:"Please enter type of work!"})
    // if(!isValid(contact)) return res.status(400).json({error:"Please enter contact number!"})
    //   // if(!phonenumber(contact)) return res.status(400).json({error:"Invalid contact number!"})
    //   if(!isValid(skill)) return res.status(400).json({error:"Please enter skills!"})
    
    //  
     
    //   if(webSiteLink){
    //     if(!validUrl(webSiteLink)) return res.status(400).json({error:"Invalid website Url!"})
    //   }
    //   
    //   if(!isValid(email)) return res.status(400).json({error:"Please enter email!"})
    //   if(!isValidEmail(email)) return res.status(400).json({error:"Invalid email!"})
    //   if(!isValid(CEO)) return res.status(400).json({error:"Please enter company CEO name!"});
    //   if(!isValid(jobProfile)) return res.status(400).json({error:"Please enter Job profile!"})
    //   if(!isValid(minSalary)) return res.status(400).json({error:"Please enter minmum salary!"})
    //   if(!isValid(maxSalary)) return res.status(400).json({error:"Please enter maximum salary!"})
    //   if(!isValid(salaryType)) return res.status(400).json({error:"Please select salary type!"})
      
    
    //   if(!isValid(jobStatus)) return res.status(400).json({error:"Please select job status!"})
    //   if(!isValid(experience)) return res.status(400).json({error:"Please select experience!"})
    //   if(!isValid(position)) return res.status(400).json({error:"Please select job position!"})
    //   if(facebook){
    //     if(!validUrl(facebook)) return res.status(400).json({error:"Invalid facebook link!"})
    //   }
    //   if(instragram){
    //     if(!validUrl(instragram)) return res.status(400).json({error:"Invalid instagram link!"})
    //   }
    //   if(twiter){
    //     if(!validUrl(twiter)) return res.status(400).json({error:"Invalid twitter link!"})
    //   }
    //   if(linkedin){
    //     if(!validUrl(linkedin)) return res.status(400).json({error:"Invalid linkedin link!"})
    //   }
    //   if(!isValid(description)) return res.status(400).json({error:"Please enter discription!"});
    //   if(description.length<=90) return res.status(400).json({error:"Discription minmum 90th words!"})

      await jobModel.create(obj);
      let msg =
        "This is a new " +
        companyName +
        " company registered post by email id is " +
        email +
       
        " Job profile is " +
        jobProfile +
        " or salary " +
        minSalary +
        "-" +
        maxSalary +
        "/"
        period +
        
     
        ", location is " +
        location +
        " and website Link " +
        "."+"<h3>Thank you <br>UNIVI INDIA Team</h3>";
      sent.sendMail("Admin", "amitparnets@gmail.com", msg);
      return res.status(200).json({ success: "Successfully registered" });
    } catch (err) {
      console.log(err);
    }
  }
  async editJob(req, res) {
    try {
      const {
         companyName,
         jobId,
     averageIncentive,
    openings,
    address,
    night,
    fee,
    email,
    skill,benefits,
   reason,
    english,
    experience,
    category,
    typeofqualification,
    interview, 
    description,
    typeofjob,
     typeofwork,
     typeofeducation,
     education,
    experiencerequired,
    gendertype,
     jobProfile,
     minSalary,
     maxSalary,
     period,
    isVerify,
     location,
     time,
     whatsapp,
    adminId,
    employerId,
    salarytype,
    interviewername 
      } = req.body;
      let obj = {};
      if (companyName) {
        obj["companyName"] = companyName;
      }
      if (averageIncentive) {
        obj["averageIncentive"] = averageIncentive;
      }
     
      if (openings ) {
        obj["openings"] = openings;
      }
      if (address) {
        obj["address"] = address;
      }
      if (night) {
        obj["night"] = night;
      }
      if (email) {
        obj["email"] = email;
      }
      if (fee) {
        obj["fee"] = fee;
      }
    
      if (benefits) {
        obj["benefits"] = benefits;
      }
      if (period) {
        obj["period"] = period;
      }
      if (reason) {
        obj["reason"] = reason;
      }
      if (english) {
        obj["english"] = english;
      }
      
      if (minSalary) {
        obj["minSalary"] = minSalary;
      }
      if (interview) {
        obj["interview"] = interview;
      }
      if (description) {
        obj["description"] = description;
      }
      if (typeofjob) {
        obj["typeofjob"] = typeofjob;
      }
      if (typeofwork) {
        obj["typeofwork"] = typeofwork;
      }
      if (typeofeducation) {
        obj["typeofeducation"] = typeofeducation;
      }
      if (education) {
        obj["education"] = education;
      }
      if (experiencerequired) {
        obj["experiencerequired"] = experiencerequired;
      }
       if (category) {
        obj["category"] = category;
      }
       if (typeofqualification) {
        obj["typeofqualification"] = typeofqualification;
      }
      if (location) {
        obj["location"] = location;
      }
      if (time) {
        obj["time"] = time;
      }
      if (jobProfile) {
        obj["jobProfile"] = jobProfile;
      }
      if (experience) {
        obj["experience"] = experience;
      }
      if (interviewername) {
        obj["interviewername"] = interviewername;
      }
      if (whatsapp) {
        obj["whatsapp"] = whatsapp;
      }
      if (salarytype) {
        obj["salarytype"] = salarytype;
      }
     if (maxSalary) {
        obj["maxSalary"] = maxSalary;
      }
      if (skill) {
        obj["skill"] = skill;
      }
      
      if (description) {
        obj["description"] = description;
      }
       if (isVerify) {
        obj["isVerify"] = isVerify;
      }
      
      console.log("check It",obj,jobId)

      let updateUser = await jobModel.findOneAndUpdate(
        { _id: jobId },
        { $set:   obj},
        
        { new: true }
      );
      if (!updateUser)
        return res.status(400).json({ error: "Something went worng" });
      return res.status(200).json({ success: "Successfully updated" });
    } catch (err) {
      console.log(err);
    }
  }

   async AddSkillJ(req,res){
        try{
            const {skill,employerId}=req.body;
            let obj={skill}
        
            let add=await jobModel.findOneAndUpdate({employerId:employerId},{$push:{skillSet:obj}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully added"})
        }catch(err){
            console.log(err);
        }
    }
    async removeSkillJ(req,res){
        try{
            let removeId=req.params.removeId;
            let employerId=req.params.employerId;
            let add=await jobModel.findOneAndUpdate({employerId:employerId},{$pull:{skillSet:{_id:removeId}}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully deleted"})   ;
        }catch(err){
            console.log(err);
        }
    }
    async AddBenefits(req,res){
        try{
            const {benefits,employerId,level}=req.body;
            let obj={benefits,level}
        
            let add=await jobModel.findOneAndUpdate({employerId:employerId},{$push:{benefitsSet:obj}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully added"})
        }catch(err){
            console.log(err);
        }
    }
     async makEverifyUnverify(req,res){
        try {
            const {userId,status,reasion,isDelete}=req.body;
            let obj={status}
           
                obj["reasion"]=reasion
         
            if(isDelete){
                obj["isDelete"]=isDelete
              }
            let data=await jobModel.findOneAndUpdate({_id:userId},{$set:obj},{new:true});
            if(!data) return res.status(400).json({error:"Something went wong!"});
            if(data.status=="Approved"){
                send.sendMail(data.interviewername,data.email, `Your job is approved now,
                <h3>Thank you <br>UNIVI INDIA Team</h3>
                `);
            }else{
                send.sendMail(data.interviewername,data.email, `Your job is ${data.status} because ${data.reasion} please wait for admin approval,
                <h3>Thank you <br>UNIVI INDIA Team</h3>
                `);
            }
            return res.status(200).json({success:"success"})
        } catch (error) {
            console.log(error);
        }
    }
    async removeBenefits(req,res){
        try{
            let removeId=req.params.removeId;
            let employerId=req.params.employerId;
            let add=await jobModel.findOneAndUpdate({employerId:employerId},{$pull:{benefitsSet:{_id:removeId}}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully deleted"})   ;
        }catch(err){
            console.log(err);
        }
    }
  async getAllJobs(req, res) {
    try {
      let findData = await jobModel.find({ isVerify: true }).sort({ _id: -1 }).populate("employerId");
      if (findData.length <= 0)
        return res.status(400).json({ success: "Data not found" });
      return res.status(200).json({ success: findData });
    } catch (err) {
      console.log(err);
    }
  }
  async getUnvarifiedList(req, res) {
    try {
      let findData = await jobModel.find({ isVerify: false }).sort({ _id: -1 }).populate("employerId");
      if (findData.length <= 0)
        return res.status(400).json({ error: "Data not found" });
      return res.status(200).json({ success: findData });
    } catch (err) {
      console.log(err);
    }
  }
  async getJobByEmployerId(req,res){
    try {
      let employerId=req.params.employerId
      let data=await jobModel.find({employerId:employerId});
      return res.status(200).json({success:data});
    } catch (error) {
      console.log(error);
    }
  }
  async getJobByfilter(req, res) {
    try {
      const {
        street,
        city,
        state,
        pincode,
        companyName,
        CEO,
        jobProfile,
        skill,
        experience,
        location,
        jobStatus,
        jobType,
        category,
        subcategory,
        maxSalary,
        minSalary,
        closeDate,
      } = req.body;
      let obj = {};
      if (companyName) {
        obj["companyName"] = companyName;
      }
      if (closeDate) {
        obj["closeDate"] = closeDate;
      }
      if (jobType) {
        obj["jobType"] = jobType;
      }
      if (jobStatus) {
        obj["jobStatus"] = jobStatus;
      }
      if (subcategory) {
        obj["subcategory"] = subcategory
      }
      if (category) {
        obj["category"] = category
      }
      if (location) {
        obj["location"] = location;
      }
      if (CEO) {
        obj["CEO"] = CEO;
      }
      if (jobProfile) {
        obj["jobProfile"] = { $regex: jobProfile, $options: "i" };
      }
      if (experience) {
        obj["experience"] = experience;
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
        obj["pincode"] = pincode;
      }
      if (skill) {
        obj["skill"] = { $regex: skill, $options: "i" };
      }
      console.log("swagat nhi karoge hamara",obj)
      if (Object.keys(req.body).length <= 0) {
        let findData = await jobModel
          .find({ isVerify: true })
          .sort({ _id: -1 });
          console.log("A");
        if (findData.length <= 0)return res.status(400).json({ success: "Data not found" });
        return res.status(200).json({ success: findData });
      } else {
        if (Object.keys(obj).length <= 0) {
          let findData = await jobModel
            .find({
              isVerify: true,
            })
            .sort({ _id: -1 });
            console.log("B");
          if (findData.length <= 0)
            return res.status(400).json({ success: "Data not found" });
          return res.status(200).json({ success: findData });
        } else {
          obj["isVerify"]=true
          let findData = await jobModel
            .find(obj)
            .sort({ _id: -1 });
            console.log("C");
          if (findData.length <= 0)
            return res.status(400).json({ success: "Data not found" });
          return res.status(200).json({ success: findData });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
  async jobOftheDay(req, res) {
    try {
      // var todayStart = moment().startOf('day');
      // var todayEnd = moment().endOf('day');
      let category = req.body.category;
      let findData;
      if (category) {
        findData = await jobModel
          .find({ category: category, isVerify: true })
          .sort({ _id: -1 });
      } else {
        findData = await jobModel.find({ isVerify: true }).sort({ _id: -1 });
      }

      if (findData.length <= 0)
        return res.status(400).json({ success: "Data not found" });
      return res.status(200).json({ success: findData });
    } catch (err) {
      console.log(err);
    }
  }
   async makeBlockUnBlock(req,res){
        try {
            const {userId,reasion,isBlock}=req.body;
            let obj={isBlock}
                obj["reasion"]=reasion
        
            let data=await jobModel.findOneAndUpdate({_id:userId},{$set:obj},{new:true});
            if(!data) return res.status(400).json({error:"Something went wong!"});
            if(data.isBlock==false){
                send.sendMail(data.interviewername,data.email, `Your job is un-bloked now,
                <h3>Thank you <br>UNIVI INDIA Team</h3>
                `);
            }else{
                send.sendMail(data.interviewername,data.email, `Your job is blocked  please contact admin,
                <h3>Thank you <br>UNIVI INDIA Team</h3>
                `);
            }
            return res.status(200).json({success:"success"})
        } catch (error) {
            console.log(error);
        }
    }
  async deleteJob(req, res) {
    try {
      let jobId = req.params.jobId;
      let add = await jobModel.deleteOne({ _id: jobId });
      if (add.deletedCount <= 0)
        return res.status(400).json({ success: "Data not found" });
          await applyModel.deleteMany({companyId:jobId})
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (err) {
      console.log(err);
    }
  }
  async getJobById(req, res) {
    try {
      let jobId = req.params.jobId;
      let data = await jobModel.findById(jobId);
      if (!data) return res.status(400).json({ success: "data not found" });
      return res.status(200).json({ success: data });
    } catch (err) {
      console.log(err);
    }
  }

  async getApplyList(req, res) {
    try {
      let companyId = req.params.companyId;
      let findData = await applyModel
        .find({ companyId: companyId })
        .sort({ _id: -1 })
        .populate("userId");
      if (findData.length <= 0)
        return res.status(400).json({ success: "Data not found" });
      return res.status(200).json({ success: findData });
    } catch (err) {
      console.log(err);
    }
  }

  async addShortList(req, res) {
    try {
      const { userId, companyId } = req.body;
      let data = await applyModel
        .findOne({ userId: userId, companyId: companyId })
        .populate("userId")
        .populate("companyId");

      if (data.status == "Shortlisted") {
        return res.status(400).json({ success: "already shortlisted" });
      }

      let update = await applyModel.findOneAndUpdate(
        { userId: userId, companyId: companyId },
        { $set: { status: "Shortlisted" } },
        { new: true }
      );
      if (!update)
        return res.status(400).json({ success: "Something went worng" });
      sent.sendMail(
        data.userId.name,
        data.userId.email,
        "This " +
          data.companyId.companyName +
          " company shortlisting you position " +
          data.companyId.jobProfile +
          ", and email is " +
          data.companyId.email +
          "."+"<h3>Thank you <br>UNIVI INDIA Team</h3>"
      );
      return res.status(200).json({ success: "Successfully shortlisted" });
    } catch (err) {
      console.log(err);
    }
  }
async addSelect(req, res) {
    try {
      const { userId, companyId } = req.body;
      let data = await applyModel
        .findOne({ userId: userId, companyId: companyId })
        .populate("userId")
        .populate("companyId");

console.log("check",data)
      if (data.status == "Selected") {
        return res.status(400).json({ error: "already selected" });
      }

      let update = await applyModel.findOneAndUpdate(
        { userId: userId, companyId: companyId },
        { $set: { status: "Selected" } },
        { new: true }
      );
      if (!update)
        return res.status(400).json({ success: "Something went worng" });
      sent.sendMail(
        data.userId.name,
        data.userId.email,
        "This " +
          data.companyId.companyName +
          " company Selected you for a position " +
          data.companyId.jobProfile +
          ", and email is " +
          data.companyId.email +
          "."+"<h3>Thank you <br>UNIVI INDIA Team</h3>"
      );
      return res.status(200).json({ success: "Successfully Selected" });
    } catch (err) {
      console.log(err);
    }
  }
    async getSelectData(req, res) {
    try {
      let companyId = req.params.companyId;
      let hash = await selectModel
        .find({ companyId: companyId, state: "Selected" })
        .populate("userId");

      if (hash.length <= 0)
        return res.status(400).json({ success: "Data not found" });
      return res.status(200).json({ success: hash });
    } catch (err) {
      console.log(err);
    }
  }
  async getShortlistingData(req, res) {
    try {
      let companyId = req.params.companyId;
      let hash = await applyModel
        .find({ companyId: companyId, state: "shortlisted" })
        .populate("userId");

      if (hash.length <= 0)
        return res.status(400).json({ success: "Data not found" });
      return res.status(200).json({ success: hash });
    } catch (err) {
      console.log(err);
    }
  }

  async AllAplliedDetals(req, res) {
    try {
      let data = await applyModel
        .find()
        .sort({ _id: -1 })
        .populate("userId")
        .populate("companyId");
      return res.status(200).json({ success: data });
    } catch (error) {
      console.log(error);
    }
  }
  async rejectApply(req, res) {
    try {
      const { userId, companyId } = req.body;
      let data = await applyModel
        .findOne({ userId: userId, companyId: companyId })
        .populate("userId")
        .populate("companyId");
      if (data.status == "Rejected") {
        return res.status(400).json({ error: "already rejected" });
      }
      sent.sendMail(
        data.userId.name,
        data.userId.email,
        "This " +
          data.companyId.companyName +
          " company rejected you for position " +
          data.companyId.jobProfile +
          ", thanks for showing your interest."+"<h3>Thank you <br>UNIVI INDIA Team</h3>"
      );
      await applyModel.findOneAndUpdate({_id:data._id},{$set:{status:"Rejected"}})
      return res.status(200).json({ success: "Successfully rejected" });
    } catch (err) {
      console.log(err);
    }
  }
  async deleteApply(req,res){
    try {
      let applyId=req.params.applyId;
      let data=await applyModel.deleteOne({_id:applyId});
      if(data.deletedCount===0) return res.status(400).json({error:"Data not found"});
      return res.status(200).json({success:"Successfully deleted"})
    } catch (error) {
      console.log(error)
    }
  }
  async isVerify(req, res) {
    try {
      let data = await jobModel
        .find({ isVerify: false })
        .sort({ _id: -1 })
        .populate("employerId")
        .populate("AdminId");
      if (data.length <= 0)
        return res.status(400).json({ error: "Data not found" });
      return res.status(200).json({ success: data });
    } catch (err) {
      console.log(err);
    }
  }
  async makeVerify(req, res) {
    try {
      let companyId = req.params.companyId;
      let verify = await jobModel
        .findOne({ _id: companyId })
        .populate("employerId");
      if (verify.isVerify == true) {
        return res.status(200).json({ success: "Already approved" });
      }
      let update = await jobModel.findOneAndUpdate(
        { _id: companyId },
        { $set: { isVerify: true ,isBlock:false} },
        { new: true }
      );
      if (!update)
        return res.status(400).json({ success: "Something went worng" });
      if (verify.employerId) {
        sent.sendMail(
          verify.employerId.name,
          verify.email,
          "This " +
            verify.companyName +
            " company is successfully approved post for position " +
            verify.jobProfile +
            "<h3>Thank you <br>UNIVI INDIA Team</h3>"
        );
      }
      let user = await userModel.find({
          industry: verify.category 
      });
      let am = user.map((i) => {
        return i.email;
      });
      sent.sendMail(
        "Employees",
        am,
        "This " +
          verify.companyName +
          " company is new post for position " +
          verify.jobProfile +
          "<h3>Thank you <br>UNIVI INDIA Team</h3>"
      );
      return res.status(200).json({ success: "Successfully approved" });
    } catch (err) {
      console.log(err);
    }
  }
  async makeUnVerify(req, res) {
    try {
      let companyId = req.params.companyId;
      let verify = await jobModel
        .findOne({ _id: companyId })
        .populate("employerId");
      // if (verify.isVerify == true) {
      //   return res.status(200).json({ success: "already verifyed" });
      // }
      let update = await jobModel.findOneAndUpdate(
        { _id: companyId },
        { $set: { isVerify: false ,isBlock:true } },
        { new: true }
      );
      if (!update)
        return res.status(400).json({ success: "Something went worng" });
      if (verify.employerId) {
        sent.sendMail(
          verify.employerId.name,
          verify.email,
          "This " +
            verify.companyName +
            " company is not approved post for position " +
            verify.jobProfile +
            "<h3>Thank you <br>UNIVI INDIA Team</h3>"
        );
      }
      // let user = await userModel.find({
      //   $or: [
      //     { "interest.int": verify.category },
      //     { "interest.int1": verify.category },
      //   ],
      // });
      // let am = user.map((i) => {
      //   return i.email;
      // });
      // sent.sendMail(
      //   "....",
      //   am,
      //   "This " +
      //     verify.companyName +
      //     " company is new post for position " +
      //     verify.jobProfile +
      //     ", by team Job box."
      // );
      return res.status(200).json({ success: "Successfully block!" });
    } catch (err) {
      console.log(err);
    }
  }

  async getIntrestJob(req,res){
    try {
      let { int,int1}=req.body;
     console.log(int,int1)
      let data =await jobModel.find({$or:[{jobProfile:int},{jobProfile:int1}]})
      return res.status(200).json({success:data})
    } catch (error) {
      console.log(error);
    }
  }

}
module.exports = new company();
