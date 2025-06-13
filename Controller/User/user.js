const applyModel = require("../../Model/Employers/apply");
const userModel = require("../../Model/User/user");
const bcrypt = require("bcryptjs");
const send = require("../../EmailSender/send");
const intrestedModel=require("../../Model/Employers/intrested");
const nodemailer=require('nodemailer')
const saltRounds = 10;
const {isValid, isValidEmail, phonenumber, isValidString}=require("../../Config/function")
const resumeModel=require("../../Model/User/resume");
const Interview=require("../../Model/User/interviewscedule")
const MatchingProfile=require("../../Model/User/matchingprofile")
const mongoose = require('mongoose');
const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const { uploadFile2, deleteFile } = require("../../middileware/aws");

class user {
    async register(req, res) {
      try {
        const {
          profile,
          fullName,
          email,
          phone,
          location,
          password,
          confirmPassword,
          experience,
          workExperience,
          jobType,
          resume,
          address,
          education,
          bio,
          country,
          street,
          city,
          state,
          pincode,
          skills,
          jobRole,
          companyType,
          department,
          workMode,
          preferredSalary
        } = req.body;
  
        console.log("Incoming request body:", req.body);
        // ✅ Check if user already exists
        let userExists = await userModel.findOne({ email, isDelete: false });
        if (userExists) return res.status(400).json({ error: "Email already exists!" });
  
        // Parse education if it's a string
        // let parsedEducation = education;
        // if (typeof education === 'string') {
        //   parsedEducation = JSON.parse(education);
        // }
  
  
        userExists = await userModel.findOne({ phone, isDelete: false });
        if (userExists) return res.status(400).json({ error: "Phone number already exists!" });
  
        // ✅ Encrypt password
        const encryptedPassword = await bcrypt.hash(password, 10);
        // Create user object
        const userData = {
          profile,
          fullName,
          email,
          phone,
          location,
          password: encryptedPassword,
          confirmPassword: encryptedPassword,
          workExperience: experience ? true : false,
          experiences: experience,
          jobRole,
          companyType,
          department,
          workMode,
          jobType,
          resume,
          address,
          education,
          bio,
          country,
          street,
          city,
          state,
          pincode,
          skills ,
          preferredSalary: preferredSalary || { min: 0, max: 0 },
          appliedOn: new Date(),
          online: "Offline",
          isBlock: false,
          isDelete: false
        };
        // Create new user
        const newUser = await userModel.create(userData);
        console.log("User created successfully:", newUser._id);
        console.log("User created successfully yuppp:", userData);

  
        // Send welcome email
        await send.sendMail(fullName, email, `Welcome to Labor Link!<h3>Thank you!<br>Labor Link Team</h3>`);
  
        return res.status(200).json({ 
          success: "Successfully registered!",
          userId: newUser._id ,
          newUser
        });
  
      } catch (err) {
        console.error("Error in register function:", err);
        if (err.name === 'ValidationError') {
          return res.status(400).json({ 
            error: "Validation error", 
            details: Object.values(err.errors).map(e => e.message)
          });
        }
        return res.status(500).json({ error: "Internal server error!" });
      }
    }

    async  editUser(req, res) {
        try {
            const { id } = req.params; // Get user ID from params
            const {
                fullName,
                email,
                phone,
                location,
                experience,
                jobType,
                address,
                education,
                bio,
                country,
                street,
                city,
                state,
                pincode,
                skills,
                jobRole,
                companyType,
                department,
                workMode,
                preferredSalary
            } = req.body;
    
            console.log("Incoming request body:", req.body);
    
            // ✅ Check if user exists
            let user = await userModel.findOne({ _id: id, isDelete: false });
            if (!user) return res.status(404).json({ error: "User not found!" });
    
            // ✅ Check if email or phone is already used by another user
            // let existingUser = await userModel.findOne({ email, _id: { $ne: id }, isDelete: false });
            // if (existingUser) return res.status(400).json({ error: "Email already exists!" });
    
            // existingUser = await userModel.findOne({ phone, _id: { $ne: id }, isDelete: false });
            // if (existingUser) return res.status(400).json({ error: "Phone number already exists!" });
    
            // Parse education & skills if they are strings (from Postman input)
            console.log("education",typeof education,education);
            
            // let parsedEducation = typeof education === 'string' ? JSON.parse(education) : education;
         
       
            // ✅ Update user details (without password)
            user.fullName = fullName || user.fullName;
            // user.email = email || user.email;
            // user.phone = phone || user.phone;
            // user.location = location || user.location;
            // user.workExperience = experience ? true : false;
            // user.experiences = experience || user.experiences;
            // user.jobRole = jobRole || user.jobRole;
            // user.companyType = companyType || user.companyType;
            // user.department = department || user.department;
            // user.workMode = workMode || user.workMode;
            // user.jobType = jobType || user.jobType;
            // user.address = address || user.address;
            // user.education = parsedEducation || user.education;
            user.bio = bio || user.bio;
            // user.country = country || user.country;
            // user.street = street || user.street;
            // user.city = city || user.city;
            // user.state = state || user.state;
            // user.pincode = pincode || user.pincode;
            // user.skills = parsedSkills || user.skills;
            // user.preferredSalary = parsedPreferredSalary || user.preferredSalary;
    
            // ✅ Save updated user
            await user.save();
            console.log("User updated successfully:", user._id);
    
            return res.status(200).json({ 
                success: "User updated successfully!",
                userId: user._id 
            });
    
        } catch (err) {
            console.error("Error in editUser function:", err);
            return res.status(500).json({ error: "Internal server error!" });
        }

    }
    
    
  // async editProfile(req, res) {
  //   try {
  //     const {
  //       userId,
  //       mobile,
  //       skill,
  //       age,
  //       password,
  //       cpassword,
  //       userName,
  //       name,
  //       address,
  //       skillSet,
  //       email,
  //       street,
  //       city,
  //       state,
  //       pincode,
  //       gender,
  //       int,
  //       int1,
  //       int2,
  //       country,
  //       bio,
  //       int3,
  //       industry
  //     } = req.body;
  //     let obj = {};
  //     if(industry){
  //       obj["industry"]=industry;
  //     }
  //     if (mobile) {
  //       if(!phonenumber(mobile)) return res.status(400).json({error:"Invalid mobile number!"});
  //       let check = await userModel.findOne({ mobile: mobile,isDelete:false });
  //       obj["mobile"] = mobile;
  //     }
  //     if (email) {
  //       if(!isValidEmail(email)) return res.status(400).json({error:"Invalid email id!"})
  //       let check2 = await userModel.findOne({ email: email,isDelete:false });

  //        obj["email"] = email;
  //     }
  //     if (name) {
  //       if(!isValidString(name)) return res.status(400).json({error:"Name should be alphabets minmum size 3-25!"})
  //       obj["name"] = name;
  //     }
  //     if (age) {
  //       obj["age"] = age;
  //     }
  //     if (skill) {
  //       obj["skill"] = skill;
  //     }
  //     if (gender) {
  //       obj["gender"] = gender;
  //     }
  //     if (address) {
  //       obj["address"] = address;
  //     }
  //     if (userName) {
  //       let check3 = await userModel.findOne({ userName: userName,isDelete:false });
  //       if (check3)
  //         return res
  //           .status(400)
  //           .json({ error: "try to different user name" });

  //       obj["userName"] = userName;
  //     }
  //     if (street) {
  //       obj["street"] = street;
  //     }
  //     if (city) {
  //       obj["city"] = city;
  //     }
  //     if (state) {
  //       obj["state"] = state;
  //     }
  //     if (pincode) {
  //       if (!/^[0-9]{6}$/.test(pincode)) return res.status(400).send({ error: "Invalid pin code" });
  //       obj["pincode"] = pincode;
  //     }

  //     if (password) {

  //       if(password!==cpassword) return res.status(400).json({error:"Confirm password dose not match!"})

  //       send.sendMail()
  //       let encryptedPassword = bcrypt
  //         .hash(password, saltRounds)
  //         .then((hash) => {
  //           return hash;
  //         });
  //       let pwd = await encryptedPassword;

  //       obj["password"] = pwd;
  //     }
  //     if (int) {
  //       obj["interest.int"] = int;
  //     }
  //     if (int1) {
  //       obj["interest.int1"] = int1;
  //     }
  //     if (int2) {
  //       obj["interest.int2"] = int2;
  //     }
  //     if (int3) {
  //       obj["interest.int3"] = int3;
  //     }
  //     if (country) {
  //       obj["country"] = country;
  //     }
  //     if (bio) {
  //       obj["bio"] = bio;
  //     }
  //     if (skillSet) {
  //       obj["skillSet"] = skillSet;
  //     }

  //     if (req.files.length != 0) {
  //       let arr = req.files;
  //       let i;
  //       for (i = 0; i < arr.length; i++) {
  //         if (arr[i].fieldname == "resume") {
  //           obj["resume"] = arr[i].filename;
  //         }
  //         if (arr[i].fieldname == "profile") {
  //           obj["profile"] = arr[i].filename;
  //         }
  //         if (arr[i].fieldname == "backgroundImage") {
  //           obj["backgroundImage"] = arr[i].filename;
  //         }
  //       }
  //     }
     
  //     let updateUser = await userModel.findOneAndUpdate(
  //       { _id: userId },
  //       { $set: obj },
  //       { new: true }
  //     );
  //     if (!updateUser)
  //       return res.status(400).json({ error: "Something went worng" });
  //     return res
  //       .status(200)
  //       .json({ success: "Successfully updated", success1: updateUser });
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }


   
    async updateProfileImg(req, res) {
      try {
        const { userId } = req.params;

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const file = req.files[0];
        let imageUrl;

        try {
          // Upload the file to AWS S3
          imageUrl = await uploadFile2(file, "user-profiles");
        } catch (uploadError) {
          console.error("Error uploading to S3:", uploadError);
          return res.status(500).json({ success: false, message: "Failed to upload file to S3", error: uploadError.message });
        }

        // Get the existing user to check if we need to delete an old profile image
        const existingUser = await userModel.findById(userId);
        if (existingUser && existingUser.profile && existingUser.profile.startsWith('https://')) {
          try {
            // Delete the old profile image from S3
            await deleteFile(existingUser.profile);
          } catch (deleteError) {
            console.warn("Could not delete old profile image:", deleteError);
            // Continue with the update even if delete fails
          }
        }

        // Update user with the new S3 URL
        const updatedUser = await userModel.findOneAndUpdate(
          { _id: userId },
          { $set: { profile: imageUrl } },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ 
          success: true, 
          message: "Profile image updated successfully", 
          data: updatedUser 
        });
      } catch (err) {
        console.error("Error updating profile image:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
      }
    }

    async updateResume(req, res) {
      try {
        const { userId } = req.params;

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ success: false, message: "No resume file uploaded" });
        }

        const file = req.files[0];
        let resumeUrl;

        try {
          // Upload the file to AWS S3
          resumeUrl = await uploadFile2(file, "user-resumes");
        } catch (uploadError) {
          console.error("Error uploading to S3:", uploadError);
          return res.status(500).json({ success: false, message: "Failed to upload resume to S3", error: uploadError.message });
        }

        // Get the existing user to check if we need to delete an old resume
        const existingUser = await userModel.findById(userId);
        if (existingUser && existingUser.resume && existingUser.resume.startsWith('https://')) {
          try {
            // Delete the old resume from S3
            await deleteFile(existingUser.resume);
          } catch (deleteError) {
            console.warn("Could not delete old resume:", deleteError);
            // Continue with the update even if delete fails
          }
        }

        // Update user with the new S3 URL
        const updatedUser = await userModel.findOneAndUpdate(
          { _id: userId },
          { $set: { resume: resumeUrl } },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ 
          success: true, 
          message: "Resume updated successfully", 
          data: updatedUser 
        });
      } catch (err) {
        console.error("Error updating resume:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
      }
    }


  // async AddSkill(req, res) {
  //   try {
  //     const { skills, userId } = req.body;
  //     if(!isValid(skills)) return res.status(400).json({error:"Please enter skill!"});
  //   //   if(!isValid(Experience)) return res.status(400).json({error:"Please enter experience!"})
  //     let obj = { skills };
  //   console.log(obj,"this is obj")

  //     let add = await userModel.findOneAndUpdate(
  //       { _id: userId },
  //       { $push: { skillSet: obj } },
  //       { new: true }
  //     );
  //     if (!add)
  //       return res.status(400).json({ error: "Something went worng" });
  //     return res.status(200).json({ success: "Successfully added" });
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }

  async addSkill  (req, res){
    try {
      const { userId, skill } = req.body;
      const user = await userModel.findByIdAndUpdate(userId, { $addToSet: { skills: skill } }, { new: true });
  
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  
      res.status(200).json({ success: true, message: 'Skill added successfully', data: user.skills });
    } catch (error) {
      console.error('Add skill error:', error);
      res.status(500).json({ success: false, message: 'Failed to add skill', error: error.message });
    }
  };

  // async removeSkill(req, res) {
  //   try {
  //     let removeId = req.params.removeId;
  //     let userId = req.params.userId;
  //     let add = await userModel.findOneAndUpdate(
  //       { _id: userId },
  //       { $pull: { skillSet: { _id: removeId } } },
  //       { new: true }
  //     );
  //     if (!add)
  //       return res.status(400).json({ success: "Something went worng" });
  //     return res.status(200).json({ success: "Successfully deleted" });
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }

  // async AddEducation(req, res) {
  //   try {
  //     const { Institue, userId, field, starting, passOut, Course, Location } =
  //       req.body;
  //       if(!isValid(Institue))return res.status(400).json({error:"Please enter institute name!"})
  //       if(!isValid(Course)) return res.status(400).json({error:"Please enter course!"});
  //       if(!isValid(field)) return res.status(400).json({error:"Please enter branch!"});
  //       if(!isValid(starting)) return res.status(400).json({error:"Please enter starting year!"});
  //       if(!isValid(passOut)) return res.status(400).json({error:"Please enter passout year!"})
  //     let obj = { Institue, Course, Location, field, starting, passOut };

  //     let add = await userModel.findOneAndUpdate(
  //       { _id: userId },
  //       { $push: { education: obj } },
  //       { new: true }
  //     );
  //     if (!add)
  //       return res.status(400).json({ error: "Something went worng" });
  //     return res.status(200).json({ success: "Successfully added" });
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }
  async removeSkill  (req, res) {
    try {
      const { userId, skill } = req.params;
      const user = await userModel.findByIdAndUpdate(userId, { $pull: { skills: skill } }, { new: true });
  
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  
      res.status(200).json({ success: true, message: 'Skill removed successfully', data: user.skills });
    } catch (error) {
      console.error('Remove skill error:', error);
      res.status(500).json({ success: false, message: 'Failed to remove skill', error: error.message });
    }
  };
  
  async  addEducation  (req, res) {
    try {
      const { userId, education } = req.body;
      const user = await userModel.findByIdAndUpdate(userId, { $push: { education } }, { new: true });
  
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  
      res.status(200).json({ success: true, message: 'Education added successfully', data: user.education });
    } catch (error) {
      console.error('Add education error:', error);
      res.status(500).json({ success: false, message: 'Failed to add education', error: error.message });
    }
  };
  
  
  // async removeEducation(req, res) {
  //   try {
  //     let removeId = req.params.removeId;
  //     let userId = req.params.userId;
  //     let add = await userModel.findOneAndUpdate(
  //       { _id: userId },
  //       { $pull: { education: { _id: removeId } } },
  //       { new: true }
  //     );
  //     if (!add)
  //       return res.status(400).json({ success: "Something went worng" });
  //     return res.status(200).json({ success: "Successfully deleted" });
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }

  async removeEducation  (req, res){
    try {
      const { userId, educationId } = req.params;
      const user = await userModel.findByIdAndUpdate(userId, { $pull: { education: { _id: educationId } } }, { new: true });
  
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  
      res.status(200).json({ success: true, message: 'Education removed successfully', data: user.education });
    } catch (error) {
      console.error('Remove education error:', error);
      res.status(500).json({ success: false, message: 'Failed to remove education', error: error.message });
    }
  };
  
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
      return res.status(200).json({ success: "Successfully added" ,data:add.workExperience});
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
      return res.status(200).json({ success: "Successfully deleted" ,data:add.workExperience});
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
      // console.log(req.body,"saldjna")
      if(!isValid(email)) return res.status(400).json({error:"Please enter your email!"})
      if(!isValid(password)) return res.status(400).json({error:"Please enter your password!"})
      let hash;
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
        return res.status(400).send({ alert: "Invalid password!" });
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
        console.log("Received application data:", req.body);

        let { applicant, job, status, title, company, location, type, requirements, description, companyInfo } = req.body;

        // Parse `applicant` if it's a JSON string
  

        const applicantId = applicant // Extract actual user ID
        console.log(applicantId,job,"asljhadsalskmasmas")

        if (!mongoose.Types.ObjectId.isValid(applicantId)) {
            return res.status(400).json({ error: "Invalid applicant ID format" });
        }

        if (!mongoose.Types.ObjectId.isValid(job)) {
            return res.status(400).json({ error: "Invalid job ID format" });
        }

        // Check if already applied
        const existingApplication = await applyModel.findOne({
            companyId: job,
            userId: applicantId,
            isDelete: false
        });
        console.log(existingApplication ,"hbhbhbh")

        if (existingApplication) {
            return res.status(400).json({alert: "You have already applied for this job" });
        }
        console.log(existingApplication,"ththhtthth")

        // Create application
        const newApplication = await applyModel.create({
          companyId: job,
            userId: applicantId,
            jobTitle: title,
            companyName: company,
            status: status || "Applied",
            appliedOn: new Date(),
            jobDetails: {
                location,
                type,
                requirements: Array.isArray(requirements) ? requirements : [],
                description,
                companyInfo
            }
        });
        console.log(newApplication ,"hbhaef,mabdmancbamjcbamhcvasbhbh")

        return res.status(200).json({
            success: true,
            message: "Successfully applied",
            application: newApplication
        });

    } catch (err) {
        console.error("Apply Now Error:", err);
        return res.status(500).json({ error: "Internal server error", details: err.message });
    }
}


  async getApplyCompanyList(req, res) {
    try {
      let userId = req.params.userId;
      
      let data = await applyModel
      .find({ userId: userId })
      .sort({ _id: -1 })
      .populate("companyId");
      console.log(data)
      console.log(userId,"thisis dsinsd")
   
      return res.status(200).json({ success: data });
    } catch (err) {
      console.log(err);
    }
  }

  async getAllApplyCompanyList(req, res) {
    try {
      // let userId = req.params.userId;
   
      let data = await applyModel
        .find()
        .sort({ _id: -1 })
        .populate("companyId")
        .populate("userId");
   
      return res.status(200).json({ success: data });
    } catch (err) {
      console.log(err);
    }
  }
  async getlistofinterviewscedule(req, res) {
    try {
      // Find all interviews where the status is "Scheduled"
      let scheduledInterviews = await Interview.find({}).sort({ dateTime: 1 }).populate("candidate");
  
      if (scheduledInterviews.length === 0) {
        return res.status(404).json({ message: "No scheduled interviews found" });
      }
  
      return res.status(200).json({ success: true, interviews: scheduledInterviews });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Something went wrong", details: error.message });
    }
  }
  

  async  scheduleInterview(req, res) {
      try {
           const { candidate, position, dateTime, type, interviewer, status } = req.body;

    // Validate required fields
    if (!candidate || !position || !dateTime || !interviewer) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create a new interview
    const newInterview = new Interview({
      candidate,
      position,
      dateTime,
      
      type: type || "Online", // Default to "Online" if not provided
      interviewer,
      status: status || "Scheduled" // Default status to "Scheduled"
    });

    // Save to database
    await newInterview.save();

    return res.status(201).json({ success: true, interview: newInterview });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong", details: error.message });
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
      const userId = req.params.userId;
      console.log(userId, "Fetching user");
  
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
  
      // Fetch user and populate references
      const user = await userModel.findById(userId)
        .populate({
          path: "jobRole",
          select: "name" // Adjust fields as per your schema
        })
        .populate({
          path: "companyType",
          select: "type" 
        })
        .populate({
          path: "department",
          select: "name"
        })
        .populate({
          path: "workMode",
          select: "mode"
        })
        .populate("experiences.jobRoles experiences.industry education");
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Server error" });
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
    subject: 'Your Labor Link new genarated password',
    html:`<h1>Hi ${data.name}</h1><p>Seems like you forgot your password for UNIVI. Your password is :</p> <b> ${newPassword}</b>
   
   
   <p> If you did not initiate this request, please contact us immediately
at ${process.env.NODE_SENDER_MAIL}</p>
"<h3>Thank you <br>Labor Link Team</h3>"`,
   
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
          <h3>Thank you <br>Labor Link Team</h3>
          `);
      }else{
          send.sendMail(data.name,data.email, `Your profile is ${data.status} because ${data.reasion} please complete your profile,
          <h3>Thank you <br>Labor Link Team</h3>
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
                <h3>Thank you <br>Labor Link Team</h3>
                `);
            }else{
                send.sendMail(data.name,data.email, `Your profile is blocked  please contact admin,
                <h3>Thank you <br>Labor Link Team</h3>
                `);
            }
            return res.status(200).json({success:"success"})
        } catch (error) {
            console.log(error);
        }
    }

    //matching card 

  // Update user's matching profile
}

module.exports = new user();
