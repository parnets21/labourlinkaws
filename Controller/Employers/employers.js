

const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Models
const employerModel = require('../../Model/Employers/employers');
const jobModel = require("../../Model/Employers/company");
const callModel = require('../../Model/Employers/scheduleinterview');
const userModel = require('../../Model/User/user');
const intrestedModel = require("../../Model/Employers/intrested");
const applyModel = require("../../Model/Employers/apply");
const Appointment = require("../../Model/Admin/slotbook");
const companyModel = require("../../Model/Employers/company");


// Utilities
const send = require("../../EmailSender/send");
const { isValidEmail, phonenumber, isValidString, validUrl, isValid } = require("../../Config/function");
const { uploadFile2 } = require("../../middileware/aws");
const DocumentValidationService = require("../../services/documentValidationService");

// Utility function to mask sensitive data (standalone function)
function maskSensitiveData(data) {
  if (!data) return data;
  
  // Mask email - show first 2 and last 2 characters before @
  const maskEmail = (email) => {
    if (!email || typeof email !== 'string') return email;
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    
    if (localPart.length <= 4) {
      return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
    }
    return `${localPart.substring(0, 2)}***${localPart.substring(localPart.length - 2)}@${domain}`;
  };

  // Mask phone - show first 2 and last 2 digits
  const maskPhone = (phone) => {
    if (!phone) return phone;
    const phoneStr = phone.toString();
    if (phoneStr.length <= 4) {
      return `${phoneStr[0]}***${phoneStr[phoneStr.length - 1]}`;
    }
    return `${phoneStr.substring(0, 2)}***${phoneStr.substring(phoneStr.length - 2)}`;
  };

  return {
    ...data,
    email: maskEmail(data.email),
    phone: maskPhone(data.phone)
  };
}

const saltRounds = 10;

class Employers {
  // Register Employer
  async registerEmployer(req, res) {
    try {
      console.log("Incoming Request:", req.body);

      const {
        mobile, age, name, email, password, gender,
        street, city, state, pincode, country, address,
        hiring, MyCompany, CompanyName, companyWebsite,
        numberOfemp, industry, GstNum, searchCount, PanNum, profile,
        isIndividualEmployer, TanNum, // Add new fields
        // New cascading dropdown fields
        industryId, categoryId, jobRoleId
      } = req.body;

      // Validations
      if (!name || name.trim() === '') return res.status(400).json({ error: "Name is required!" });
      if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email!" });
      if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters!" });
      if (!mobile || mobile.toString().trim() === '') return res.status(400).json({ error: "Mobile number is required!" });
      if (!CompanyName || CompanyName.trim() === '') return res.status(400).json({ error: "Company name is required!" });
      
      // Validate industry - either legacy string or new ID
      if (!industry && !industryId) {
        return res.status(400).json({ error: "Industry is required!" });
      }

      // Convert mobile to number if it's a string
      const mobileNumber = typeof mobile === 'string' ? parseInt(mobile) : mobile;

      // Validate mobile number format
      if (isNaN(mobileNumber) || mobileNumber.toString().length < 10) {
        return res.status(400).json({ error: "Invalid phone number format!" });
      }

      // Check if mobile or email already exists
      const existingMobile = await employerModel.findOne({ mobile: mobileNumber, isDelete: false });
      if (existingMobile) return res.status(400).json({ error: "Mobile number already exists!" });

      const existingEmail = await employerModel.findOne({ email, isDelete: false });
      if (existingEmail) return res.status(400).json({ error: "Email ID already exists!" });

      // Validate cascading dropdown relationships if provided
      if (industryId || categoryId || jobRoleId) {
        const industryModel = require("../../Model/Admin/jobmanagment/industrymanagment");
        const categoryModel = require("../../Model/Admin/jobmanagment/Category");
        const subCategoryModel = require("../../Model/Admin/jobmanagment/SubCategory");

        // If jobRoleId is provided, validate the entire chain
        if (jobRoleId) {
          if (!categoryId) {
            return res.status(400).json({ 
              error: "Category is required when job role is selected",
              code: "CATEGORY_REQUIRED"
            });
          }
          if (!industryId) {
            return res.status(400).json({ 
              error: "Industry is required when job role is selected",
              code: "INDUSTRY_REQUIRED"
            });
          }

          // Verify job role exists
          const jobRole = await subCategoryModel.findById(jobRoleId);
          if (!jobRole) {
            return res.status(400).json({ 
              error: "Invalid job role selected",
              code: "INVALID_JOB_ROLE"
            });
          }

          // Verify job role belongs to selected category
          if (jobRole.categoryId.toString() !== categoryId) {
            return res.status(400).json({ 
              error: "Selected job role does not belong to the selected category",
              code: "JOB_ROLE_CATEGORY_MISMATCH"
            });
          }

          // Verify job role belongs to selected industry
          if (jobRole.industryId.toString() !== industryId) {
            return res.status(400).json({ 
              error: "Selected job role does not belong to the selected industry",
              code: "JOB_ROLE_INDUSTRY_MISMATCH"
            });
          }
        }

        // If categoryId is provided, validate it belongs to industry
        if (categoryId && industryId) {
          const category = await categoryModel.findById(categoryId);
          if (!category) {
            return res.status(400).json({ 
              error: "Invalid category selected",
              code: "INVALID_CATEGORY"
            });
          }

          if (category.industryId.toString() !== industryId) {
            return res.status(400).json({ 
              error: "Selected category does not belong to the selected industry",
              code: "CATEGORY_INDUSTRY_MISMATCH"
            });
          }
        }

        // Verify industry exists
        if (industryId) {
          const industryDoc = await industryModel.findById(industryId);
          if (!industryDoc) {
            return res.status(400).json({ 
              error: "Invalid industry selected",
              code: "INVALID_INDUSTRY"
            });
          }
        }
      }

      // Document validation using DocumentValidationService
      const documentValidator = new DocumentValidationService();

      // Conditional validation based on employer type
      if (isIndividualEmployer) {
        // For individual employers: PAN is required, TAN is optional, GST not required
        if (!PanNum || PanNum.trim() === '') {
          return res.status(400).json({ 
            error: "PAN number is required for individual employer registration",
            code: "PAN_REQUIRED"
          });
        }

        const panValidation = documentValidator.validatePanNumber(PanNum);
        if (!panValidation.isValid) {
          return res.status(400).json({ 
            error: panValidation.error,
            code: panValidation.code 
          });
        }

        // TAN validation - optional but validate format if provided
        if (TanNum && TanNum.trim() !== '') {
          const tanValidation = documentValidator.validateTanNumber(TanNum);
          if (!tanValidation.isValid) {
            return res.status(400).json({ 
              error: tanValidation.error,
              code: tanValidation.code 
            });
          }
        }
      } else {
        // For company/organization employers: GST or PAN required
        if ((!GstNum || GstNum.trim() === '') && (!PanNum || PanNum.trim() === '')) {
          return res.status(400).json({ 
            error: "Either GST number or PAN number is required for employer registration",
            code: "DOCUMENT_REQUIRED"
          });
        }

        // GST Validation - if provided
        if (GstNum && GstNum.trim() !== '') {
          const gstValidation = documentValidator.validateGstNumber(GstNum);
          if (!gstValidation.isValid) {
            return res.status(400).json({ 
              error: gstValidation.error,
              code: gstValidation.code 
            });
          }
        }

        // PAN Validation - if provided
        if (PanNum && PanNum.trim() !== '') {
          const panValidation = documentValidator.validatePanNumber(PanNum);
          if (!panValidation.isValid) {
            return res.status(400).json({ 
              error: panValidation.error,
              code: panValidation.code 
            });
          }
        }
      }

      // Password hashing
      let hashedPassword;

      try {
        hashedPassword = await bcrypt.hash(password, 10);
      } catch (hashError) {
        console.error("Password Hashing Error:", hashError);
        return res.status(500).json({ error: "Failed to encrypt password" });
      }

      // Prepare employer data with defaults for optional fields
      const employerData = {
        mobile: mobileNumber,
        age: age && age !== '' ? parseInt(age) : 25, // Default age if not provided
        name,
        email,
        password: hashedPassword,
        gender: gender && gender !== '' ? gender : 'Other', // Default gender if not provided
        CompanyName,
        // New cascading fields
        industryId: industryId || null,
        categoryId: categoryId || null,
        jobRoleId: jobRoleId || null,
        // Legacy field
        industry,
        street: street || '',
        city: city || '',
        state: state || '',
        pincode: pincode || null,
        country: country || '',
        address: address || '',
        hiring: hiring || false,
        MyCompany: MyCompany || false,
        companyWebsite: companyWebsite || '',
        numberOfemp: numberOfemp || null,
        GstNum: isIndividualEmployer ? '' : (GstNum || ''), // Empty for individual employers
        PanNum: PanNum || '',
        TanNum: isIndividualEmployer ? (TanNum || '') : '', // Only for individual employers
        isIndividualEmployer: isIndividualEmployer || false, // Add individual employer flag
        searchCount: searchCount || 0,
        EmployerImg: profile || '',
        isApproved: false,
        status: 'Pending'
      };

      // Create new employer
      const newEmployer = await employerModel.create(employerData);

      // Send welcome email
      try {
        await send.sendMail(name, email, `Welcome to Labor Link!<br><h3>Your account is pending approval. You will be notified once approved.<br><br>Thank you,<br>Labor Link Team</h3>`);
      } catch (mailError) {
        console.error("Email Sending Error:", mailError);
      }

      // Send WhatsApp notification
      try {
        await send.sendUserRegisteredWhatsapp({
          name: name,
          mobile: mobileNumber.toString()
        });
        console.log("WhatsApp welcome message sent successfully");
      } catch (whatsappError) {
        console.error("Failed to send WhatsApp message:", whatsappError);
      }

      // Return success response with user data (excluding sensitive info)
      return res.status(200).json({
        success: true,
        message: "Successfully registered! Your account is pending approval.",
        userData: {
          _id: newEmployer._id,
          name: newEmployer.name,
          email: newEmployer.email,
          mobile: newEmployer.mobile,
          CompanyName: newEmployer.CompanyName,
          industry: newEmployer.industry,
          isApproved: newEmployer.isApproved,
          status: newEmployer.status
        }
      });

    } catch (err) {
      console.error("Error in registerEmployer:", err);

      // Handle mongoose validation errors
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ error: "Validation error", details: errors });
      }

      // Handle duplicate key errors
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({ error: `${field} already exists!` });
      }

      return res.status(500).json({ error: "Internal server error", details: err.message });
    }
  }

  // Update Employer Image
  async UpdateEmployerImg(req, res) {
    try {
      const { userId } = req.params;
      console.log(userId, "this is employer id");

      const obj = {};

      // Handle file upload
      if (req.file) {
        console.log(req.file);
        obj.EmployerImg = await uploadFile2(req.file, "employer");
      } else {
        console.log("No EmployerImg file uploaded");
      }

      // Map all other profile fields from req.body
      const allowedFields = [
        'CompanyName', 'MyCompany', 'CompanyInd', 'companyWebsite',
        'companyWebsiteclient', 'numberOfemp', 'industry', 'address',
        'name', 'email', 'mobile', 'age', 'gender', 'country',
        'street', 'city', 'state', 'pincode', 'skillSet', 'hiring',
        'userName',
      ];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== '') {
          obj[field] = req.body[field];
        }
      });

      const updatedUser = await employerModel.findOneAndUpdate(
        { _id: userId },
        { $set: obj },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(400).json({ error: "User not found or update failed!" });
      }

      return res.status(200).json({
        success: "User updated successfully",
        data: updatedUser,
      });
    } catch (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Get Employer Profile
  async getEmployerProfile(req, res) {
    try {
      let { employerId } = req.params;

      if (!employerId) {
        return res.status(400).json({ message: "Employer ID is required" });
      }

      employerId = employerId.trim();

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

  // Get Jobs by Employer
  async getJobsByEmployer(req, res) {
    try {
      const { employerId } = req.params;
      console.log(employerId, "this is employer ID");

      // Validate employerId
      if (!mongoose.Types.ObjectId.isValid(employerId)) {
        return res.status(400).json({ error: "Invalid employer ID" });
      }

      // Find jobs where employerId matches
      const jobs = await jobModel.find({ employerId });
      const jobIds = jobs.map(job => job._id);

      // Count total applications for these jobs
      const applicationCount = await applyModel.countDocuments({
        companyId: { $in: jobIds },
        isDelete: false
      });

      return res.status(200).json({
        success: true,
        employerId,
        jobCount: jobs.length,
        applicationCount,
        jobs,
      });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return res.status(500).json({ error: "Internal server error", details: error.message });
    }
  }

  // Edit Profile
  async editProfile(req, res) {
    try {
      const { userId, hiring, MyCompany, CompanyInd, companyWebsite, companyWebsiteclient,
        numberOfemp, CompanydocType, Companydoc, address, EmployerdocType, Employerdoc,
        CompanyName, cpassword, country, industry, mobile, age, password, userName,
        name, skillSet, email, street, city, state, pincode, gender } = req.body;

      let obj = {};

      // Basic validations and field assignments
      if (MyCompany) obj["MyCompany"] = MyCompany;
      if (CompanyInd) obj["CompanyInd"] = CompanyInd;
      if (CompanyName) obj["CompanyName"] = CompanyName;
      if (companyWebsite) obj["companyWebsite"] = companyWebsite;
      if (companyWebsiteclient) obj["companyWebsiteclient"] = companyWebsiteclient;
      if (numberOfemp) obj["numberOfemp"] = numberOfemp;
      if (CompanydocType) {
        obj["CompanydocType"] = CompanydocType;
        obj["status"] = "unVerified";
      }
      if (EmployerdocType) {
        obj["EmployerdocType"] = EmployerdocType;
        obj["status"] = "unVerified";
      }

      // Mobile validation
      if (mobile) {
        if (!phonenumber(mobile)) return res.status(400).json({ error: "Invalid phone number!" });
        obj['mobile'] = mobile;
      }

      // Industry validation
      if (industry) {
        if (!industry) return res.status(400).json({ error: "Please select the category!" });
        obj['industry'] = industry;
      }

      // Address validation
      if (address) {
        if (!address) return res.status(400).json({ error: "Please enter the address!" });
        obj['address'] = address;
      }

      // Email validation
      if (email) {
        if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email!" });
        obj['email'] = email;
      }

      // Name validation
      if (name) {
        if (!isValidString(name)) return res.status(400).json({ error: "Name should be alphabets minimum size 3-25!" });
        obj['name'] = name;
      }

      if (hiring) obj["hiring"] = hiring;
      if (age) obj['age'] = age;
      if (gender) obj['gender'] = gender;
      if (country) obj['country'] = country;

      // Username validation
      if (userName) {
        let check3 = await employerModel.findOne({ userName: userName, isDelete: false });
        if (check3) return res.status(400).json({ error: "try to different user name" });
        obj["userName"] = userName;
      }

      // Address components
      if (street) obj['street'] = street;
      if (city) obj['city'] = city;
      if (state) obj['state'] = state;

      // Pincode validation
      if (pincode) {
        if (!/^[0-9]{6}$/.test(pincode)) return res.status(400).send({ error: "Invalid pin code" });
        obj['pincode'] = pincode;
      }

      if (skillSet) obj['skillSet'] = skillSet;

      // Password validation and hashing
      if (password) {
        if (password !== cpassword) {
          return res.status(400).json({ error: "Password did not match!" });
        }
        let encryptedPassword = bcrypt.hash(password, saltRounds)
          .then((hash) => hash);
        let pwd = await encryptedPassword;
        obj["password"] = pwd;
      }

      // File uploads handling
      if (req.files.length != 0) {
        let arr = req.files;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].fieldname == "profile") {
            obj["profile"] = arr[i].filename;
          }
          if (arr[i].fieldname == "backgroundImage") {
            obj["backgroundImage"] = arr[i].filename;
          }
          if (arr[i].fieldname == "Companydoc") {
            obj["Companydoc"] = arr[i].filename;
            obj["status"] = "unVerified";
          }
          if (arr[i].fieldname == "Employerdoc") {
            obj["Employerdoc"] = arr[i].filename;
            obj["status"] = "unVerified";
          }
        }
      }

      let updateUser = await employerModel.findOneAndUpdate(
        { _id: userId },
        { $set: obj },
        { new: true }
      );

      if (!updateUser) return res.status(400).json({ error: "Something went wrong" });
      return res.status(200).json({ msg: "Successfully updated", success: updateUser });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Add Education
  async AddEducation(req, res) {
    try {
      const { Institue, userId, Course, field, starting, passOut } = req.body;
      let obj = { Institue, Course, field, starting, passOut };

      let add = await employerModel.findOneAndUpdate(
        { _id: userId },
        { $push: { education: obj } },
        { new: true }
      );

      if (!add) return res.status(400).json({ success: "Something went wrong" });
      return res.status(200).json({ success: "Successfully added" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Remove Education
  async removeEducation(req, res) {
    try {
      let removeId = req.params.removeId;
      let userId = req.params.userId;

      let add = await employerModel.findOneAndUpdate(
        { _id: userId },
        { $pull: { education: { _id: removeId } } },
        { new: true }
      );

      if (!add) return res.status(400).json({ success: "Something went wrong" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Add Work Experience
  async addWorkExperience(req, res) {
    try {
      const { Company, userId, Period, Skill, Experience } = req.body;
      let obj = { Company, Period, Skill, Experience };

      let add = await employerModel.findOneAndUpdate(
        { _id: userId },
        { $push: { workAndExperience: obj } },
        { new: true }
      );

      if (!add) return res.status(400).json({ success: "Something went wrong" });
      return res.status(200).json({ success: add });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Remove Work Experience
  async removeWorkExperience(req, res) {
    try {
      let removeId = req.params.removeId;
      let userId = req.params.userId;

      let add = await employerModel.findOneAndUpdate(
        { _id: userId },
        { $pull: { workAndExperience: { _id: removeId } } },
        { new: true }
      );

      if (!add) return res.status(400).json({ success: "Something went wrong" });
      return res.status(200).json({ success: add });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get All Profiles
  async getAllProfile(req, res) {
    try {
      let findData = await employerModel.find().sort({ _id: -1 }).limit(25);

      if (findData.length <= 0) return res.status(400).json({ success: "Data not found" });
      return res.status(200).json({ success: findData });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get Individual Employers Only
  async getIndividualEmployers(req, res) {
    try {
      // Find only employers where isIndividualEmployer is true
      let individualEmployers = await employerModel.find({ 
        isIndividualEmployer: true,
        isDelete: false // Exclude deleted employers
      }).sort({ _id: -1 });

      if (individualEmployers.length <= 0) {
        return res.status(200).json({ 
          success: true,
          message: "No individual employers found",
          data: []
        });
      }

      return res.status(200).json({ 
        success: true,
        count: individualEmployers.length,
        data: individualEmployers 
      });
    } catch (err) {
      console.error("Error fetching individual employers:", err);
      return res.status(500).json({ 
        success: false,
        error: "Internal server error" 
      });
    }
  }

  // Toggle Employer Approval
  async toggleEmployerApproval(req, res) {
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

  // Employer Login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      console.log("Login attempt:", email, password);

      if (!isValid(email)) return res.status(400).json({ success: "Please enter your email!" });
      if (!isValid(password)) return res.status(400).json({ success: "Please enter your password!" });

      let hash;
      if (!phonenumber(email)) {
        hash = await employerModel.findOne({ email: email, isDelete: false });
      } else {
        hash = await employerModel.findOne({ mobile: email, isDelete: false });
      }

      if (!hash) return res.status(400).json({ success: "Please enter registered ID!" });

      let compare = await bcrypt.compare(password, hash.password);
      if (!compare) return res.status(400).send({ success: "Invalid password!" });

      let updateData = await employerModel.findOneAndUpdate(
        { _id: hash._id },
        { $set: { online: "online" } },
        { new: true }
      );

      return res.status(200).json({ msg: "Successfully login", success: updateData });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Delete Profile
  async deleteProfile(req, res) {
    try {
      const { userId, reasion } = req.body;

      let data = await employerModel.findOneAndUpdate(
        { _id: userId },
        { $set: { reasion: reasion, isDelete: true } },
        { new: true }
      );

      if (!data) return res.status(404).json({ success: "data not found" });

      let company = await companyModel.find({ employerId: userId });
      if (company.length !== 0) {
        for (let i = 0; i < company.length; i++) {
          await applyModel.deleteMany({ companyId: company[i]._id });
          await companyModel.deleteOne({ _id: company[i]._id });
        }
      }

      await intrestedModel.deleteMany({ employedId: userId });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async callinterview(req, res) {
    try {
      const {
        userId, schedule, slotId, status, employerId, feedback,
        Position, name, meetingPassword, meetingLink, email,
        companyId, platform, interviewNotes, duration,
        interviewDate, interviewTime, interviewLocation   // new fields from JobApplications screen
      } = req.body;

      console.log("Request body:", req.body);

      // Check if slotId exists in request body
      if (slotId) {
        console.log("SlotId exists:", slotId);

        // Validate required fields when slotId is provided
        if (!userId || !schedule || !slotId || !employerId || !email || !companyId) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const slot = await Appointment.findById(slotId);
        if (!slot) {
          return res.status(404).json({ error: "Appointment slot not found" });
        }

        if (slot.status === "booked") {
          return res.status(400).json({ error: "Slot already booked" });
        }

        slot.status = "booked";
        await slot.save();
      } else {
        // Validate required fields when no slotId is provided
        // schedule can be derived from interviewDate+interviewTime if not provided directly
        const hasSchedule = schedule || (interviewDate && interviewTime);
        if (!userId || !hasSchedule || !employerId || !companyId) {
          return res.status(400).json({ error: "Missing required fields: userId, schedule (or interviewDate+interviewTime), employerId, companyId" });
        }
        // email is required — fall back to user's email fetched below if not sent
      }

      const companyObjectId = mongoose.Types.ObjectId.isValid(companyId)
        ? new mongoose.Types.ObjectId(companyId)
        : companyId;

      const userData = await userModel.findById(userId);
      if (!userData) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check application status before scheduling interview
      const applyModel = require("../../Model/Employers/apply");
      const application = await applyModel.findOne({
        userId: userId,
        companyId: companyObjectId
      });

      console.log('🔍 Looking for application:', { userId, companyId: companyObjectId });

      if (!application) {
        console.log('❌ Application not found');
        return res.status(404).json({ error: "Application not found. Candidate must apply first." });
      }
      
      console.log('✅ Application found:', {
        _id: application._id,
        userId: application.userId,
        companyId: application.companyId,
        status: application.status,
        applicationStatus: application.applicationStatus,
        createdAt: application.createdAt
      });

      // Log application status for debugging
      console.log('📋 Application found:', {
        userId: application.userId,
        companyId: application.companyId,
        status: application.status,
        applicationStatus: application.applicationStatus
      });

      // Allow scheduling for Shortlisted or Applied candidates
      const allowedStatuses = ["Shortlisted", "Applied"];
      if (!allowedStatuses.includes(application.status)) {
        console.log(`❌ Cannot schedule - Status is "${application.status}", expected "Shortlisted" or "Applied"`);
        
        if (application.status === "Scheduled") {
          return res.status(400).json({ error: "Interview already scheduled for this candidate" });
        }
        if (application.status === "Selected") {
          return res.status(400).json({ error: "Cannot schedule interview - Candidate already selected" });
        }
        if (application.status === "Rejected") {
          return res.status(400).json({ error: "Cannot schedule interview - Application already rejected" });
        }
        return res.status(400).json({ 
          error: `Cannot schedule interview - Application status is "${application.status}".`,
          currentStatus: application.status,
          expectedStatus: "Shortlisted or Applied"
        });
      }
      
      console.log('✅ Application status verified - proceeding with interview scheduling');

      // Check if the interview call already exists
      let existingCall = await callModel.findOne({
        userId,
        employerId,
        companyId: companyObjectId
      });

      if (existingCall) {
        return res.status(200).json({
          user: userData,
          success: "Interview call already scheduled!"
        });
      }

      // Fetch job details to get position if not provided
      let jobPosition = Position;
      if (!jobPosition) {
        try {
          const job = await jobModel.findById(companyObjectId).select('jobtitle jobProfile');
          if (job) {
            jobPosition = job.jobtitle || job.jobProfile || 'Position not specified';
          }
        } catch (err) {
          console.log('Could not fetch job details for position:', err);
        }
      }

      // Resolve schedule date — support both ISO string and interviewDate+interviewTime
      let resolvedSchedule = schedule;
      if (!resolvedSchedule && interviewDate && interviewTime) {
        // Parse "DD/MM/YYYY" + "HH:MM AM/PM" into a Date
        try {
          const [day, month, year] = interviewDate.split('/');
          resolvedSchedule = new Date(`${year}-${month}-${day} ${interviewTime}`);
          if (isNaN(resolvedSchedule.getTime())) {
            resolvedSchedule = new Date(); // fallback to now if parse fails
          }
        } catch (e) {
          resolvedSchedule = new Date();
        }
      }

      // Resolve email — use provided email or fall back to user's email
      const resolvedEmail = email || userData.email || '';

      // Subscription validation is now handled by middleware

      // Create a new interview call
      let newCall = await callModel.create({
        employerId,
        userId,
        schedule: resolvedSchedule,
        status: status || "Scheduled",
        name: name || userData.fullName || userData.name || '',
        email: resolvedEmail,
        companyId: companyObjectId,
        platform: platform || interviewLocation || "Not Specified",
        meetingPassword: meetingPassword || "",
        meetingLink: meetingLink || interviewLocation || "",
        interviewNotes: interviewNotes || "",
        duration: slotId
          ? (await Appointment.findById(slotId))?.duration || duration || "30"
          : (duration || "30"),
        feedback,
        Position: jobPosition,
        interviewDate: interviewDate || (resolvedSchedule ? new Date(resolvedSchedule).toLocaleDateString('en-GB') : ''),
        interviewTime: interviewTime || (resolvedSchedule ? new Date(resolvedSchedule).toLocaleTimeString() : ''),
        interviewLocation: interviewLocation || meetingLink || "",
      });

      if (!newCall) {
        return res.status(500).json({ error: "Failed to schedule interview call" });
      }

      console.log("Interview Call Created:", newCall);

      // Update application status to "Scheduled"
      try {
        await applyModel.findOneAndUpdate(
          { 
            userId: userId, 
            companyId: companyObjectId 
          },
          { 
            status: "Scheduled" 
          }
        );
        console.log("Application status updated to Scheduled");
      } catch (updateError) {
        console.error("Error updating application status:", updateError);
      }

      // Record interview slot usage for employer
      try {
        if (employerId) {
          const SubscriptionUsageService = require("../../services/subscriptionUsageService");
          await SubscriptionUsageService.recordUsage(String(employerId), 'interview_schedule_employer', { endpoint: 'callinterview', companyId: String(companyObjectId), candidateId: String(userId) });
        }
      } catch (recErr) {
        console.log('Warning: could not record interview_schedule_employer usage:', recErr?.message || recErr);
      }

      // Prepare common interview details
      let interviewDetails = '';
      let whatsappDetails = {};

      if (slotId) {
        const slot = await Appointment.findById(slotId);
        interviewDetails = `You are shortlisted for an interview.<br>
      <strong>Date:</strong> ${slot.date.toDateString()}<br>
      <strong>Time:</strong> ${slot.time}<br>
      <strong>Duration:</strong> ${slot.duration}<br>
      <strong>Platform:</strong> ${platform || "Not Specified"}<br>
      <strong>Platform Link:</strong> ${meetingLink || "Not Specified"}<br>
      <strong>Platform Password:</strong> ${meetingPassword || "Not Required"}<br>
      <strong>Note:</strong> ${interviewNotes || "Not Required"}<br>
      <h3>Thank you,<br>Labor Link Team</h3>`;

        whatsappDetails = {
          Date: slot.date.toDateString(),
          Time: slot.time,
          Duration: slot.duration,
          Platform: platform || "Not Specified",
          Link: meetingLink || "Not Specified",
          Password: meetingPassword || "Not Required",
          Note: interviewNotes || "Not Required",
        }

      } else {
        const interviewDate = new Date(schedule);
        interviewDetails = `You are shortlisted for an interview.<br>
      <strong>Date:</strong> ${interviewDate.toDateString()}<br>
      <strong>Time:</strong> ${interviewDate.toTimeString().split(" ")[0]}<br>
      <strong>Duration:</strong> ${duration} minutes<br>
      <strong>Platform:</strong> ${platform || "Not Specified"}<br>
      <strong>Platform Link:</strong> ${meetingLink || "Not Specified"}<br>
      <strong>Platform Password:</strong> ${meetingPassword || "Not Required"}<br>
      <strong>Note:</strong> ${interviewNotes || "Not Specified"}<br>
      <h3>Thank you,<br>Labor Link Team</h3>`;

        whatsappDetails = {
          Date: interviewDate.toDateString(),
          Time: interviewDate.toTimeString().split(" ")[0],
          Duration: `${duration} minutes`,
          Platform: platform || "Not Specified",
          Link: meetingLink || "Not Specified",
          Password: meetingPassword || "Not Required",
          Note: interviewNotes || "Not Required",
        }
      }

      // Send notifications
      try {
        // Send email
        await send.sendMail(name, email, interviewDetails);

        // Send WhatsApp notification
        if (userData.phone) {
          await send.sendInterviewDetails(
            name,
            userData.phone,
            whatsappDetails?.Date,
            whatsappDetails?.Time,
            whatsappDetails?.Duration,
            whatsappDetails.Platform,
            whatsappDetails.Link,
            whatsappDetails?.Password,
            whatsappDetails?.Note
          );
        }
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError);
      }

      // Send SMS notification
      try {
        console.log("=== SMS SENDING DEBUG ===");
        console.log("userData.phone:", userData.phone);
        console.log("name:", name);
        console.log("Position:", Position);
        console.log("whatsappDetails:", whatsappDetails);

        if (userData.phone) {
          const smsMessage = `Hi ${name} Your interview for ${Position || 'the position'} is scheduled on ${whatsappDetails?.Date} at ${whatsappDetails?.Time} - Labor Link`;

          console.log("SMS Message to be sent:", smsMessage);
          console.log("Phone number:", userData.phone);

          const smsResult = await send.sendInterviewDetailsSMS(userData.phone, name, userData.Position, whatsappDetails?.Date, whatsappDetails?.Time,);
          console.log("SMS API Response:", smsResult);
          console.log("SMS sent successfully");
        } else {
          console.log("No phone number found for user");
        }
      } catch (smsError) {
        console.error("=== SMS ERROR ===");
        console.error("SMS Error Details:", smsError);
        console.error("SMS Error Message:", smsError.message);
        console.error("SMS Error Response:", smsError.response?.data);
        console.error("SMS Error Status:", smsError.response?.status);
      }

      return res.status(201).json({
        success: "Interview scheduled successfully",
        userData
      });

    } catch (error) {
      console.error("Error scheduling interview:", error);
      return res.status(500).json({
        message: "Internal Server Error",
        error: error.message
      });
    }
  }
  // Get Scheduled Interviews 
  async getcallinterview(req, res) {
    try {
      const { employerId, companyId } = req.params;

      if (!employerId) {
        return res.status(400).json({ error: "Employer ID is required" });
      }

      // Get all interview calls for this employer and company
      let interviewCalls = await callModel.find({ employerId, companyId })
        .populate("userId", "fullName name email")
        .sort({ _id: -1 });

      if (!interviewCalls.length) {
        return res.status(200).json({ success: true, data: [], message: "No interview calls found" });
      }

      const applyModel = require("../../Model/Employers/apply");
      const result = [];

      for (const interview of interviewCalls) {
        const interviewData = interview.toObject();

        // Resolve candidate name
        let candidateName = 'No Name';
        if (interviewData.userId) {
          candidateName = interviewData.userId.fullName ||
                          interviewData.userId.name ||
                          interviewData.name ||
                          'No Name';
        }
        interviewData.fullName = candidateName;
        interviewData.name     = candidateName;

        // Attach latest application status so the frontend can show Selected/Rejected badges
        // but NEVER hide the card — all scheduled interviews stay visible
        const application = await applyModel.findOne({
          userId:    interview.userId?._id || interview.userId,
          companyId: companyId
        });
        interviewData.applicationStatus = application?.status || interview.status || 'Scheduled';

        // Keep userId as plain ID
        if (interviewData.userId && typeof interviewData.userId === 'object') {
          interviewData.userId = interviewData.userId._id;
        }

        // Remove email for privacy
        delete interviewData.email;

        result.push(interviewData);
      }

      return res.status(200).json({ success: true, data: result });

    } catch (error) {
      console.error("Error fetching interview calls:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Get All Scheduled Interviews
  async getAllScheduledInterviews(req, res) {
    try {
      // Admin view: fetch ALL interviews regardless of status
      const interviews = await callModel.find({})
        .populate("userId", "name email fullName")
        .populate("companyId", "jobtitle jobProfile")
        .sort({ schedule: -1 }); // Sort by schedule date, latest first (descending)

      if (!interviews || interviews.length === 0) {
        return res.status(200).json({
          success: true,
          interviews: [],
          message: "No interviews found."
        });
      }

      // Import models for manual lookup if needed
      const userModel = require('../../Model/User/user');
      const jobModel = require('../../Model/Employers/company');

      // Format the response to include candidate name and job position
      const formattedInterviews = await Promise.all(interviews.map(async (interview) => {
        let candidateName = 'No Name';
        
        // Try to get name from populated userId
        if (interview.userId && typeof interview.userId === 'object') {
          candidateName = interview.userId.fullName || interview.userId.name || 'No Name';
        } 
        // If userId is still a string (old data), manually fetch user
        else if (interview.userId && typeof interview.userId === 'string') {
          try {
            const user = await userModel.findById(interview.userId).select('name email fullName');
            if (user) {
              candidateName = user.fullName || user.name || 'No Name';
            }
          } catch (err) {
            console.log('Could not fetch user for userId:', interview.userId);
          }
        }
        
        // Get job position
        let jobPosition = interview.Position || 'Position not specified';
        
        // Try to get from populated companyId
        if (interview.companyId && typeof interview.companyId === 'object') {
          jobPosition = interview.companyId.jobtitle || interview.companyId.jobProfile || jobPosition;
        }
        // If companyId is a string (old data), manually fetch job
        else if (interview.companyId && typeof interview.companyId === 'string') {
          try {
            const job = await jobModel.findById(interview.companyId).select('jobtitle jobProfile');
            if (job) {
              jobPosition = job.jobtitle || job.jobProfile || jobPosition;
            }
          } catch (err) {
            console.log('Could not fetch job for companyId:', interview.companyId);
          }
        }
        
        return {
          ...interview.toObject(),
          fullName: candidateName, // Frontend expects fullName
          name: candidateName, // Also set name for compatibility
          Position: jobPosition
          // Email removed completely for privacy
        };
      }));

      res.status(200).json({
        success: true,
        interviews: formattedInterviews,
      });
    } catch (error) {
      console.error("Error fetching scheduled interviews:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }

  // Update Interview Status
  // async updateInterviewStatus(req, res) {
  //     try {
  //       const { interviewId } = req.params;
  //       console.log(interviewId, "this is an interview id ");
  //       const { status } = req.body;

  //       // Find and update the interview status
  //       const updatedInterview = await applyModel.findByIdAndUpdate(
  //         interviewId,
  //         { status: status },
  //         { new: true }
  //       );

  //       if (!updatedInterview) {
  //         return res.status(404).json({
  //           success: false,
  //           message: 'Interview not found'
  //         });
  //       }

  //       res.status(200).json({
  //         success: true,
  //         message: 'Interview status updated successfully',
  //         data: updatedInterview
  //       });

  //     } catch (error) {
  //       console.error('Error updating interview status:', error);
  //       res.status(500).json({
  //         success: false,
  //         message: 'Failed to update interview status',
  //         error: error.message
  //       });
  //     }
  //   }   

  // Update Interview Status
  async updateInterviewStatus(req, res) {
    try {
      const { interviewId } = req.params;
      console.log(interviewId, "this is an interview id ");
      const { status } = req.body;

      // Find and update the interview status
      const updatedInterview = await applyModel.findByIdAndUpdate(
        interviewId,
        { status: status },
        { new: true }
      ).populate('userId', 'name', 'phone'); // Populate user data for WhatsApp

      if (!updatedInterview) {
        return res.status(404).json({
          success: false,
          message: 'Interview not found'
        });
      }

      // Send WhatsApp notification if rejected
      if (status === 'Rejected' || status === 'rejected') {
        try {
          const user = updatedInterview.userId;
          const rejectionMessage = `Your application has been rejected. Thank you for your interest.`;

          await sendRejectedWhatsapp(
            user.name || 'Applicant',
            user.phone,
            rejectionMessage
          );
        } catch (whatsappError) {
          console.error('WhatsApp notification failed:', whatsappError);
          // Don't fail the whole request if WhatsApp fails
        }
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
  }

  // Update Interview Schedule Status
  async updateInterviewScheduleStatus(req, res) {
    try {
      const { interviewId } = req.params;
      console.log(interviewId, "this is an interview schedule id");
      const { status } = req.body;

      // Find and update the interview schedule status
      const updatedInterview = await callModel.findByIdAndUpdate(
        interviewId,
        { status: status },
        { new: true }
      );

      if (!updatedInterview) {
        return res.status(404).json({
          success: false,
          message: 'Interview schedule not found'
        });
      }

      // If status is Selected or Rejected, also update the application status
      if (status === 'Selected' || status === 'Rejected') {
        try {
          await applyModel.findOneAndUpdate(
            { 
              userId: updatedInterview.userId,
              companyId: updatedInterview.companyId
            },
            { status: status },
            { new: true }
          );
        } catch (appError) {
          console.error('Error updating application status:', appError);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Interview schedule status updated successfully',
        data: updatedInterview
      });

    } catch (error) {
      console.error('Error updating interview schedule status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update interview schedule status',
        error: error.message
      });
    }
  }

  async getUserByFilter(req, res) {
    try {
      const { skill, Experience, city, category, jobProfile, int1 } = req.body;
      let obj = {};

      if (jobProfile) {
        obj['industry'] = jobProfile;
      }

      let findData = await userModel.find(obj).sort({ _id: -1 });
      if (findData.length <= 0) return res.status(400).json({ success: "Data not found" });
      return res.status(200).json({ success: findData });

    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Mark User as Interested
  async MakeIntrestedUser(req, res) {
    try {
      const { userId, employedId, userEmail, userName, EmployeName, email, mobile } = req.body;

      let check1 = await intrestedModel.findOne({ userId: userId, employedId: employedId });
      if (!check1) {
        let data = await intrestedModel.create({ employedId: employedId, userId: userId });

        if (!data) return res.status(400).json({ error: "Data not found" });

        send.sendMail(
          userName,
          userEmail,
          `Mr ${EmployeName} is interested in your profile please contact to this ${mobile} and email ${email},
          <h3>Thank you <br>Labor Link Team</h3>`
        );

        return res.status(200).json({ success: "Successfully send notice" });
      } else {
        return res.status(200).json({ success: "Already sent!" });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Verify/Unverify Employer
  async makEverifyUnverify(req, res) {
    try {
      const { userId, status, reasion, isDelete } = req.body;
      let obj = { status };

      obj["reasion"] = reasion;

      if (isDelete) {
        obj["isDelete"] = isDelete;
      }

      let data = await employerModel.findOneAndUpdate(
        { _id: userId },
        { $set: obj },
        { new: true }
      );

      if (!data) return res.status(400).json({ error: "Something went wrong!" });

      if (data.status == "Approved") {
        send.sendMail(
          data.name,
          data.email,
          `Your profile is approved now you can post job,
          <h3>Thank you <br>Labor Link Team</h3>`
        );
      } else {
        send.sendMail(
          data.name,
          data.email,
          `Your profile is ${data.status} because ${data.reasion} please complete your profile,
          <h3>Thank you <br>Labor Link Team</h3>`
        );
      }

      return res.status(200).json({ success: "success" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Block/Unblock Employer
  async makeBlockUnBlock(req, res) {
    try {
      const { userId, reasion, isBlock } = req.body;
      let obj = { isBlock };
      obj["reasion"] = reasion;

      let data = await employerModel.findOneAndUpdate(
        { _id: userId },
        { $set: obj },
        { new: true }
      );

      if (!data) return res.status(400).json({ error: "Something went wrong!" });

      if (data.isBlock == false) {
        send.sendMail(
          data.name,
          data.email,
          `Your profile is un-bloked now you can post job,
          <h3>Thank you <br>Labor Link Team</h3>`
        );
      } else {
        send.sendMail(
          data.name,
          data.email,
          `Your profile is blocked please contact admin,
          <h3>Thank you <br>Labor Link Team</h3>`
        );
      }

      return res.status(200).json({ success: "success" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get Interested Users
  async getInterestedUser(req, res) {
    try {
      let employerId = req.params.employerId;
      console.log(employerId);

      let data = await intrestedModel.find({ employedId: employerId })
        .sort({ _id: -1 })
        .populate("userId");

      if (data.length <= 0) return res.status(400).json({ error: "Data not found" });
      return res.status(200).json({ success: data });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get Employer by ID
  async getEmployerById(req, res) {
    try {
      let employerId = req.params.employerId;
      let data = await employerModel.findById(employerId);

      if (!data) return res.status(400).json({ error: "No data found" });
      return res.status(200).json({ success: data });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Delete Interest by ID
  async deleteIntrestById(req, res) {
    try {
      let intrestId = req.params.intrestId;
      let data = await intrestedModel.deleteOne({ _id: intrestId });

      if (data.deletedCount === 0) return res.status(400).json({ error: "Data not found" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Delete Employer Permanently
  async deleteParmanet(req, res) {
    try {
      let userId = req.params.userId;
      let data = await employerModel.deleteOne({ _id: userId });

      if (data.deletedCount === 0) return res.status(400).json({ error: "Data not found" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Password Reset Email
  async postmail(req, res) {
    try {
      let { email } = req.body;
      if (!isValid(email)) return res.status(400).json({ error: "Please enter email Id!" });

      let data = await employerModel.findOne({ email: email, isDelete: false });

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
          to: email,
          subject: 'Your Labor Link new generated password',
          html: `<h1>Hi ${data.name}</h1><p>Seems like you forgot your password for UNIVI. Your password is :</p> <b> ${newPassword}</b>
         
         
         <p> If you did not initiate this request, please contact us immediately
      at ${process.env.NODE_SENDER_MAIL}</p>
      <h3>Thank you <br>Labor Link Team</h3>`,
        };

        newPassword = bcrypt.hashSync(newPassword, 10);

        let passChange = employerModel.findOneAndUpdate(
          { email: email },
          { $set: { password: newPassword } }
        );

        passChange.exec((err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error updating password" });
          }

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
              return res.status(500).json({ error: "Error sending email" });
            } else {
              console.log('Email sent: ' + info.response);
              return res.status(200).json({ success: "mail send" });
            }
          });
        });
      } else {
        return res.status(400).json({ error: "Email not Register" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Delete Offline Employers

  async deleteOfline(req, res) {
    try {
      let employer = await employerModel.find({ updatedAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 365 * 1000) } });
      if (employer.length !== 0) {
        for (let index = 0; index < employer.length; index++) {
          await employerModel.deleteOne({ _id: employer[index]._id })
          let company = await companyModel.find({ employerId: employer[index]._id });
          if (company.length !== 0) {
            for (let i = 0; i < company.length; i++) {
              await applyModel.deleteMany({ companyId: company[i]._id })
              await companyModel.deleteOne({ _id: company[i]._id })
            }
          }
          console.log("daleted employer name=", employer[index].name)
        }
      }

    } catch (error) {
      console.log(error);
    }
  }


  async checkApprovalStatus(req, res) {
    console.log('=== checkApprovalStatus function called ===');
    const { userId } = req.params; // Extract userId from the request parameters
    console.log('Checking approval status for userId:', userId);

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Validate if userId is a valid MongoDB ObjectId
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID format',
      });
    }

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
      console.error('=== ERROR in checkApprovalStatus ===');
      console.error('Error checking approval status:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }




}

module.exports = new Employers()


