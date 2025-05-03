const mongoose = require("mongoose");  // ✅ Import mongoose


const employerModel = require('../../Model/Employers/employers');
const jobModel = require("../../Model/Employers/company");
const callModel = require('../../Model/Employers/scheduleinterview');
const userModel = require('../../Model/User/user');
const bcrypt = require('bcryptjs');
const send = require("../../EmailSender/send");
const intrestedModel=require("../../Model/Employers/intrested");
const nodemailer=require('nodemailer');
const applyModel = require("../../Model/Employers/apply");
const Appointment=require("../../Model/Admin/slotbook")
const companyModel=require("../../Model/Employers/company");
const saltRounds = 10;


const {isValidEmail,phonenumber,isValidString,validUrl, isValid}=require("../../Config/function")
class Employers {
//   async registerEmployer(req, res) {
//     try {
//         console.log("Incoming Request:", req.body);

//         const {
//             mobile, age, name, email, password, gender, 
//             street, city, state, pincode, country, address, 
//             hiring, MyCompany, CompanyName, companyWebsite, 
//             numberOfemp, industry, GstNum, searchCount
//         } = req.body;

//         if (!isValidString(name)) return res.status(400).json({ error: "Invalid name format!" });
//         if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email!" });
//         if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters!" });
//         if (!phonenumber(mobile)) return res.status(400).json({ error: "Invalid phone number!" });

//         const existingMobile = await employerModel.findOne({ mobile, isDelete: false });
//         if (existingMobile) return res.status(400).json({ error: "Mobile number already exists!" });

//         const existingEmail = await employerModel.findOne({ email, isDelete: false });
//         if (existingEmail) return res.status(400).json({ error: "Email ID already exists!" });

//         // Password hashing with error handling
//         let hashedPassword;
//         try {
//             hashedPassword = await bcrypt.hash(password, 10);
//         } catch (hashError) {
//             console.error("Password Hashing Error:", hashError);
//             return res.status(500).json({ error: "Failed to encrypt password" });
//         }

//         // Employer registration
//         await employerModel.create({
//             mobile,  age, name, email, password: hashedPassword, gender,
//             street, city, state, pincode, country, address,
//             hiring, MyCompany, CompanyName, companyWebsite,
//             numberOfemp, industry, GstNum, searchCount
//         });


//         // Send welcome email
//         try {
//             await send.sendMail(name, email, `Welcome to Labor Link <h3>Thank you <br>Labor Link Team</h3>`);
//         } catch (mailError) {
//             console.error("Email Sending Error:", mailError);
//         }

//         return res.status(200).json({ success: "Successfully registered!" });

//     } catch (err) {
//         console.error("Error in registerEmployer:", err);
//         return res.status(500).json({ error: "Internal server error", details: err.message });
//     }
// }

async registerEmployer(req, res) {
  try {
    console.log("Incoming Request:", req.body);

    const {
      mobile, age, name, email, password, gender,
      street, city, state, pincode, country, address,
      hiring, MyCompany, CompanyName, companyWebsite,
      numberOfemp, industry, GstNum, searchCount
    } = req.body;

    // ===== VALIDATIONS =====
    if (!isValidString(name)) return res.status(400).json({ error: "Invalid name format!" });
    if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email!" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters!" });
    if (!phonenumber(mobile)) return res.status(400).json({ error: "Invalid phone number!" });

    const existingMobile = await employerModel.findOne({ mobile, isDelete: false });
    if (existingMobile) return res.status(400).json({ error: "Mobile number already exists!" });

    const existingEmail = await employerModel.findOne({ email, isDelete: false });
    if (existingEmail) return res.status(400).json({ error: "Email ID already exists!" });

    // ===== PASSWORD HASHING =====
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashError) {
      console.error("Password Hashing Error:", hashError);
      return res.status(500).json({ error: "Failed to encrypt password" });
    }

    // ===== EMPLOYER REGISTRATION =====
    const newEmployer = await employerModel.create({
      mobile, age, name, email, password: hashedPassword, gender,
      street, city, state, pincode, country, address,
      hiring, MyCompany, CompanyName, companyWebsite,
      numberOfemp, industry, GstNum, searchCount
    });

    // ===== SEND WELCOME EMAIL =====
    try {
      await send.sendMail(name, email, `Welcome to Labor Link <h3>Thank you <br>Labor Link Team</h3>`);
    } catch (mailError) {
      console.error("Email Sending Error:", mailError);
    }

    // ===== SUCCESS RESPONSE =====
    return res.status(200).json({
      success: "Successfully registered!",
      userData: {
        _id: newEmployer._id,
        name: newEmployer.name,
        email: newEmployer.email,
        mobile: newEmployer.mobile,
        CompanyName: newEmployer.CompanyName,
        MyCompany: newEmployer.MyCompany,
        hiring: newEmployer.hiring
        // Add more fields here if needed, just avoid sending hashed password
      }
    });

  } catch (err) {
    console.error("Error in registerEmployer:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}




// Get Employer Profile by ID
    async UpdateEmployerImg(req, res) {
      try {
         const { userId } = req.params;
         console.log(userId,"this is employer id ")
  
          let obj = {};
          if (req.files) {
              obj["EmployerImg"] = `employer/${req.files[0].filename}`; 
          }
  
          // Update user details in the database by adminId
          const updatedUser = await employerModel.findOneAndUpdate(
              { _id: userId },
              { $set: obj },
              { new: true } 
          );
  
          if (!updatedUser) return res.status(400).json({ error: "User not found or update failed!" });
  
          return res.status(200).json({ success: "User updated successfully", data: updatedUser });
      } catch (err) {
          console.error("Error updating user:", err);
          return res.status(500).json({ error: "Internal Server Error" });
      }
  }


async getEmployerProfile(req, res) {
    try {
        console.log("Request Params:", req.params); // Debugging Log
        let { employerId } = req.params; // Changed from 'id' to 'employerId' to match route parameter

        if (!employerId) {
            return res.status(400).json({ message: "Employer ID is required" });
        }

        employerId = employerId.trim();  // Remove spaces from ID

        if (!mongoose.Types.ObjectId.isValid(employerId)) {
            return res.status(400).json({ message: "Invalid Employer ID format" });
        }

        const employer = await employerModel.findById(employerId);

        if (!employer) {
            return res.status(404).json({ message: "Employer not found" });
        }

        return res.status(200).json({ success: true, data: employer });
    } catch (error) {
        console.error("Error fetching employer profile:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}



// Get jobs by employer ID
// Get jobs by employer ID
// async getJobsByEmployer(req, res) {
//     try {
//         const { employerId } = req.params;
//         console.log(employerId, "this is employer ID");

//         // Validate employerId
//         if (!employerId) {
//             return res.status(400).json({ error: "Employer ID is required" });
//         }

//         // Try fetching a sample job to check employerId type
//         const sampleJob = await jobModel.findOne();
//         const employerIdType = typeof sampleJob?.employerId;

//         // Determine the correct query format based on employerId type
//         const query = employerIdType === "string"
//             ? { employerId: employerId }
//             : { employerId: new mongoose.Types.ObjectId(employerId) };

//         // Fetch jobs
//         const jobs = await jobModel.find(query);

//         console.log(jobs);

//         if (jobs.length === 0) {
//             return res.status(404).json({ message: "No jobs found for this employer" });
//         }

//         return res.status(200).json({
//             success: true,
//             count: jobs.length,
//             data: jobs,
//         });
//     } catch (error) {
//         console.error("Error fetching jobs by employer:", error);
//         return res.status(500).json({ error: "Internal server error", details: error.message });
//     }
// }

async getJobsByEmployer(req, res) {
    try {
      const { employerId } = req.params;
      console.log(employerId, "this is employer ID");
  
      // Validate employerId
      if (!mongoose.Types.ObjectId.isValid(employerId)) {
        return res.status(400).json({ error: "Invalid employer ID" });
      }
  
      // Find jobs where employerId matches
      const jobs = await jobModel.find({ employerId }); // No need to cast employerId again
  
      return res.status(200).json({
        success: true,
        employerId,
        jobCount: jobs.length, // Corrected count
        jobs, // Fixed undefined issue
      });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return res.status(500).json({ error: "Internal server error", details: error.message });
    }
  };
  
  

 
    async editProfile(req, res) {
        try {

            const { userId,hiring,MyCompany,CompanyInd,companyWebsite,companyWebsiteclient,numberOfemp,CompanydocType,Companydoc,address,EmployerdocType,Employerdoc,CompanyName,cpassword,country,industry, mobile, age, password, userName, name, skillSet, email, street, city, state, pincode, gender } = req.body
            let obj = {}
            if(MyCompany){
                obj["MyCompany"]=MyCompany
            }
             if(CompanyInd){
                obj["CompanyInd"]=CompanyInd
            }
            if(CompanyName){
                obj["CompanyName"]=CompanyName
            }
            if(companyWebsite){
               
                obj["companyWebsite"]=companyWebsite
            }
             if(companyWebsiteclient){
               
                obj["companyWebsiteclient"]=companyWebsiteclient
            }
            if(numberOfemp){
                obj["numberOfemp"]=numberOfemp
            }
            if(CompanydocType){
                obj["CompanydocType"]=CompanydocType
                  obj["status"]="unVerified"
            }
            if(EmployerdocType){
                obj["EmployerdocType"]=EmployerdocType
                obj["status"]="unVerified"
            }

            if (mobile) {
                let check = await employerModel.findOne({ mobile: mobile,isDelete:false });
                // if (check) return res.status(400).json({ error: "Mobile number is already exist" });
                if(!phonenumber(mobile)) return res.status(400).json({error:"Invalid phone number!"})
                obj['mobile'] = mobile;
            }
            if(industry){
                if(!industry) return res.status(400).json({error:"Please select the category!"})
                  obj['industry'] = industry;
            }
              if(address){
                if(!address) return res.status(400).json({error:"Please enter the address!"})
                  obj['address'] = address;
            }
              
                
            if (email) {
                let check2 = await employerModel.findOne({ email: email,isDelete:false });
                // if (check2) return res.status(400).json({ error: "Email Id is already exist" })
                if(!isValidEmail(email)) return res.status(400).json({error:"Invalid email!"});
                
                obj['email'] = email;
            }
            if (name) {
                 if(!isValidString(name)) return res.status(400).json({error:"Name should be alphabets minmum size 3-25!"})
                obj['name'] = name;
            }
            if (industry) {
                obj['industry'] = industry;
            }
            if(hiring){
                obj["hiring"]=hiring;
            }
            if (age) {
                obj['age'] = age;
            }
            if (gender) {
                obj['gender'] = gender
            }
            if (country) {
                obj['country'] = country
            }
            if (userName) {

                let check3 = await employerModel.findOne({ userName: userName,isDelete:false });
                if (check3) return res.status(400).json({ error: "try to different user name" });

                obj["userName"] = userName
            }
            if (street) {
                obj['street'] = street
            }
            if (city) {
                obj['city'] = city
            }
            if (state) {
                obj['state'] = state
            }
            if (pincode) {
                if (!/^[0-9]{6}$/.test(pincode)) return res.status(400).send({ error: "Invalid pin code" });
                obj['pincode'] = pincode
            }
            if (skillSet) {
                obj['skillSet'] = skillSet
            }
            if (password) {
                if(password!==cpassword){
                    return res.status(400).json({error:"Password did not match!"})
                }
                let encryptedPassword = bcrypt.hash(password, saltRounds)
                    .then((hash) => {
                        return hash;
                    });
                let pwd = await encryptedPassword;

                obj["password"] = pwd;
            }
            if (req.files.length != 0) {
                let arr = req.files
                let i
                for (i = 0; i < arr.length; i++) {

                    if (arr[i].fieldname == "profile") {
                        obj["profile"] = arr[i].filename
                    }
                    if (arr[i].fieldname == "backgroundImage") {
                        obj["backgroundImage"] = arr[i].filename
                    }
                    if (arr[i].fieldname == "Companydoc") {
                        obj["Companydoc"] = arr[i].filename
                          obj["status"]="unVerified"
                    }
                    if (arr[i].fieldname == "Employerdoc") {
                        obj["Employerdoc"] = arr[i].filename
                          obj["status"]="unVerified"
                    }
                }
            }

            let updateUser = await employerModel.findOneAndUpdate({ _id: userId }, { $set: obj }, { new: true });
            if (!updateUser) return res.status(400).json({ error: "Something went worng" });
            return res.status(200).json({ msg: "Successfully updated", success: updateUser })
        } catch (err) {
            console.log(err);
        }
    }
    async AddEducation(req, res) {
        try {
            const { Institue, userId, Course, field, starting, passOut } = req.body;
            let obj = { Institue, Course, field, starting, passOut }

            let add = await employerModel.findOneAndUpdate({ _id: userId }, { $push: { education: obj } }, { new: true });
            if (!add) return res.status(400).json({ success: "Something went worng" });
            return res.status(200).json({ success: "Successfully added" })
        } catch (err) {
            console.log(err);
        }
    }
    async removeEducation(req, res) {
        try {
            let removeId = req.params.removeId;
            let userId = req.params.userId;
            let add = await employerModel.findOneAndUpdate({ _id: userId }, { $pull: { education: { _id: removeId } } }, { new: true });
            if (!add) return res.status(400).json({ success: "Something went worng" });
            return res.status(200).json({ success: "Successfully deleted" });
        } catch (err) {
            console.log(err);
        }
    }
    async addWorkExperience(req, res) {
        try {
            const { Company, userId, Period, Skill, Experience } = req.body;
            let obj = { Company, Period, Skill, Experience }
            let add = await employerModel.findOneAndUpdate({ _id: userId }, { $push: { workAndExperience: obj } }, { new: true });
            if (!add) return res.status(400).json({ success: "Something went worng" });
            return res.status(200).json({ success: add })
        } catch (err) {
            console.log(err);
        }
    }
    async removeWorkExperience(req, res) {
        try {
            let removeId = req.params.removeId;
            let userId = req.params.userId;
            let add = await employerModel.findOneAndUpdate({ _id: userId }, { $pull: { workAndExperience: { _id: removeId } } }, { new: true });
            if (!add) return res.status(400).json({ success: "Something went worng" });
            return res.status(200).json({ success: add });
        } catch (err) {
            console.log(err);
        }
    }

    async getAllProfile(req, res) {
        try {
            let findData = await employerModel.find().sort({ _id: -1 }).limit(25);
            console.log("Success Response:", { success: "Data not found" }); // Logging response before sending

            if (findData.length <= 0) return res.status(400).json({ success: "Data not found" });
            return res.status(200).json({ success: findData })
        } catch (err) {
            console.log(err);
        }
    }

    async toggleEmployerApproval (req, res){
    try {
        const { employerId } = req.params;

        if (!employerId) {
            return res.status(400).json({ success: false, message: "Employer ID is required" });
        }

        const employer = await employerModel.findById(employerId);

        if (!employer) {
            return res.status(404).json({ success: false, message: "Employer not found" });
        }

        // Toggle Approval Status
        employer.isApproved = !employer.isApproved;
        employer.status = employer.isApproved ? "Approved" : "Pending"; 
        
        await employer.save();

        return res.status(200).json({
            success: true,
            message: `Employer ${employer.isApproved ? "Approved" : "Unapproved"} successfully`,
            data: employer
        });
    } catch (err) {
        console.error("Error updating employer approval status:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}




    async login(req, res) {
        try {
            const { email, password } = req.body;
            console.log("abcd", email, password)
            let hash
          
           if(!isValid(email)) return res.status(400).json({success:"Please enter your email!"})
            if(!isValid(password)) return res.status(400).json({success:"Please enter your password!"})
              if(!phonenumber(email)){
             hash = await employerModel.findOne({ email: email ,isDelete:false});
            }else{
                  hash=  await employerModel.findOne({mobile:email ,isDelete:false})
            }
        
            if (!hash) return res.status(400).json({ success: "Please enter register Id!" });

            let compare = await bcrypt.compare(password, hash.password).then((res) => {
                return res
            });

            if (!compare) { return res.status(400).send({ success: "Invalid password!" }); }
           let updateData= await employerModel.findOneAndUpdate({_id:hash._id},{$set:{online:"online"}},{new:true})
            return res.status(200).json({ msg: "Successfully login", success: updateData })

        } catch (err) {
            console.log(err);
        }
    }

    
    async deleteProfile(req, res) {
        try {
            const {userId,reasion}=req.body
            let data = await employerModel.findOneAndUpdate({ _id: userId },{$set:{reasion:reasion,isDelete:true}},{new:true});
            if (!data) return res.status(404).json({ success: "data not found" });

            let company=await companyModel.find({employerId:userId});
            if(company.length !==0){
                for(let i=0;i<company.length;i++){
                    await applyModel.deleteMany({companyId:company[i]._id})
                    await companyModel.deleteOne({_id:company[i]._id})
                }
            }
           await intrestedModel.deleteMany({employedId:userId})
            return res.status(200).json({ success: "Successfully deleted" })
        } catch (err) {
            console.log(err);
        }
    }
    
    async  callinterview(req, res) {
        try {
          const { userId, schedule, slotId, status, employerId, feedback, Position, name, meetingPassword, meetingLink, email, companyId, platform, interviewNotes, duration } = req.body;
          console.log(slotId,"hi")
          if (!userId || !schedule || !slotId || !employerId  ||  !email || !companyId) {
            return res.status(400).json({ error: "Missing required fields" });
          }
          console.log("hi sdsd")

          const slot = await Appointment.findById(slotId);
          console.log("jijiji",slot)
          if (slot.status === "booked") {
            return res.status(400).json({ error: "Slot already booked" });
          }
          console.log("sdfjndssd")
          slot.status = "booked";
await slot.save();

         
        const companyObjectId = new mongoose.Types.ObjectId(companyId);

        const userData = await userModel.findById(userId)
      
          // Check if the interview call already exists
          let existingCall = await callModel.findOne({userId , employerId, companyObjectId });
          
          
          if (existingCall) {
            return res.status(200).json({user: userData,success: "Interview call already scheduled!" });
          }
      
          // Create a new interview call
          let newCall = await callModel.create({
            employerId,
            userId,
            schedule,
            status: status || "Scheduled", // Default status
            name,
            email,
            companyId:companyObjectId,
            platform,
            meetingPassword,
            meetingLink,
            interviewNotes,
            duration: slot.duration || duration, // prioritizing slot's duration
            feedback,
            Position	,
          });
          console.log(newCall,
            "thisissssss"
          )
      
          if (!newCall) {
            return res.status(500).json({ error: "Failed to schedule interview call" });
          }
      
          console.log(newCall, "Interview Call Created");
      
          // Send email notification
          // await send.sendMail(
          //   name,
          //   email,
          //   `You are shortlisted for an interview. The schedule is ${schedule}.<br>
          //   <strong>Platform:</strong> ${platform || "Not Specified"}<br>
          //   <strong>Duration:</strong> ${duration ? duration + " minutes" : "Not Specified"}<br><br>
          //   <h3>Thank you,<br>Labor Link Team</h3>`
          // );
          await send.sendMail(
            name,
            email,
            `You are shortlisted for an interview.<br>
             <strong>Date:</strong> ${slot.date.toDateString()}<br>
             <strong>Time:</strong> ${slot.time}<br>
             <strong>Duration:</strong> ${slot.duration}<br>
             <strong>Platform:</strong> ${platform || "Not Specified"}<br><br>
             <h3>Thank you,<br>Labor Link Team</h3>`
          );
          
      
          return res.status(201).json({success: "Interview scheduled successfully" , userData });
      
        } catch (error) {
          console.error("Error scheduling interview:", error);
          return res.status(500).json({message: "Internal Server Error" , error:error.message });
        }
      }
    
      async  getcallinterview(req, res) {
        try {
          const { employerId ,companyId} = req.params;
      
          if (!employerId) {
            return res.status(400).json({ error: "Employer ID is required" });
          }
      
          let interviewCalls = await callModel.find({ employerId,companyId }).sort({ _id: -1 });
      
          if (!interviewCalls.length) {
            return res.status(404).json({ error: "No interview calls found" });
          }
      
          return res.status(200).json({ success: true, data: interviewCalls });
      
        } catch (error) {
          console.error("Error fetching interview calls:", error);
          return res.status(500).json({ error: "Internal Server Error" });
        }
      }

      //getAllScheduledInterviews
      async getAllScheduledInterviews  (req, res) {
        try {
            const interviews = await callModel.find({ status: "Scheduled" })
              .populate("userId", "name email") // Populating user details
            //   .populate("companyId", "name location"); // Populating company details
        
            if (!interviews || interviews.length === 0) {
              return res.status(404).json({ 
                success: false,
                message: "No scheduled interviews found." 
              });
            }
        
            res.status(200).json({
              success: true,
              interviews,
            });
          } catch (error) {
            console.error("Error fetching scheduled interviews:", error);
            res.status(500).json({
              success: false,
              message: "Internal Server Error",
              error: error.message, // Return error message for debugging
            });
          }
      };




      // Update interview status
      async updateInterviewStatus  (req, res) {
        try {
            const { interviewId } = req.params;
            console.log(interviewId,"this is an interview id ")
            const { status } = req.body;
        
      // Find and update the interview status
      const updatedInterview = await applyModel.findByIdAndUpdate(
        interviewId,
        { status: status },
        { new: true }
      );
  
      if (!updatedInterview) {
        return res.status(404).json({
          success: false,
          message: 'Interview not found'
        });
      }
  
      res.status(200).json({
        success: true,
        message: 'Interview status updated successfully',
        data: updatedInterview
      });
  
    } catch (error) {
      console.error('Error updating interview status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update interview status',
        error: error.message
      });
    }
  };
      
    
   async getUserByFilter(req, res) {
        try {
            const {  skill,Experience, city, category, jobProfile, int1,  } = req.body
            let obj = {}
            if(jobProfile){
               obj['industry']=jobProfile
                
            }
            
                
          
            let findData = await userModel.find(obj).sort({_id: -1 });
            if (findData.length <= 0) return res.status(400).json({ success: "Data not found" });
            return res.status(200).json({ success: findData })
      

    } catch(err) {
        console.log(err);
    }
}

    async MakeIntrestedUser(req,res){
        try{
            const {userId,employedId,userEmail,userName,EmployeName,email,mobile}=req.body;
          
            let check1=await intrestedModel.findOne({userId:userId,employedId:employedId})
            if(!check1){
            let data=await intrestedModel.create({employedId:employedId,userId:userId})
           
            if(!data) return res.status(400).json({error:"Data not found"});
            send.sendMail(userName,userEmail, `Mr ${EmployeName} is interested in your profile please contact to this ${mobile} and email ${email},
            <h3>Thank you <br>Labor Link Team</h3>
            `);
            return res.status(200).json({success:"Successfully send notice"});
            }else{
                return res.status(200).json({success:"Already sent!"})
            }
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
            let data=await employerModel.findOneAndUpdate({_id:userId},{$set:obj},{new:true});
            if(!data) return res.status(400).json({error:"Something went wong!"});
            if(data.status=="Approved"){
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
        
            let data=await employerModel.findOneAndUpdate({_id:userId},{$set:obj},{new:true});
            if(!data) return res.status(400).json({error:"Something went wong!"});
            if(data.isBlock==false){
                send.sendMail(data.name,data.email, `Your profile is un-bloked now you can post job,
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
    async getInterestedUser(req,res){
        try{
            let employerId=req.params.employerId;
            console.log(employerId);
            let data=await intrestedModel.find({employedId:employerId}).sort({_id:-1}).populate("userId");
            if(data.length<=0) return res.status(400).json({error:"Data not found"});
            return res.status(200).json({success:data})
        }catch(err){

        }
    }
    async getEmployerById(req,res){
        try {
            let employerId=req.params.employerId;
            let data=await employerModel.findById(employerId);
            if(!data) return res.status(400).json({error:"No data found"});
            return res.status(200).json({success:data})
        } catch (error) {
            console.log(error);
        }
    }

    async deleteIntrestById(req,res){
        try {
            let intrestId=req.params.intrestId;
            let data=await intrestedModel.deleteOne({_id:intrestId});
            if(data.deletedCount===0) return res.status(400).json({error:"Data not found"});
            return res.status(200).json({success:"Successfully deleted"})
        } catch (error) {
            console.log(error);
        }
    }
      async deleteParmanet(req,res){
        try {
            let userId=req.params.userId;
            let data=await employerModel.deleteOne({_id:userId});
            if(data.deletedCount===0) return res.status(400).json({error:"Data not found"});
            return res.status(200).json({success:"Successfully deleted"})
        } catch (error) {
            console.log(error);
        }
    }
    //forget password 

async postmail(req, res){
    let { email } = req.body;
    if(!isValid(email)) return res.status(400).json({error:"Please enter email Id!"})
    let data = await employerModel.findOne({email: email,isDelete:false});
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
  
   
 
      newPassword = bcrypt.hashSync(newPassword, 10);
      let passChange = employerModel.findOneAndUpdate({email : email} , {
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
        let employer=await employerModel.find({updatedAt:{$lte:new Date(Date.now() - 24*60*60*365 * 1000)}});
        if(employer.length!==0){
           for (let index = 0; index < employer.length; index++) {
            await employerModel.deleteOne({_id:employer[index]._id})
            let company=await companyModel.find({employerId:employer[index]._id});
            if(company.length !==0){
                for(let i=0;i<company.length;i++){
                    await applyModel.deleteMany({companyId:company[i]._id})
                    await companyModel.deleteOne({_id:company[i]._id})
                }
            }
            console.log("daleted employer name=",employer[index].name)
           }
        }
    
    } catch (error) {
        console.log(error);
    }
  }


  async checkApprovalStatus  (req, res) {
    const { userId } = req.params; // Extract userId from the request parameters
  console.log(userId);
  
    try {
      // Find the user by their ID
      const user = await employerModel.findById(userId);
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
  
      // Check if the user is approved
      if (user.isApproved) {
        return res.status(200).json({
          success: true,
          isApproved: true,
          userData: user,
          message: 'User is approved',
        });
      } else {
        return res.status(200).json({
          success: true,
          isApproved: false,
          message: 'User is not yet approved',
          userData: user,
        });
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
  



}

module.exports = new Employers()