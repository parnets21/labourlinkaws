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
const FCMtoken = require("../../Model/User/FCMtoken");

// Helper function to calculate subscription end date
const calculateSubscriptionEndDate = (startDate, duration) => {
  let endDate = new Date(startDate);
  
  switch (duration) {
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'quarterly':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case 'lifetime':
      endDate.setFullYear(endDate.getFullYear() + 100); // Set to 100 years from now
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
  }
  
  return endDate;
};

class user {
  async register(req, res) {
  try {
    const {
      profile,
      fullName,
      email,
      phone, // This will be used for WhatsApp
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
      skills,
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

    // Send welcome WhatsApp message
    try {
      await send.sendUserRegisteredWhatsapp({
        name: fullName,
        mobile: phone
      });
      console.log("WhatsApp welcome message sent successfully");
    } catch (whatsappError) {
      console.error("Failed to send WhatsApp message:", whatsappError);
      // Don't fail the registration if WhatsApp fails
    } 
     //sms
 // SMS
try {
  await send.sendregisterSMS(phone, fullName); // pass ONLY the variable
  console.log("SMS welcome message sent successfully");
} catch (smsError) {
  console.error("Failed to send SMS message:", smsError.response?.data || smsError.message);
}


    return res.status(200).json({ 
      success: "Successfully registered!",
      userId: newUser._id,
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

  async  registerFromResume(req, res) {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: "No resume uploaded." });

        // 1️⃣ Parse resume
        const parsedData = await parseResume(file.path); // your parser function
        const {
            fullName, email, phone, skills, education, location, workExperience
        } = parsedData;

        // 2️⃣ Check existing
        let userExists = await userModel.findOne({ email, isDelete: false });
        if (userExists) return res.status(400).json({ error: "Email already exists!" });

        userExists = await userModel.findOne({ phone, isDelete: false });
        if (userExists) return res.status(400).json({ error: "Phone already exists!" });

        // 3️⃣ Generate random password
        const generatedPassword = crypto.randomBytes(8).toString('hex');
        const encryptedPassword = await bcrypt.hash(generatedPassword, 10);

        // 4️⃣ Create user
        const userData = {
            profile: "", // default or extracted profile URL if available
            fullName,
            email,
            phone,
            location,
            password: encryptedPassword,
            confirmPassword: encryptedPassword,
            workExperience: workExperience ? true : false,
            experiences: workExperience,
            education,
            skills,
            appliedOn: new Date(),
            online: "Offline",
            isBlock: false,
            isDelete: false
        };

        const newUser = await userModel.create(userData);

        // 5️⃣ Send welcome email with credentials
        await send.sendMail(fullName, email, `Welcome to Labor Link!<br>Your temporary password is: <b>${generatedPassword}</b><br>Please log in and change your password.`);

        return res.status(200).json({
            success: "Jobseeker registered successfully!",
            userId: newUser._id,
            email,
            password: generatedPassword
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during resume registration." });
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

 
// async login(req, res) {
//   try {
//     const { email, password, fcmToken, deviceId, platform } = req.body;
    
//     if (!isValid(email)) return res.status(400).json({error: "Please enter your email!"});
//     if (!isValid(password)) return res.status(400).json({error: "Please enter your password!"});
    
//     let hash;
//     if (!phonenumber(email)) {
//       hash = await userModel.findOne({ email: email, isDelete: false });
//     } else {
//       hash = await userModel.findOne({ mobile: email, isDelete: false });
//     }
        
//     if (!hash)
//       return res.status(400).json({ error: "Please enter register Id!" });
      
//     let compare = await bcrypt
//       .compare(password, hash.password)
//       .then((res) => {
//         return res;
//       });
      
//     if (!compare) {
//       return res.status(400).send({ alert: "Invalid password!" });
//     }   

//     let updateData = await userModel.findOneAndUpdate(
//       { _id: hash._id }, 
//       { $set: { online: "online" } }, 
//       { new: true }
//     );

//     // Save/update FCM token if provided
//     if (fcmToken && deviceId && platform) {
//       await FCMtoken.findOneAndUpdate(
//         { employeeId: hash._id },
//         {
//           fcmToken,
//           deviceId,
//           platform,
//           isActive: true,
//           lastUpdated: new Date()
//         },
//         { upsert: true, new: true }
//       );
      
//       console.log("Saving FCM Token:", { fcmToken, deviceId, platform, employeeId: hash._id });
//     }

//     return res.status(200).json({ 
//       msg: "Successfully login", 
//       success: updateData, 
//       token: updateData.token, 
//       fcmToken 
//     });
//   } catch (err) {     
//     console.log(err);
//     return res.status(500).json({ message: err.message });
//   }
// }
 async login(req, res) {
    try {
      const { email, password, fcmToken, deviceId, platform } = req.body;
      
      console.log("Login attempt with:", { email, hasFCMToken: !!fcmToken, deviceId, platform });
      
      if (!isValid(email)) return res.status(400).json({ error: "Please enter your email!" });
      if (!isValid(password)) return res.status(400).json({ error: "Please enter your password!" });
      
      let hash;
      if (!phonenumber(email)) {
        hash = await userModel.findOne({ email: email, isDelete: false });
      } else {
        hash = await userModel.findOne({ mobile: email, isDelete: false });
      }
          
      if (!hash) return res.status(400).json({ error: "Please enter register Id!" });
          
      let compare = await bcrypt.compare(password, hash.password);
      if (!compare) {
        return res.status(400).send({ alert: "Invalid password!" });
      }   

      let updateData = await userModel.findOneAndUpdate(
        { _id: hash._id }, 
        { $set: { online: "online" } }, 
        { new: true }
      );

      // Save/update FCM token if provided - with enhanced error handling
      if (fcmToken && deviceId && platform) {
        try {
          const fcmData = {
            fcmToken,
            deviceId,
            platform,
            isActive: true,
            lastUpdated: new Date()
          };

          console.log("Saving FCM Token data:", { ...fcmData, employeeId: hash._id });

          const result = await FCMtoken.findOneAndUpdate(
            { employeeId: hash._id },
            fcmData,
            { upsert: true, new: true, runValidators: true }
          );

          console.log("FCM Token saved successfully:", result);
        } catch (fcmError) {
          console.error("Failed to save FCM token:", fcmError);
          // Don't fail login if FCM token saving fails
        }
      } else {
        console.log("FCM token not provided or incomplete:", { fcmToken, deviceId, platform });
      }

      return res.status(200).json({ 
        msg: "Successfully login", 
        success: updateData, 
        token: updateData.token,
        userId: updateData._id
      });
    } catch (err) {     
      console.error("Login error:", err);
      return res.status(500).json({ message: err.message });
    }
  }

  async updateFCMToken(req, res) {
    try {
      const { userId, fcmToken, deviceId, platform } = req.body;

      console.log("Update FCM Token request:", { userId, fcmToken, deviceId, platform });

      if (!userId || !fcmToken || !deviceId || !platform) {
        return res.status(400).json({
          error: "Missing required fields: userId, fcmToken, deviceId, platform"
        });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }

      // Verify user exists
      const userExists = await userModel.findById(userId);
      if (!userExists) {
        return res.status(404).json({ error: "User not found" });
      }

      const fcmData = {
        fcmToken,
        deviceId,
        platform,
        isActive: true,
        lastUpdated: new Date()
      };

      const result = await FCMtoken.findOneAndUpdate(
        { employeeId: userId },
        fcmData,
        { upsert: true, new: true, runValidators: true }
      );

      console.log("FCM Token updated successfully:", result);

      return res.status(200).json({
        success: true,
        message: "FCM token updated successfully",
        data: result
      });
    } catch (err) {
      console.error("FCM token update error:", err);
      return res.status(500).json({ 
        error: "Failed to update FCM token",
        message: err.message 
      });
    }
  }

  async getFCMToken(req, res) {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }

      const fcmData = await FCMtoken.findOne({ employeeId: userId });
      
      if (!fcmData) {
        return res.status(404).json({ 
          success: false, 
          message: "FCM token not found for this user" 
        });
      }

      return res.status(200).json({
        success: true,
        data: fcmData
      });
    } catch (err) {
      console.error("Get FCM token error:", err);
      return res.status(500).json({ 
        error: "Failed to get FCM token",
        message: err.message 
      });
    }
  }

  async changePassword(req, res) {
  try {
    const { userId, oldPassword, newPassword } = req.body;
      console.log("res",req.body);
      
    // if (!isValid(userId)) return res.status(400).json({ error: "User ID is required" });
    if (!isValid(oldPassword)) return res.status(400).json({ error: "Old password is required" });
    if (!isValid(newPassword)) return res.status(400).json({ error: "New password is required" });

    // Find user by ID
    const user = await userModel.findOne({ _id: userId, isDelete: false });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: "Old password is incorrect" });

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({ msg: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
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
    // (This section can be expanded later)

    // Activate user subscription after payment
    async activateSubscription(req, res) {
    try {
      const { 
        userId, 
        subscriptionId, 
        planName, 
        amount, 
        paymentMethod = 'PhonePe', 
        transactionId,
        userType: providedUserType,
        serviceType,
        serviceDescription,
        iapReceipt,
        iapProductId
      } = req.body;

      console.log('Activating subscription:', req.body);

      // Validate required fields
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: userId'
        });
      }

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: transactionId'
        });
      }

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error('Invalid user ID format:', userId);
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID format'
        });
      }

      // Use unified UserSubscription model for both IAP and PhonePe
      const UserSubscription = require('../../Model/User/userSubscription');
      
      // Check if transaction already exists to prevent duplicates
      const existingSubscription = await UserSubscription.findOne({ transactionId });
      if (existingSubscription) {
        console.log('Transaction already processed:', transactionId);
        return res.status(200).json({
          success: true,
          message: 'Transaction already processed',
          data: existingSubscription
        });
      }

      // Validate user exists - check both employee and employer schemas
      console.log('Looking for user with ID:', userId);
      
      let user = await userModel.findById(userId);
      let userType = 'employee';
      let userSchema = 'user';
      
      // If not found in employee schema, check employer schema
      if (!user) {
        const EmployerModel = require('../../Model/Employers/employers');
        user = await EmployerModel.findById(userId);
        if (user) {
          userType = 'employer';
          userSchema = 'employer';
        }
      }
      
      if (!user) {
        console.error('User not found in both employee and employer schemas:', userId);
        
        // Debug information
        const userCount = await userModel.countDocuments();
        const EmployerModel = require('../../Model/Employers/employers');
        const employerCount = await EmployerModel.countDocuments();
        console.log(`Total employees in database: ${userCount}`);
        console.log(`Total employers in database: ${employerCount}`);
        
        // Check if user exists but is marked as deleted
        const deletedEmployee = await userModel.findOne({ _id: userId, isDelete: true });
        const deletedEmployer = await EmployerModel.findOne({ _id: userId, isDelete: true });
        
        if (deletedEmployee || deletedEmployer) {
          console.log('User found but marked as deleted in', deletedEmployee ? 'employee' : 'employer', 'schema');
          return res.status(404).json({
            success: false,
            error: 'User account is deactivated'
          });
        }
        
        return res.status(404).json({
          success: false,
          error: 'User not found in employee or employer database'
        });
      }
      
      console.log('User found:', { 
        id: user._id, 
        email: user.email, 
        userType: userType,
        schema: userSchema,
        name: user.fullName || user.name
      });

      // Get subscription details - find by ID or by planName and userType
      const Subscription = require('../../Model/subscription');
      let subscription;
      
      if (subscriptionId) {
        subscription = await Subscription.findById(subscriptionId);
      }
      
      // If no subscription found by ID or no ID provided, try to find by planName
      if (!subscription && planName) {
        subscription = await Subscription.findOne({
          $or: [
            { name: planName, type: userType },
            { displayName: planName, type: userType }
          ]
        });
        
        // If still not found, try without type restriction
        if (!subscription) {
          subscription = await Subscription.findOne({
            $or: [
              { name: planName },
              { displayName: planName }
            ]
          });
        }
      }
      
      // If still no subscription found, get default for user type
      if (!subscription) {
        subscription = await Subscription.findOne({ 
          type: userType,
          isDefault: true 
        }).sort({ price: 1 });
        
        // If no default, get the cheapest plan for user type
        if (!subscription) {
          subscription = await Subscription.findOne({ 
            type: userType 
          }).sort({ price: 1 });
        }
      }
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'No suitable subscription plan found. Please contact support.'
        });
      }

      // Check if subscription type matches user type
      if (subscription.type !== userType) {
        return res.status(400).json({
          success: false,
          error: `Subscription type ${subscription.type} does not match user type ${userType}. Please select a ${userType} subscription plan.`
        });
      }

      // Deactivate any existing active subscriptions of the same type
      await UserSubscription.updateMany(
        {
          userId,
          type: subscription.type,
          status: 'active'
        },
        {
          status: 'inactive',
          cancellationDate: new Date(),
          cancellationReason: 'Replaced by new subscription'
        }
      );

      // Parse and validate dates
      const parsedStartDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
      const parsedEndDate = req.body.endDate ? new Date(req.body.endDate) : null;

      // Validate dates
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid start date format'
        });
      }

      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid end date format'
        });
      }

      // Calculate end date if not provided
      const startDate = parsedStartDate;
      const endDate = parsedEndDate || calculateSubscriptionEndDate(startDate, subscription.duration);
      
      console.log('Creating subscription with:', {
        userId,
        subscriptionId: subscription._id,
        planName: planName || subscription.displayName,
        type: subscription.type,
        amount: amount || subscription.price,
        paymentMethod,
        startDate,
        endDate,
        duration: subscription.duration
      });

      // Prepare unified subscription data for both IAP and PhonePe
      const subscriptionData = {
        userId: userId,
        subscriptionId: subscription._id,
        transactionId,
        amount: Number(amount) || subscription.price,
        status: req.body.status || 'active',
        startDate: startDate,
        endDate: endDate,
        paymentMethod: paymentMethod,
        planName: (planName || subscription.displayName).trim(),
        type: subscription.type,
        serviceType: serviceType || 'job_portal_subscription',
        serviceDescription: serviceDescription || 'Premium subscription features',
        userType: userType,
        features: subscription.features
      };

      // Add IAP-specific fields if present
      if (paymentMethod === 'Apple IAP' || iapReceipt || iapProductId) {
        subscriptionData.iapReceipt = iapReceipt;
        subscriptionData.iapProductId = iapProductId;
        subscriptionData.metadata = {
          source: 'IAP',
          platform: 'iOS',
          activatedAt: new Date(),
          originalAmount: amount,
          duration: req.body.duration || subscription.duration
        };
      }

      // Create new user subscription - unified for both payment methods
      try {
        const userSubscription = await UserSubscription.create(subscriptionData);

        console.log('Subscription activated successfully:', userSubscription._id);

        return res.status(200).json({
          success: true,
          message: 'Subscription activated successfully',
          data: {
            subscriptionId: userSubscription._id,
            planName: userSubscription.planName,
            type: userSubscription.type,
            status: userSubscription.status,
            startDate: userSubscription.startDate,
            endDate: userSubscription.endDate,
            paymentMethod: userSubscription.paymentMethod
          }
        });
        
      } catch (subscriptionError) {
        console.error('Error creating user subscription:', subscriptionError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create subscription record',
          details: subscriptionError.message,
          validationErrors: subscriptionError.errors
        });
      }

    } catch (error) {
      console.error('Error activating subscription:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to activate subscription',
        details: error.message
      });
    }
  }

  // Update user subscription (for payment completion)
  async updateSubscription(req, res) {
    try {
      const { userId, subscriptionId, transactionId, amount, status = 'active', planName, paymentMethod = 'PhonePe', userType } = req.body;

      console.log('Updating subscription:', req.body);

      if (!userId || !transactionId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, transactionId'
        });
      }

      // Validate user exists - check both employee and employer schemas
      console.log('UpdateSubscription: Looking for user with ID:', userId);
      
      // Try to find user in employee schema first
      let user = await userModel.findById(userId);
      let detectedUserType = 'employee';
      let userSchema = 'user';
      
      // If not found in employee schema, check employer schema
      if (!user) {
        const EmployerModel = require('../../Model/Employers/employers');
        user = await EmployerModel.findById(userId);
        if (user) {
          detectedUserType = 'employer';
          userSchema = 'employer';
        }
      }
      
      if (!user) {
        console.error('UpdateSubscription: User not found in both schemas:', userId);
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      console.log('UpdateSubscription: User found:', { 
        id: user._id, 
        email: user.email, 
        userType: detectedUserType,
        schema: userSchema,
        name: user.fullName || user.name
      });

      const UserSubscription = require('../../Model/User/userSubscription');
      
      // Find subscription by transaction ID first
      let userSubscription;
      if (transactionId) {
        userSubscription = await UserSubscription.findOne({ 
          userId, 
          transactionId 
        });
      }
      
      // If not found and we have a valid subscriptionId, try to find by subscriptionId
      if (!userSubscription && subscriptionId && mongoose.Types.ObjectId.isValid(subscriptionId)) {
        userSubscription = await UserSubscription.findOne({ 
          userId, 
          subscriptionId,
          status: { $in: ['active', 'inactive'] }
        });
      }

      if (!userSubscription) {
        // No existing subscription found, try to create a new one
        console.log('No existing subscription found, attempting to create new subscription');
        
        let finalSubscriptionId = subscriptionId;
        
        // If no valid subscriptionId provided, try to find a default subscription based on planName and userType
        if (!finalSubscriptionId || !mongoose.Types.ObjectId.isValid(finalSubscriptionId)) {
          const Subscription = require('../../Model/subscription');
          
          // Use the detected user type from schema lookup
          let finalUserType = userType || detectedUserType;
          
          // Try to find subscription by planName and type
          let subscription;
          if (planName) {
            subscription = await Subscription.findOne({
              $or: [
                { name: planName, type: finalUserType },
                { displayName: planName, type: finalUserType }
              ]
            });
          }
          
          if (!subscription) {
            // Get default subscription for user type
            subscription = await Subscription.findOne({ 
              type: finalUserType,
              isDefault: true 
            }).sort({ price: 1 }); // Get cheapest if no default
          }
          
          if (!subscription) {
            // Get any subscription for user type
            subscription = await Subscription.findOne({ 
              type: finalUserType 
            }).sort({ price: 1 });
          }
          
          if (subscription) {
            finalSubscriptionId = subscription._id;
          } else {
            return res.status(400).json({
              success: false,
              error: `No subscription plan found for user type: ${finalUserType}`
            });
          }
        }
        
        // Create new subscription using activateSubscription
        return this.activateSubscription({
          body: {
            userId,
            subscriptionId: finalSubscriptionId,
            planName: planName || 'Premium Plan',
            amount,
            paymentMethod,
            transactionId
          }
        }, res);
      }

      // Update existing subscription
      userSubscription.status = status;
      if (transactionId) userSubscription.transactionId = transactionId;
      if (amount) userSubscription.amount = amount;
      if (paymentMethod) userSubscription.paymentMethod = paymentMethod;
      if (planName) userSubscription.planName = planName;
      
      await userSubscription.save();

      return res.status(200).json({
        success: true,
        message: 'Subscription updated successfully',
        data: userSubscription
      });

    } catch (error) {
      console.error('Error updating subscription:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update subscription',
        details: error.message
      });
    }
  }

  // Debug endpoint to check if user exists
  async debugUser(req, res) {
    try {
      const { userId } = req.params;
      
      console.log('Debug user lookup for ID:', userId);
      
      // Check if it's a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID format',
          userId: userId
        });
      }
      
      // Try to find user in both schemas
      const employee = await userModel.findById(userId);
      const employeeDeleted = await userModel.findOne({ _id: userId, isDelete: true });
      
      const EmployerModel = require('../../Model/Employers/employers');
      const employer = await EmployerModel.findById(userId);
      const employerDeleted = await EmployerModel.findOne({ _id: userId, isDelete: true });
      
      const totalEmployees = await userModel.countDocuments();
      const totalEmployers = await EmployerModel.countDocuments();
      
      const user = employee || employer;
      const userType = employee ? 'employee' : (employer ? 'employer' : 'unknown');
      const userSchema = employee ? 'user' : (employer ? 'employer' : 'none');
      
      return res.status(200).json({
        success: true,
        data: {
          userId: userId,
          userFound: !!user,
          userType: userType,
          userSchema: userSchema,
          userDetails: user ? {
            id: user._id,
            email: user.email,
            fullName: user.fullName || user.name,
            userType: userType,
            isDelete: user.isDelete
          } : null,
          employeeFound: !!employee,
          employerFound: !!employer,
          deletedEmployeeFound: !!employeeDeleted,
          deletedEmployerFound: !!employerDeleted,
          totalEmployeesInDB: totalEmployees,
          totalEmployersInDB: totalEmployers
        }
      });
      
    } catch (error) {
      console.error('Debug user error:', error);
      return res.status(500).json({
        success: false,
        error: 'Debug failed',
        details: error.message
      });
    }
  }

  // Get user's active subscriptions
  async getUserSubscriptions(req, res) {
    try {
      const { userId } = req.params;
      const { type, status = 'active' } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const UserSubscription = require('../../Model/User/userSubscription');
      
      const query = { userId };
      if (type) query.type = type;
      if (status) query.status = status;

      const subscriptions = await UserSubscription.find(query)
        .populate('subscriptionId')
        .sort({ startDate: -1 });

      return res.status(200).json({
        success: true,
        count: subscriptions.length,
        data: subscriptions
      });

    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch subscriptions',
        details: error.message
      });
    }
  }

  // Check if user has active subscription
  async checkUserSubscription(req, res) {
    try {
      const { userId } = req.params;
      const { type } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const UserSubscription = require('../../Model/User/userSubscription');
      const hasActive = await UserSubscription.hasActiveSubscription(userId, type);
      const activeSubscription = await UserSubscription.getActiveSubscription(userId, type);

      return res.status(200).json({
        success: true,
        hasActiveSubscription: hasActive,
        subscription: activeSubscription
      });

    } catch (error) {
      console.error('Error checking user subscription:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check subscription',
        details: error.message
      });
    }
  }
  // Get user subscriptions
  async getUserSubscriptions(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }

      // Import user subscription model
      const UserSubscription = require("../../Model/User/userSubscription");
      
      // Get user subscriptions with populated plan details
      const userSubscriptions = await UserSubscription.find({ userId })
        .populate('subscriptionId')
        .sort({ createdAt: -1 })
        .lean();

      // Process subscriptions to add computed fields
      const now = new Date();
      const processedSubscriptions = userSubscriptions.map(sub => {
        const subscription = {
          _id: sub._id,
          userId: sub.userId,
          subscriptionId: sub.subscriptionId,
          planName: sub.subscriptionId?.displayName || sub.subscriptionId?.name || 'Unknown Plan',
          planType: sub.subscriptionId?.type || 'employee',
          price: sub.subscriptionId?.price || 0,
          duration: sub.subscriptionId?.duration || '1 month',
          features: sub.subscriptionId?.features || [],
          status: sub.status || 'active',
          startDate: sub.startDate || sub.createdAt,
          endDate: sub.endDate,
          paymentId: sub.paymentId,
          orderId: sub.orderId,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt
        };

        // Check if subscription is expired
        if (subscription.endDate && new Date(subscription.endDate) <= now) {
          subscription.isExpired = true;
          subscription.daysOverdue = Math.floor((now - new Date(subscription.endDate)) / (1000 * 60 * 60 * 24));
        } else {
          subscription.isExpired = false;
          subscription.daysRemaining = subscription.endDate ? 
            Math.floor((new Date(subscription.endDate) - now) / (1000 * 60 * 60 * 24)) : null;
        }

        return subscription;
      });

      res.status(200).json({
        success: true,
        data: processedSubscriptions,
        meta: {
          total: processedSubscriptions.length,
          active: processedSubscriptions.filter(sub => !sub.isExpired && sub.status === 'active').length,
          expired: processedSubscriptions.filter(sub => sub.isExpired).length,
          inactive: processedSubscriptions.filter(sub => sub.status !== 'active').length
        }
      });

    } catch (error) {
      console.error("Get user subscriptions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user subscriptions",
        error: error.message
      });
    }
  }
}

module.exports = new user();
