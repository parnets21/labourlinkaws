const moment = require("moment");
const mongoose = require("mongoose");

const jobModel = require("../../Model/Employers/company");
const applyModel = require("../../Model/Employers/apply");
const selectModel = require("../../Model/Employers/selected");
const userModel = require("../../Model/User/user");
const send = require("../../EmailSender/send");
const sent = require("../../EmailSender/send");
const {isValid,isValidEmail,phonenumber,validUrl}=require("../../Config/function")
const CompanyType = require("../../Model/Admin/jobmanagment/CompanyType");
const Industry = require("../../Model/Admin/jobmanagment/industrymanagment");
const Department=require("../../Model/Admin/Department")
const JobRole= require("../../Model/Admin/jobmanagment/JobRole") 
const WorkMode= require("../../Model/Admin/jobmanagment/WorkMode") 
const Location= require("../../Model/Admin/comapnaylocation") 
const Salary= require("../../Model/Admin/jobmanagment/Salary") 
const Education= require("../../Model/Admin/jobmanagment/education") 
const ExperienceLevel= require("../../Model/Admin/jobmanagment/ExperienceLevel")
const Skill = require("../../Model/Admin/jobmanagment/Skill");
const { uploadFile2, deleteFile } = require("../../middileware/aws");

class company {
  
async register(req, res) {
  try {
      console.log("📢 Register API Called");
      console.log("📝 Request Body:", req.body); // Log incoming request data

      const {
          companyName, jobtitle, averageIncentive, openings, address, email, skill, benefits,
          reason, experience, interview, category, typeofqualification, description,
          typeofjob, typeofwork, typeofeducation, education, experiencerequired,
          gendertype, jobProfile, minSalary, maxSalary, period, location, time,
          whatsapp, adminId, employerId, salarytype, interviewername,
          // Added new fields below
          companywebsite, companymobile, companyindustry, companytype, department,
          companyaddress, requirements, responsibilities, workSchedule, locationDetails,
          preferredQualifications, additionalNotes
      } = req.body;
      console.log("📥 Received Request Body:", req.body);
     
      let obj = {
          companyName, jobtitle, averageIncentive, openings, address, email, reason,
          experience, interview, period, description, typeofjob, typeofwork, 
          typeofeducation, education, experiencerequired, gendertype, jobProfile, 
          minSalary, maxSalary, skill, benefits, category, typeofqualification, 
          location, time, whatsapp, adminId, employerId, salarytype, interviewername,
          // Added new fields below
          companywebsite, companymobile, companyindustry, companytype, department,
          companyaddress, requirements, responsibilities, workSchedule, locationDetails,
          preferredQualifications, additionalNotes
      };
      
      // Handle logo upload to S3
      if (req.files && req.files.length > 0) {
          const logoFile = req.files.find(file => file.fieldname === "logo");
          
          if (logoFile) {
              try {
                  // Upload logo to S3
                  const logoUrl = await uploadFile2(logoFile, "company-logos");
                  obj["logo"] = logoUrl;
              } catch (uploadError) {
                  console.error("Error uploading logo to S3:", uploadError);
                  return res.status(500).json({ 
                      success: false, 
                      message: "Failed to upload company logo", 
                      error: uploadError.message 
                  });
              }
          }
      }
      
      // Save the job in DB
      const newJob = await jobModel.create(obj);
      console.log("✅ New Job Saved:", newJob); // Log saved job details

      let msg =
          `This is a new ${companyName} company registered post by email id is ${email}
          Job profile is ${jobProfile} or salary ${minSalary}-${maxSalary}/${period},
          location is ${location} and website Link.
          <h3>Thank you <br>Labor Link Team</h3>`;

      sent.sendMail("Admin", "amitparnets@gmail.com", msg);
      console.log("📧 Email Sent Successfully");

      return res.status(200).json({ 
          success: true, 
          message: "Successfully registered",
          data: newJob
      });

  } catch (err) {
      console.error("❌ Error in Register:", err); // Log error
      return res.status(500).json({ 
          success: false, 
          message: "Internal Server Error", 
          error: err.message 
      });
  }
}



            // async register(req, res) {
            //   try {
            //       console.log("📢 Register API Called");
            //       console.log("📝 Request Body:", req.body); // Log incoming request data

            //       const {
            //           companyName, jobtitle, averageIncentive, openings, address, email, skill, benefits,
            //           reason, experience, interview, category, typeofqualification, description,
            //           typeofjob, typeofwork, typeofeducation, education, experiencerequired,
            //           gendertype, jobProfile, minSalary, maxSalary, period, location, time,
            //           whatsapp, adminId, employerId, salarytype, interviewername
            //       } = req.body;

            //       console.log("📥 Received Request Body:", req.body);
            //       console.log("📥 Received Skills:", req.body[0].skill);


            //       // Ensure skill is always an array
            //       // if (!Array.isArray(skill)) {
            //       //     if (typeof skill === "string") {
            //       //         skill = skill.split(",").map(s => s.trim()); // Convert string to array
            //       //     } else {
            //       //         skill = [];
            //       //     }
            //       // }
            //       const newSkills = req.body[0].skill

            //       console.log("🛠 Processed newSkills Data:", newSkills); // Log skills before saving

            //       let obj = {
            //           companyName, jobtitle, averageIncentive, openings, address, email, reason,
            //           experience, interview, period, description, typeofjob, typeofwork, 
            //           typeofeducation, education, experiencerequired, gendertype, jobProfile, 
            //           minSalary, maxSalary, skill : newSkills, benefits, category, typeofqualification, 
            //           location, time, whatsapp, adminId, employerId, salarytype, interviewername 
            //       };

            //       // Save the job in DB
            //       const newJob = await jobModel.create(obj);
            //       console.log("✅ New Job Saved:", newJob); // Log saved job details

            //       let msg =
            //           `This is a new ${companyName} company registered post by email id is ${email}
            //           Job profile is ${jobProfile} or salary ${minSalary}-${maxSalary}/${period},
            //           location is ${location} and website Link.
            //           <h3>Thank you <br>Labor Link Team</h3>`;

            //       sent.sendMail("Admin", "amitparnets@gmail.com", msg);
            //       console.log("📧 Email Sent Successfully");

            //       return res.status(200).json({ success: "Successfully registered" });

            //   } catch (err) {
            //       console.error("❌ Error in Register:", err); // Log error
            //       return res.status(500).json({ success: false, message: "Internal Server Error" });
            //   }
            // }


  async registeredjobbyId(req, res){
    try {
      const { jobId } = req.params;
  
      // Find job by ID and populate employer details
      const job = await jobModel.findById(jobId).populate("employer", "name email company");
  
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
  
      res.status(200).json(job);
    } catch (error) {
      res.status(500).json({ message: "Error fetching job details", error });
    }
  };

  async editJob(req, res) {
    try {
      const {
        CompanyName,
        jobId,
        averageIncentive,
        openings,
        address,
        jobtitle,
        night,
        fee,
        email,
        skill,
        benefits,
        reason,
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
      
      // Get existing job to check for logo that might need to be deleted
      const existingJob = await jobModel.findById(jobId);
      if (!existingJob) {
        return res.status(404).json({ success: false, message: "Job not found" });
      }
      
      let obj = {};
      if (CompanyName) {
        obj["companyName"] = CompanyName;
      }
      if (averageIncentive) {
        obj["averageIncentive"] = averageIncentive;
      }
     
      if (openings) {
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
      
      // Handle logo upload to S3
      if (req.files && req.files.length > 0) {
        const logoFile = req.files.find(file => file.fieldname === "logo");
        
        if (logoFile) {
          try {
            // If existing logo is an S3 URL, delete it
            if (existingJob.logo && existingJob.logo.startsWith('https://')) {
              try {
                await deleteFile(existingJob.logo);
              } catch (deleteError) {
                console.warn("Could not delete old logo:", deleteError);
                // Continue with the update even if delete fails
              }
            }
            
            // Upload new logo to S3
            const logoUrl = await uploadFile2(logoFile, "company-logos");
            obj["logo"] = logoUrl;
          } catch (uploadError) {
            console.error("Error uploading logo to S3:", uploadError);
            return res.status(500).json({ 
              success: false, 
              message: "Failed to upload company logo", 
              error: uploadError.message 
            });
          }
        }
      }
      
      console.log("check It", obj, jobId);

      let updateUser = await jobModel.findOneAndUpdate(
        { _id: jobId },
        { $set: obj },
        { new: true }
      );
      
      if (!updateUser) {
        return res.status(400).json({ success: false, message: "Update failed" });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "Successfully updated",
        data: updateUser
      });
    } catch (err) {
      console.error("Error updating job:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Internal Server Error", 
        error: err.message 
      });
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
                <h3>Thank you <br>Labor Link Team</h3>
                `);
            }else{
                send.sendMail(data.interviewername,data.email, `Your job is ${data.status} because ${data.reasion} please wait for admin approval,
                <h3>Thank you <br>Labor Link Team</h3>
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
        // Fetch all jobs (remove isVerify condition)
        let findData = await jobModel.find().sort({ _id: -1 }).populate("employerId");
        if (findData.length === 0) {
            return res.status(400).json({ success: false, message: "No jobs found" });
        }

        // console.log("findData" , findData)
        return res.status(200).json({ success: true, data: findData });
    } catch (err) {
        console.error("Error fetching jobs:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
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
        CompanyName,
        CEO,
        jobProfile,
        skill,
        experience,
        location,
        jobStatus,
        jobType,
        jobtitle,
        subcategory,
        maxSalary,
        minSalary,
        closeDate,
      } = req.body;
      let obj = {};
      if (CompanyName) {
        obj["companyName"] = CompanyName;
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
                <h3>Thank you <br>Labor Link Team</h3>
                `);
            }else{
                send.sendMail(data.interviewername,data.email, `Your job is blocked  please contact admin,
                <h3>Thank you <br>Labor Link Team</h3>
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
      console.log(jobId,"this is jobid")
      let data = await jobModel.findById(jobId);
      if (!data) return res.status(400).json({ success: "data not found" });
      return res.status(200).json({ success: data });
    } catch (err) {
      console.log(err);
    }
  }

  
  async getApplyList(req, res) {
    try {
      const{jobId}=req.params
      console.log("Received companyId:", jobId, "Type:", typeof jobId);
  
      let findData = await applyModel
          .find({ companyId: jobId }) // Ensure conversion
          .sort({ _id: -1 })
          .populate("userId");
    
      if (!findData || findData.length === 0) {
          return res.status(400).json({ success: false, message: "Data not found" });
      }
  
      return res.status(200).json({ success: true, data: findData });
  } catch (err) {
      console.error("Server Error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
  
}


async addShortList(req, res) {
  try {
    const { userId, companyId } = req.body;
    console.log("Received request with the rdfjk:", userId, companyId);

    let data = await applyModel
    .findOne({ userId: mongoose.Types.ObjectId(userId), companyId: mongoose.Types.ObjectId(companyId) })
    .populate("userId")
      .populate("companyId");
      console.log("Query result:", data);  

    // ✅ Check if data exists before accessing properties
    if (!data) {
      return res.status(404).json({ error: "Application record not found" });
    }

    if (data.status === "Shortlisted") {
      return res.status(400).json({ message: "Already shortlisted" });
    }

    let update = await applyModel.findOneAndUpdate(
      { userId: userId, companyId: companyId },
      { $set: { status: "Shortlisted" } },
      { new: true }
    );

    console.log(update, "Updated document");

    if (!update) {
      return res.status(400).json({ success: false, message: "Something went wrong" });
    }

    // ✅ Check if userId and companyId exist before sending an email
    if (data.userId && data.companyId) {
      sent.sendMail(
        data.userId.name,
        data.userId.email,
        `This ${data.companyId.CompanyName} company shortlisted you for the position ${data.companyId.jobProfile}. Email: ${data.companyId.email}.<h3>Thank you <br>Labor Link Team</h3>`
      );
    } else {
      console.log("Missing user or company data, email not sent.");
    }

    return res.status(200).json({ success: true, message: "Successfully shortlisted" });
  } catch (err) {
    console.error("Error in addShortList:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}


// async addSelect(req, res) {
//     try {
//       const { userId, companyId } = req.body;
//       let data = await applyModel
//         .findOne({ userId: userId, companyId: companyId })
//         .populate("userId")
//         .populate("companyId");

// console.log("check",data)
// // Check if data exists
//       if (!data) {
//         return res.status(404).json({ error: "No application found" });
//       }
//             if (data.status == "Selected") {
//         return res.status(400).json({ error: "already selected" });
//       }

//       try {
//         console.log("hiii")
//         let update = await applyModel.findOneAndUpdate(
//           { userId: new mongoose.Types.ObjectId(userId), companyId: new mongoose.Types.ObjectId(companyId) },
//           { $set: { status: "Selected" } },
//           { new: true }
//         );
//         console.log(update,"this is an update ")
      
//         if (!update) {
//           console.log("No matching document found");
//         } else {
//           console.log("Update successful:", update);
//         }
//       } catch (error) {
//         console.error("Error updating document:", error);
//       }
//       console.log(update,"update")
//       if (!update)
//         return res.status(400).json({ success: "Something went worng" });
//       sent.sendMail(
//         data.userId.name,
//         data.userId.email,
//         "This " +
//           data.companyId.CompanyName +
//           " company Selected you for a position " +
//           data.companyId.jobProfile +
//           ", and email is " +
//           data.companyId.email +
//           "."+"<h3>Thank you <br>Labor Link Team</h3>"
//       );
//       return res.status(200).json({ success: "Successfully Selected" });
//     } catch (err) {
//       console.log(err);
//     }
//   }


async  addSelect(req, res) {
  try {
      console.log(req.body, "this is body");

      const { userId, companyId } = req.body;
      console.log("Received request:", { userId, companyId });

      // Validate input
      if (!userId || !companyId) {
          return res.status(400).json({ error: "User ID and Company ID are required" });
      }

      // Convert to ObjectId
      let userObjectId, companyObjectId;
      try {
          userObjectId = new mongoose.Types.ObjectId(userId);
          companyObjectId = new mongoose.Types.ObjectId(companyId);
      } catch (err) {
          return res.status(400).json({ error: "Invalid ObjectId format" });
      }

      // Debug logs (optional)
      const apps = await applyModel.find({ userId: userObjectId });
      console.log("Apps with this userId:", apps);

      const apps2 = await applyModel.find({ companyId: companyObjectId });
      console.log("Apps with this companyId:", apps2);

      // Fetch the application
      let data = await applyModel
          .findOne({ userId: userObjectId, companyId: companyObjectId })
          .populate("userId")
          .populate("companyId")
          .lean();

      console.log("Fetched data:", data);

      if (!data) {
          console.log("No application found");
          return res.status(404).json({ error: "No application found" });
      }

      // Check if already selected
      console.log("Current Status:", data.status);
      if (data.status === "Selected") {
          console.log("Already selected condition met! Returning error...");
          return res.status(400).json({ error: "Already selected" });
      }

      // Update application status
      let update;
      try {
          console.log("Updating application status...");

          update = await applyModel.findOneAndUpdate(
              { userId: userObjectId, companyId: companyObjectId },
              { $set: { status: "Selected" } },
              { new: true }
          );

          if (!update) {
              console.log("No matching document found for update");
              return res.status(400).json({ error: "Something went wrong" });
          }

          console.log("Update successful:", update);
      } catch (error) {
          console.error("Error updating document:", error);
          return res.status(500).json({ error: "Database update failed" });
      }

      // Send email only if update is successful
      try {
          await sent.sendMail(
              data.userId.fullName,
              data.userId.email,
              `This ${data.companyId.companyName} company selected you for a position ${data.companyId.jobProfile}, and email is ${data.companyId.email}.
              <h3>Thank you <br>Labor Link Team</h3>`
          );
          console.log("Email sent successfully");
      } catch (emailError) {
          console.error("Error sending email:", emailError);
      }

      return res.status(200).json({ success: "Successfully Selected" });

  } catch (err) {
      console.error("Unexpected error:", err);
      return res.status(500).json({ error: "Internal server error" });
  }
}

  async getSelectData(req, res) {
    try {
        // let companyId = new mongoose.Types.ObjectId(req.params.companyId); // Convert to ObjectId
        let companyId = req.params.companyId
        console.log(companyId,"this is company id")
        const hash = await applyModel 
        .find({ companyId, status: "Selected" })  // ✅ Correct field name
        .populate("userId");
    

        console.log(hash, "this is hash");

        // if (hash.length <= 0) {
        //     return res.status(400).json({ success: false, message: "Data not found hjjhg" });
        // }
        
        return res.status(200).json({ success: true, data: hash });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


async getShortlistingData(req, res) {
  try {
      const { jobId } = req.params;  // Changed from companyId to jobId to match route
      console.log("Fetching shortlisted applications for jobId:", jobId);

      if (!mongoose.Types.ObjectId.isValid(jobId)) {
          return res.status(400).json({ 
              success: false, 
              message: "Invalid job ID format" 
          });
      }

      // Match the case from your schema enum
      const shortlistingData = await applyModel
          .find({ 
              companyId: new mongoose.Types.ObjectId(jobId), 
              status: "Shortlisted",  // Matches the enum case in schema
              isDelete: false  // Add this to exclude deleted applications
          })
          .populate("userId")
          .sort({ appliedOn: -1 });  // Optional: sort by latest first

      if (!shortlistingData || shortlistingData.length === 0) {
          return res.status(200).json({ 
              success: true, 
              data: [],
              message: "No shortlisted applications found" 
          });
      }

      return res.status(200).json({ 
          success: true, 
          data: shortlistingData 
      });

  } catch (err) {
      console.error("Error in getShortlistingData:", err);
      return res.status(500).json({ 
          success: false, 
          message: "Internal Server Error",
          error: err.message 
      });
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
      console.log(companyId,"lililili")
      let data = await applyModel
        .findOne({ userId: userId, companyId: companyId })
        .populate("userId")
        .populate("companyId");
      // if (data.status == "Rejected") {
      //   return res.status(400).json({ error: "already rejected" });
      // }
      sent.sendMail(
        data.userId.name,
        data.userId.email,
        "This " +
          data.companyId.CompanyName +
          " company rejected you for position " +
          data.companyId.jobProfile +
          ", thanks for showing your interest."+"<h3>Thank you <br>Labor Link Team</h3>"
      );
      await applyModel.findOneAndUpdate({_id:data._id},{$set:{status:"Rejected"}})
      return res.status(200).json({ success: "Successfully rejected" });
    } catch (err) {
      console.log(err);
    }
  }


  async getRejectedApplications(req, res) {
    try {
        const { companyId } = req.params; // Get companyId from URL params
        console.log("Received companyId:", companyId); // Debugging

        // Check if companyId is provided
        if (!companyId) {
            return res.status(400).json({ error: "companyId is required" });
        }

        // Validate companyId format
        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: "Invalid companyId format" });
        }

        // Find all rejected applications for the given company
        let rejectedApplications = await applyModel
            .find({ companyId: companyId, status: "Rejected" })
            .populate("userId") // Populate user details
            .populate("companyId"); // Populate company details
        if (!rejectedApplications || rejectedApplications.length === 0) {
          console.log("rejectedApplications.length : " , rejectedApplications.length)
            return res.status(404).json({ error: "No rejected applications found" });
        }

        return res.status(200).json({ success: true, data: rejectedApplications });
    } catch (err) {
        console.error("Error in getRejectedApplications:", err);
        return res.status(500).json({ error: "Internal server error" });
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
            verify.CompanyName +
            " company is successfully approved post for position " +
            verify.jobProfile +
            "<h3>Thank you <br>Labor Link Team</h3>"
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
          verify.CompanyName +
          " company is new post for position " +
          verify.jobProfile +
          "<h3>Thank you <br>Labor Link Team</h3>"
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
            verify.CompanyName +
            " company is not approved post for position " +
            verify.jobProfile +
            "<h3>Thank you <br>Labor Link Team</h3>"
        );
      }
      return res.status(200).json({ success: "Successfully block!" });
    } catch (err) {
      console.log(err);
    }
  }

  async getPopularJobs(req, res) {
    try {
      const jobs = await jobModel.aggregate([
        { $match: { isDelete: false, isVerify: true, isBlock: false } },
        { 
          $lookup: { 
            from: "applies", localField: "_id", foreignField: "companyId", as: "applications" 
          } 
        },
        { $addFields: { applicationCount: { $size: "$applications" } } },
        { $sort: { applicationCount: -1 } },
        { $limit: 10 },
        { 
          $lookup: { 
            from: "employers", localField: "employerId", foreignField: "_id", as: "employer" 
          } 
        },
        { $unwind: "$employer" },
        {
          $project: {
            _id: 1,
            jobtitle: "$title", // Ensure job title is included
            location: 1,
            minSalary: 1, // Ensure min salary is included
            maxSalary: 1, // Ensure max salary is included
            typeofwork: "$type", // Ensure job type is included
            applicationCount: 1,
            employer: 1,
            "companyName": "$employer.companyName", // Ensure company name is included
          }
        }
        
      ]);
  
      return res.status(200).json(jobs.length ? { success: true, data: jobs } : { error: "No jobs found" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
  
  async getSuggestedJobs(req, res) {
    console.log("Getting Suggested Jobs...");
    try {
      const { userId } = req.params;
      console.log(userId,"jajs")
  
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
     
  
      // Fetch user with skills
      const user = await userModel.findById(userId)
      // console.log(user,"User from DB:")
      if (!user) return res.status(404).json({ message: "User not found" });
      console.log(user,"yusdna")
      if (!user.skills || user.skills.length === 0) {
        return res.status(400).json({ message: "User has no skills listed" });
      }
  
      // Extract skill names (since skills are stored as an array of strings)
      const userSkills = user.skills; // No need for `.map(s => s.skill)`
  
      // Fetch jobs matching skills and sort by highest salary
      const jobs = await jobModel
        .find({ skill: { $in: userSkills } }) // Match jobs where any skill matches
        .sort({ "preferredSalary.min": -1 }) // Sort by highest min salary
        .limit(10);
  
      if (jobs.length === 0) {
        return res.status(404).json({ message: "No matching jobs found" });
      }
  
      return res.status(200).json({ getSuggestedJobs: jobs });
    } catch (error) {
      console.error("Error in getSuggestedJobs:", error);
      return res.status(500).json({ message: "Server error", details: error.message });
    }
  }
  
      async getRecommendedJobs(req, res) {
        try {
            const { userId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user ID format" });
            }

            // Fetch user
            const user = await userModel.findById(userId);
            if (!user) return res.status(404).json({ message: "User not found" });
            console.log("User : " , user)
            if (!user.skills || user.skills.length === 0) {
                return res.status(400).json({ message: "User has no skills listed" });
            }

            // Extract skill names from objects
            const userSkills = user.skills.map(s => s.skill);

          

            // Fetch jobs matching user skills
            const jobs = await jobModel.find({
                skills: { $in: userSkills } // Query jobs where at least one skill matches
            });

       

            return res.json({ recommendedJobs: jobs });
        } catch (error) {
            console.error("Error in getRecommendedJobs:", error);
            return res.status(500).json({ error: "Something went wrong", details: error.message });
        }
       }
      async getHighestPayingJob (req, res){
        try {
          // Find the highest-paying job (no filtering by role)
          const highestPayingJob = await jobModel.find().sort({ salary: -1 }).limit(15);;

          if (!highestPayingJob) {
            return res.status(404).json({ message: "No jobs found" });
          }

          res.status(200).json(highestPayingJob);
        } catch (error) {
          console.error("Error in getHighestPayingJob:", error);
          res.status(500).json({ message: "Server error", details: error.message });
        }
      };
      
      // Function to extract job roles from user experiences
      async searchJobsByUserRole(req, res) {
        try {
          const { userId } = req.params;
          console.log("Received userId:", userId);
      
          // Validate userId format before conversion
          if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId format" });
          }
      
          const objectId = new mongoose.Types.ObjectId(userId);
      
          // Find user and their role
          const user = await userModel.findById(objectId);
          console.log("User found:", user);
      
          if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
          }
      
          // Extract user's role
          const userRole = user.role;
          console.log("User Role:", userRole);
      
          // Find jobs matching the user's role
          const jobs = await jobModel.find({ role: userRole });
          console.log("Jobs found:", jobs);
      
          if (!jobs.length) {
            return res.status(404).json({ success: false, message: "No jobs found for this role" });
          }
      
          // Return jobs data
          res.json({ success: true, data: jobs });
      
        } catch (error) {
          console.error("Error searching jobs:", error);
          res.status(500).json({ success: false, message: "Internal Server Error" });
        }
      }
      
      

      // POST Controllers


      async addCompanyType(req, res) {
        try {
            const { type } = req.body;
            if (!type) {
                return res.status(400).json({ error: "Company type is required" });
            }
    
            // Check if a deleted type already exists
            let existingType = await CompanyType.findOne({ type }).lean();
    
            if (existingType) {
                // If the type exists but was previously deleted, just reactivate it
                const updatedType = await CompanyType.findOneAndUpdate(
                    { type },
                    { action: true, updatedAt: new Date() }, // Reactivating and updating timestamp
                    { new: true }
                );
                return res.status(200).json({ success: true, data: updatedType });
            }
    
            // Fetch last typeId and generate a new one
            const lastRecord = await CompanyType.findOne().sort({ typeId: -1 }).lean();
            let newIdNumber = 1;
            if (lastRecord?.typeId) {
                const match = lastRecord.typeId.match(/\d+/);
                newIdNumber = match ? parseInt(match[0], 10) + 1 : 1;
            }
            const newTypeId = `CT${String(newIdNumber).padStart(3, "0")}`;
    
            // Create new company type
            const newCompanyType = await CompanyType.create({
                type,
                typeId: newTypeId, 
                action: true,
            });
    
            return res.status(201).json({
                success: true,
                data: newCompanyType
            });
        } catch (error) {
            console.error("Error adding company type:", error);
            return res.status(500).json({
                error: "Internal server error",
                details: error.message
            });
        }
    }
    

    

      // async addIndustry(req, res) {
      //   try {
      //     const { industryName } = req.body;
      //     if (!industryName) {
      //       return res.status(400).json({ error: "Industry name is required" });
      //     }

      //     const newIndustry = await Industry.create({ 
      //       industryName, 
      //       action: true 
      //     });

      //     return res.status(201).json({
      //       success: true,
      //       data: newIndustry
      //     });
      //   } catch (error) {
      //     console.error("Error adding industry:", error);
      //     return res.status(500).json({ error: "Internal server error" });
      //   }
      // }
      
      async addIndustry (req, res){
        try {
          const { id, industryName } = req.body;
      
          if (!industryName) {
            return res.status(400).json({ error: "Industry name is required" });
          }
      
          if (id) {
            // Update existing industry
            if (!mongoose.Types.ObjectId.isValid(id)) {
              return res.status(400).json({
                error: "Invalid industry ID format",
                details: "The provided ID is not a valid MongoDB ObjectId"
              });
            }
      
            // Check if the new industry name already exists (excluding the current record)
            const existingIndustry = await Industry.findOne({
              industryName: industryName,
              _id: { $ne: id }
            });
      
            if (existingIndustry) {
              return res.status(400).json({ error: "Industry name already exists" });
            }
      
            const updatedIndustry = await Industry.findByIdAndUpdate(
              id,
              {
                industryName,
                updatedAt: new Date()
              },
              {
                new: true,
                runValidators: true
              }
            );
      
            if (!updatedIndustry) {
              return res.status(404).json({ error: "Industry not found" });
            }
      
            return res.status(200).json({
              success: true,
              data: updatedIndustry
            });
          } else {
            // Add new industry
            const newIndustry = new Industry({ industryName });
            await newIndustry.save();
            return res.status(201).json({
              success: true,
              data: newIndustry
            });
          }
        } catch (error) {
          console.error("Error saving industry:", error);
          return res.status(500).json({
            error: "Internal server error",
            details: error.message
          });
        }
      };


      async addDepartment(req, res) {
        try {
            const { departmentName } = req.body;
            if (!departmentName) {
                return res.status(400).json({ error: "Department name is required" });
            }
    
            // Check if department already exists
            const existingDepartment = await Department.findOne({ departmentName });
            if (existingDepartment) {
                return res.status(400).json({ error: "Department already exists" });
            }
    
            // Fetch last departmentId and generate a new one
            const lastRecord = await Department.findOne().sort({ departmentId: -1 }).lean();
            let newIdNumber = 1;
            if (lastRecord?.departmentId) {
                const match = lastRecord.departmentId.match(/\d+/); // Extract numeric part
                newIdNumber = match ? parseInt(match[0], 10) + 1 : 1;
            }
            const newDepartmentId = `D${String(newIdNumber).padStart(3, "0")}`;
    
            // Create new department
            const newDepartment = await Department.create({
                departmentName,
                departmentId: newDepartmentId,  // ✅ Explicitly set departmentId
                action: true,
            });
    
            return res.status(201).json({
                success: true,
                data: newDepartment
            });
        } catch (error) {
            console.error("Error adding department:", error);
            return res.status(500).json({
                error: "Internal server error",
                details: error.message
            });
        }
    }
    

      async addJobRole(req, res) {
        try {
          const { jobRole } = req.body;
          if (!jobRole) {
            return res.status(400).json({ error: "Job role is required" });
          }

          const newJobRole = await JobRole.create({ 
            jobRole, 
            action: true 
          });

          return res.status(201).json({
            success: true,
            data: newJobRole
          });
        } catch (error) {
          console.error("Error adding job role:", error);
          return res.status(500).json({ error: "Internal server error" });
        }
      }

      async  addJobRole (req, res)  {
        try {
          const { id, jobRole } = req.body;
      
          if (!jobRole) {
            return res.status(400).json({ error: 'Job role is required' });
          }
      
          if (id) {
            // Update existing job role
            const updatedRole = await JobRole.findByIdAndUpdate(
              id,
              { jobRole },
              { new: true }
            );
            if (!updatedRole) {
              return res.status(404).json({ error: 'Job role not found' });
            }
            return res.status(200).json({ success: true, data: updatedRole });
          } else {
            // Add new job role
            const newRole = new JobRole({ jobRole });
            await newRole.save();
            return res.status(201).json({ success: true, data: newRole });
          }
        } catch (error) {
          console.error('Error saving job role:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
      };

      async addWorkMode(req, res) {
        try {
            const { workMode } = req.body;
            if (!workMode) {
                return res.status(400).json({ error: "Work mode is required" });
            }
    
            // Check if a deleted work mode already exists
            let existingMode = await WorkMode.findOne({ workMode }).lean();
    
            if (existingMode) {
                // If the work mode exists but was previously deleted, reactivate it
                const updatedMode = await WorkMode.findOneAndUpdate(
                    { workMode },
                    { action: true, updatedAt: new Date() }, // Reactivate it
                    { new: true }
                );
                return res.status(200).json({ success: true, data: updatedMode });
            }
    
            // Create new work mode if it does not exist
            const newWorkMode = await WorkMode.create({ 
                workMode, 
                action: true 
            });
    
            return res.status(201).json({
                success: true,
                data: newWorkMode
            });
        } catch (error) {
            console.error("Error adding work mode:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
    

      async addEducation(req, res) {
        const education = new Education({
          qualification: req.body.qualification,
        });
      
        try {
          const newEducation = await education.save();
          res.status(201).json(newEducation);
        } catch (error) {
          res.status(400).json({ message: error.message });
        }
      }

      async addSkill(req, res) {
        try {
          console.log("Received body:", req.body); // Debugging step ✅
          
          const { skillName } = req.body;
      
          if (!skillName) {
            return res.status(400).json({ error: "Skill name is required" });
          }
      
          // ✅ Check if skill already exists
          const existingSkill = await Skill.findOne({ skillName: { $regex: new RegExp(`^${skillName}$`, "i") } });
          if (existingSkill) {
            return res.status(400).json({ error: "Skill already exists" });
          }
      
          // ✅ Fetch last skillId correctly
          const lastRecord = await Skill.find().sort({ createdAt: -1 }).limit(1).lean();
          let newIdNumber = 1;
          if (lastRecord.length > 0 && lastRecord[0].skillId) {
            const match = lastRecord[0].skillId.match(/\d+/);
            newIdNumber = match ? parseInt(match[0], 10) + 1 : 1;
          }
          const newSkillId = `SK${String(newIdNumber).padStart(3, "0")}`;
      
          // ✅ Create new skill
          const newSkill = await Skill.create({
            skillName,
            skillId: newSkillId,
            action: true,
          });
      
          return res.status(201).json({
            success: true,
            data: newSkill,
          });
        } catch (error) {
          console.error("Error adding skill:", error);
          return res.status(500).json({
            error: "Internal server error",
            details: error.message,
          });
        }
      }
      
    


      // GET Controllers
      async getCompanyTypes(req, res) {
        try {
            const companyTypes = await CompanyType.find({ action: true })
                .select('_id type typeId')  // ✅ Add typeId
                .sort({ type: 1 });
    
            return res.status(200).json({
                success: true,
                count: companyTypes.length,
                data: companyTypes
            });
        } catch (error) {
            console.error("Error fetching company types:", error);
            return res.status(500).json({
                error: "Internal server error",
                details: error.message
            });
        }
    }
    

      // async getIndustries(req, res) {
      //   try {
      //     const industries = await Industry.find({ action: true })
      //       .select('industryName -_id')
      //       .sort({ industryName: 1 });
          
      //     return res.status(200).json({
      //       success: true,
      //       data: industries.map(ind => ind.industryName)
      //     });
      //   } catch (error) {
      //     console.error("Error fetching industries:", error);
      //     return res.status(500).json({ error: "Internal server error" });
      //   }
      // }
      async getIndustries  (req, res)  {
        try {
          const industries = await Industry.find({}); // Fetch all industries from the database
          res.status(200).json({
            success: true,
            data: industries, // Ensure the data is returned in the correct format
          });
        } catch (error) {
          console.error("Error fetching industries:", error);
          res.status(500).json({
            error: "Internal server error",
            details: error.message,
          });
        }
      };

      async getDepartments(req, res) {
        try {
            const departments = await Department.find({ action: true })
                .select('_id departmentName departmentId')  // ✅ Include departmentId
                .sort({ departmentName: 1 });
    
            return res.status(200).json({
                success: true,
                count: departments.length,  // ✅ Add count like getCompanyTypes
                data: departments
            });
        } catch (error) {
            console.error("Error fetching departments:", error);
            return res.status(500).json({
                error: "Internal server error",
                details: error.message
            });
        }
    }
    

    async getJobRoles  (req, res)  {
      try {
        const roles = await JobRole.find({});
        console.log(roles,"sdsd")
        return res.status(200).json({ success: true, data: roles });
      } catch (error) {
        console.error('Error fetching job roles:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };

    async getWorkModes(req, res) {
      try {
          const workModes = await WorkMode.find({ action: true })
              .select('_id workMode') // Include _id and workMode
              .sort({ workMode: 1 });
  
          return res.status(200).json({
              success: true,
              count: workModes.length, // Add count
              data: workModes, // Return full objects
          });
      } catch (error) {
          console.error("Error fetching work modes:", error);
          return res.status(500).json({ error: "Internal server error" });
      }
  }
  

      async getEducations(req, res) {
        try {
          const educations = await Education.find();
          res.json(educations);
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      };
      

      async getSkills(req, res) {
        try {
          const skills = await Skill.find({ action: true })
            .select('_id skillName') // Select only necessary fields
            .sort({ skillName: 1 }); // Sort by skillName
      
          return res.status(200).json({
            success: true,
            count: skills.length,
            data: skills
          });
        } catch (error) {
          console.error("Error fetching skills:", error);
          return res.status(500).json({
            error: "Internal server error",
            details: error.message
          });
        }
      }


      // Edit functions
      async editCompanyType(req, res) {
        try {
          const { id } = req.params;
          const { type, action } = req.body;

          // Validate ObjectId
          if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
              error: "Invalid ID format",
              details: "The provided ID is not a valid MongoDB ObjectId"
            });
          }

          if (!type) {
            return res.status(400).json({ error: "Company type is required" });
          }

          // Check if new type already exists (excluding current record)
          const existingType = await CompanyType.findOne({ 
            type: type, 
            _id: { $ne: id } 
          });
          
          if (existingType) {
            return res.status(400).json({ error: "Company type already exists" });
          }

          const updatedType = await CompanyType.findByIdAndUpdate(
            id,
            { 
              type, 
              action: action !== undefined ? action : true,
              updatedAt: new Date()
            },
            { 
              new: true,
              runValidators: true 
            }
          );

          if (!updatedType) {
            return res.status(404).json({ error: "Company type not found" });
          }

          return res.status(200).json({
            success: true,
            data: updatedType
          });
        } catch (error) {
          console.error("Error updating company type:", error);
          return res.status(500).json({ 
            error: "Internal server error",
            details: error.message 
          });
        }
      }

      async editIndustry  (req, res) {
        try {
          const { id } = req.params;
          const { industryName } = req.body;
      
          // Validate ObjectId
          if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
              error: "Invalid industry ID format",
              details: "The provided ID is not a valid MongoDB ObjectId"
            });
          }
      
          if (!industryName) {
            return res.status(400).json({ error: "Industry name is required" });
          }
      
          // Check if the new industry name already exists (excluding the current record)
          const existingIndustry = await Industry.findOne({
            industryName: industryName,
            _id: { $ne: id }
          });
      
          if (existingIndustry) {
            return res.status(400).json({ error: "Industry name already exists" });
          }
      
          const updatedIndustry = await Industry.findByIdAndUpdate(
            id,
            {
              industryName,
              updatedAt: new Date()
            },
            {
              new: true,
              runValidators: true
            }
          );
      
          if (!updatedIndustry) {
            return res.status(404).json({ error: "Industry not found" });
          }
      
          return res.status(200).json({
            success: true,
            data: updatedIndustry
          });
        } catch (error) {
          console.error("Error updating industry:", error);
          return res.status(500).json({
            error: "Internal server error",
            details: error.message
          });
        }
      };
      

      async editDepartment(req, res) {
        try {
            const { id } = req.params;
            const { departmentName, action } = req.body;
    
            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: "Invalid department ID format",
                    details: "The provided ID is not a valid MongoDB ObjectId"
                });
            }
    
            if (!departmentName) {
                return res.status(400).json({ error: "Department name is required" });
            }
    
            // Check if the new department name already exists (excluding the current record)
            const existingDepartment = await Department.findOne({
                departmentName: departmentName,
                _id: { $ne: id }
            });
    
            if (existingDepartment) {
                return res.status(400).json({ error: "Department name already exists" });
            }
    
            const updatedDepartment = await Department.findByIdAndUpdate(
                id,
                {
                    departmentName,
                    action: action !== undefined ? action : true,
                    updatedAt: new Date()
                },
                {
                    new: true,
                    runValidators: true
                }
            );
    
            if (!updatedDepartment) {
                return res.status(404).json({ error: "Department not found" });
            }
    
            return res.status(200).json({
                success: true,
                data: updatedDepartment
            });
        } catch (error) {
            console.error("Error updating department:", error);
            return res.status(500).json({
                error: "Internal server error",
                details: error.message
            });
        }
    }
    

      async editJobRole(req, res) {
        try {
          const { id } = req.params;
          const { jobRole, action } = req.body;

          if (!jobRole) {
            return res.status(400).json({ error: "Job role is required" });
          }

          const updatedJobRole = await JobRole.findByIdAndUpdate(
            id,
            { jobRole, action },
            { new: true }
          );

          if (!updatedJobRole) {
            return res.status(404).json({ error: "Job role not found" });
          }

          return res.status(200).json({
            success: true,
            data: updatedJobRole
          });
        } catch (error) {
          console.error("Error updating job role:", error);
          return res.status(500).json({ error: "Internal server error" });
        }
      }

      async editWorkMode(req, res) {
        try {
          const { id } = req.params;
          const { workMode, action } = req.body;

          if (!workMode) {
            return res.status(400).json({ error: "Work mode is required" });
          }

          const updatedWorkMode = await WorkMode.findByIdAndUpdate(
            id,
            { workMode, action },
            { new: true }
          );

          if (!updatedWorkMode) {
            return res.status(404).json({ error: "Work mode not found" });
          }

          return res.status(200).json({
            success: true,
            data: updatedWorkMode
          });
        } catch (error) {
          console.error("Error updating work mode:", error);
          return res.status(500).json({ error: "Internal server error" });
        }
      }

      async editEducation(req, res) {
        try {
          const education = await Education.findByIdAndUpdate(req.params.id, req.body, { new: true });
          res.json(education);
        } catch (error) {
          res.status(400).json({ message: error.message });
        }
      };
      
      async editSkill(req, res) {
        try {
            const { id } = req.params;
            const { skillName, action } = req.body;
    
            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: "Invalid skill ID format",
                    details: "The provided ID is not a valid MongoDB ObjectId"
                });
            }
    
            if (!skillName) {
                return res.status(400).json({ error: "Skill name is required" });
            }
    
            // Check if skill name already exists (excluding the current record)
            const existingSkill = await Skill.findOne({
                skillName,
                _id: { $ne: id }
            });
    
            if (existingSkill) {
                return res.status(400).json({ error: "Skill name already exists" });
            }
    
            const updatedSkill = await Skill.findByIdAndUpdate(
                id,
                {
                    skillName,
                    action: action !== undefined ? action : true,
                    updatedAt: new Date()
                },
                {
                    new: true,
                    runValidators: true
                }
            );
    
            if (!updatedSkill) {
                return res.status(404).json({ error: "Skill not found" });
            }
    
            return res.status(200).json({
                success: true,
                data: updatedSkill
            });
        } catch (error) {
            console.error("Error updating skill:", error);
            return res.status(500).json({
                error: "Internal server error",
                details: error.message
            });
        }
    }
    
      // Delete functions
      async deleteCompanyType(req, res) {
        try {
          const { id } = req.params;

          // Validate ObjectId
          if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
              error: "Invalid ID format",
              details: "The provided ID is not a valid MongoDB ObjectId"
            });
          }

          const deletedType = await CompanyType.findById(id);
          
          if (!deletedType) {
            return res.status(404).json({ error: "Company type not found" });
          }

          // Check if this company type is being used anywhere
          // Add your business logic here to check references

          await CompanyType.findByIdAndDelete(id);

          return res.status(200).json({
            success: true,
            message: "Company type deleted successfully",
            data: deletedType
          });
        } catch (error) {
          console.error("Error deleting company type:", error);
          return res.status(500).json({ 
            error: "Internal server error",
            details: error.message 
          });
        }
      }

      async deleteIndustry(req, res) {
        try {
          const { id } = req.params;
          const deletedIndustry = await Industry.findByIdAndDelete(id);

          if (!deletedIndustry) {
            return res.status(404).json({ error: "Industry not found" });
          }

          return res.status(200).json({
            success: true,
            message: "Industry deleted successfully"
          });
        } catch (error) {
          console.error("Error deleting industry:", error);
          return res.status(500).json({ error: "Internal server error" });
        }
      }

      async deleteDepartment(req, res) {
          try {
              const { id } = req.params;
      
              // Validate if the id is a valid ObjectId
              if (!mongoose.Types.ObjectId.isValid(id)) {
                  return res.status(400).json({ error: "Invalid department ID" });
              }
      
              const deletedDepartment = await Department.findByIdAndDelete(id);
      
              if (!deletedDepartment) {
                  return res.status(404).json({ error: "Department not found" });
              }
      
              return res.status(200).json({
                  success: true,
                  message: "Department deleted successfully"
              });
          } catch (error) {
              console.error("Error deleting department:", error);
              return res.status(500).json({ error: "Internal server error" });
          }
      }
      
      async deleteJobRole  (req, res) {
        try {
          const { id } = req.params;
          const deletedRole = await JobRole.findByIdAndDelete(id);
          if (!deletedRole) {
            return res.status(404).json({ error: 'Job role not found' });
          }
          return res.status(200).json({ success: true, data: deletedRole });
        } catch (error) {
          console.error('Error deleting job role:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
      };

      async deleteWorkMode(req, res) {
        try {
            const { id } = req.params;  // Capture _id from URL
            console.log("Received delete request for _id:", id);
    
            // Find and delete using _id
            const deletedWorkMode = await WorkMode.findByIdAndDelete(id);
    
            // if (!deletedWorkMode) {
            //     return res.status(404).json({ error: "Work mode not found" });
            // }
    
            return res.status(200).json({
                success: true,
                message: "Work mode deleted successfully",
                deletedWorkMode // Optionally return the deleted item
            });
        } catch (error) {
            console.error("Error deleting work mode:", error);
            // Check if error is due to invalid ObjectId
            if (error.name === 'CastError') {
                return res.status(400).json({ error: "Invalid work mode ID format" });
            }
            return res.status(500).json({ error: "Internal server error" });
        }
    }
    
    

      async deleteEducation(req, res) {
        try {
          await Education.findByIdAndDelete(req.params.id);
          res.json({ message: 'Education deleted successfully' });
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      }

      async deleteSkill(req, res) {
        try {
            const { id } = req.params;
    
            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: "Invalid skill ID format",
                    details: "The provided ID is not a valid MongoDB ObjectId"
                });
            }
    
            const deletedSkill = await Skill.findByIdAndDelete(id);
    
            if (!deletedSkill) {
                return res.status(404).json({ error: "Skill not found" });
            }
    
            return res.status(200).json({
                success: true,
                message: "Skill deleted successfully"
            });
        } catch (error) {
            console.error("Error deleting skill:", error);
            return res.status(500).json({
                error: "Internal server error",
                details: error.message
            });
        }
    }
    

    }



module.exports = new company();
