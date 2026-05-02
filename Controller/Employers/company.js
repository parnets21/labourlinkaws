const moment = require("moment");
const mongoose = require("mongoose");
const jobModel = require("../../Model/Employers/company");
const applyModel = require("../../Model/Employers/apply");
const selectModel = require("../../Model/Employers/selected");
const userModel = require("../../Model/User/user");
const send = require("../../EmailSender/send");
const sent = require("../../EmailSender/send");
const { isValid, isValidEmail, phonenumber, validUrl } = require("../../Config/function")
const CompanyType = require("../../Model/Admin/jobmanagment/CompanyType");
const Industry = require("../../Model/Admin/jobmanagment/industrymanagment");
const Department = require("../../Model/Admin/Department")
const JobRole = require("../../Model/Admin/jobmanagment/JobRole")
const Category = require("../../Model/Admin/jobmanagment/Category") // Use new structured Category model
const WorkMode = require("../../Model/Admin/jobmanagment/WorkMode")
const Location = require("../../Model/Admin/comapnaylocation")
const Salary = require("../../Model/Admin/jobmanagment/Salary")
const Education = require("../../Model/Admin/jobmanagment/education")
const ExperienceLevel = require("../../Model/Admin/jobmanagment/ExperienceLevel")
const Skill = require("../../Model/Admin/jobmanagment/Skill");
const { uploadFile2, deleteFile, getPresignedUrl } = require("../../middileware/aws");
const Chefs = require("../../Model/Admin/jobmanagment/Chefs");
const Cuisines = require("../../Model/Admin/jobmanagment/Cuisines");
const user = require("../../Model/User/user");
const admin = require("firebase-admin");
const FCMtoken = require("../../Model/User/FCMtoken");
const SubscriptionUsageService = require("../../services/subscriptionUsageService");
const SubscriptionValidationService = require("../../services/subscriptionValidationService");
const callModel = require("../../Model/Employers/scheduleinterview");
const { validateJobClassification } = require("../../utils/jobClassificationValidator");


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

class company {

  async register(req, res) {
    try {
      console.log("📢 Register API Called");
      console.log("📝 Request Body:", req.body);

      const {
        companyName, jobtitle, averageIncentive, openings, address, email, skill, benefits,
        reason, experience, interview, category, typeofqualification, description,
        typeofjob, typeofwork, typeofeducation, education, experiencerequired,
        gendertype, jobProfile, minSalary, maxSalary, period, location, time,
        whatsapp, adminId, employerId, salarytype, interviewername,
        companywebsite, companymobile, companyindustry, companytype, department,
        companyaddress, requirements, responsibilities, workSchedule, locationDetails,
        preferredQualifications, additionalNotes,
        // New hierarchical classification fields
        industryId, categoryId, subCategoryId
      } = req.body;
      console.log("📥 Received Request Body:", req.body);

      // Validate hierarchical classification if provided
      if (industryId || categoryId || subCategoryId) {
        const validation = await validateJobClassification(industryId, categoryId, subCategoryId);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: "Invalid job classification",
            error: validation.error
          });
        }
      }
let obj = {
        companyName, jobtitle, averageIncentive, openings, address, email, reason,
        experience, interview, period, description, typeofjob, typeofwork,
        typeofeducation, education, experiencerequired, gendertype, jobProfile,
        minSalary, maxSalary, benefits, category, typeofqualification,
        location, time, whatsapp, adminId, employerId, salarytype, interviewername,
        // Added new fields below
        companywebsite, companymobile, companyindustry, companytype, department,
        companyaddress, requirements, responsibilities, workSchedule, locationDetails,
        preferredQualifications, additionalNotes
      };

      // Always ensure skill is stored as an array
      if (typeof skill === 'string') {
        try { obj.skill = JSON.parse(skill); } catch { obj.skill = skill ? [skill] : []; }
      } else {
        obj.skill = Array.isArray(skill) ? skill : [];
      }

      // Add classification fields if provided
      if (industryId) obj.industryId = industryId;
      if (categoryId) obj.categoryId = categoryId;
      if (subCategoryId) obj.subCategoryId = subCategoryId;

      // Handle logo upload to S3
      if (req.files && req.files.length > 0) {
        const logoFile = req.files.find(file => file.fieldname === "logo");
        if (logoFile) {
          try {
            const logoUrl = await uploadFile2(logoFile, "company-logos");
            obj["logo"] = logoUrl;
          } catch (uploadError) {
            console.error("Error uploading logo to S3:", uploadError);
            return res.status(500).json({ success: false, message: "Failed to upload company logo", error: uploadError.message });
          }
        }

        // Handle JD PDF upload
        const jdPdfFile = req.files.find(file => file.fieldname === "jdPdf");
        console.log('📎 Files received:', req.files?.map(f => f.fieldname), 'jdPdfFile:', !!jdPdfFile);
        if (jdPdfFile) {
          try {
            const jdPdfUrl = await uploadFile2(jdPdfFile, "jd-pdfs");
            obj["jdPdf"] = jdPdfUrl;
          } catch (uploadError) {
            console.error("Error uploading JD PDF to S3:", uploadError);
          }
        }

        // Handle business images upload
        const bizImageFiles = req.files.filter(file => file.fieldname === "businessImages");
        if (bizImageFiles.length > 0) {
          try {
            const bizImageUrls = await Promise.all(
              bizImageFiles.map(f => uploadFile2(f, "business-images"))
            );
            obj["businessImages"] = bizImageUrls;
          } catch (uploadError) {
            console.error("Error uploading business images to S3:", uploadError);
          }
        }
      }

      // Save the job in DB
      let newJob;
      try {
        newJob = await jobModel.create(obj);
        console.log("✅ New Job Saved:", newJob);
      } catch (saveError) {
        // If error is due to 2dsphere index, try to drop it and retry
        if (saveError.code === 16755 && saveError.message.includes('geo keys')) {
          console.log('⚠️  Detected geolocation index error, attempting to drop index...');
          try {
            await jobModel.collection.dropIndex('location_2dsphere');
            console.log('✅ Dropped location_2dsphere index, retrying save...');
            newJob = await jobModel.create(obj);
            console.log("✅ New Job Saved after index drop:", newJob);
          } catch (retryError) {
            console.error('❌ Failed to save even after dropping index:', retryError);
            throw retryError;
          }
        } else {
          throw saveError;
        }
      }

      // Record employer usage for post_job (non-blocking)
      try {
        const SubscriptionValidationController = require('../subscriptionValidationController');
        // Reuse recordUsage logic via internal call
        await SubscriptionValidationController.recordUsage({
          body: { userId: employerId, action: 'post_job', metadata: { jobId: newJob._id } }
        }, { status: () => ({ json: () => { } }) });
      } catch (uErr) {
        console.log('Warning: could not record post_job usage:', uErr?.message || uErr);
      }

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
  async registeredjobbyId(req, res) {
    try {
      const { jobId } = req.params;

      // Find job by ID and populate employer details
      const job = await jobModel.findById(jobId).populate("employer", "name email company");

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const jobObj = job.toObject();
      if (jobObj.jdPdf) {
        try { jobObj.jdPdf = await getPresignedUrl(jobObj.jdPdf, 3600); } catch (_) {}
      }

      res.status(200).json(jobObj);
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
        interviewername,
        // New hierarchical classification fields
        industryId,
        categoryId,
        subCategoryId
      } = req.body;

      // Get existing job to check for logo that might need to be deleted
      const existingJob = await jobModel.findById(jobId);
      if (!existingJob) {
        return res.status(404).json({ success: false, message: "Job not found" });
      }

      // Validate hierarchical classification if provided
      if (industryId || categoryId || subCategoryId) {
        const validation = await validateJobClassification(industryId, categoryId, subCategoryId);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: "Invalid job classification",
            error: validation.error
          });
        }
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

      // Add classification fields if provided
      if (industryId !== undefined) obj["industryId"] = industryId;
      if (categoryId !== undefined) obj["categoryId"] = categoryId;
      if (subCategoryId !== undefined) obj["subCategoryId"] = subCategoryId;

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

  async AddSkillJ(req, res) {
    try {
      const { skill, employerId } = req.body;
      let obj = { skill }

      let add = await jobModel.findOneAndUpdate({ employerId: employerId }, { $push: { skillSet: obj } }, { new: true });
      if (!add) return res.status(400).json({ success: "Something went worng" });
      return res.status(200).json({ success: "Successfully added" })
    } catch (err) {
      console.log(err);
    }
  }
  async removeSkillJ(req, res) {
    try {
      let removeId = req.params.removeId;
      let employerId = req.params.employerId;
      let add = await jobModel.findOneAndUpdate({ employerId: employerId }, { $pull: { skillSet: { _id: removeId } } }, { new: true });
      if (!add) return res.status(400).json({ success: "Something went worng" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (err) {
      console.log(err);
    }
  }
  async AddBenefits(req, res) {
    try {
      const { benefits, employerId, level } = req.body;
      let obj = { benefits, level }

      let add = await jobModel.findOneAndUpdate({ employerId: employerId }, { $push: { benefitsSet: obj } }, { new: true });
      if (!add) return res.status(400).json({ success: "Something went worng" });
      return res.status(200).json({ success: "Successfully added" })
    } catch (err) {
      console.log(err);
    }
  }
  async makEverifyUnverify(req, res) {
    try {
      const { userId, status, reasion, isDelete } = req.body;
      let obj = { status }

      obj["reasion"] = reasion

      if (isDelete) {
        obj["isDelete"] = isDelete
      }
      let data = await jobModel.findOneAndUpdate({ _id: userId }, { $set: obj }, { new: true });
      if (!data) return res.status(400).json({ error: "Something went wong!" });
      if (data.status == "Approved") {
        send.sendMail(data.interviewername, data.email, `Your job is approved now,
                <h3>Thank you <br>Labor Link Team</h3>
                `);
      } else {
        send.sendMail(data.interviewername, data.email, `Your job is ${data.status} because ${data.reasion} please wait for admin approval,
                <h3>Thank you <br>Labor Link Team</h3>
                `);
      }
      return res.status(200).json({ success: "success" })
    } catch (error) {
      console.log(error);
    }
  }
  async removeBenefits(req, res) {
    try {
      let removeId = req.params.removeId;
      let employerId = req.params.employerId;
      let add = await jobModel.findOneAndUpdate({ employerId: employerId }, { $pull: { benefitsSet: { _id: removeId } } }, { new: true });
      if (!add) return res.status(400).json({ success: "Something went worng" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (err) {
      console.log(err);
    }
  }


  async getAllJobs(req, res) {
    try {
      const { q, remote, sort, limit, userId } = req.query;

      // Treat it as a billable "search" only when the user applies a query or filters
      const isSearchIntent = (
        (typeof q === 'string' && q.trim().length > 0) ||
        (typeof remote === 'string' && (remote === 'true' || remote === '1')) ||
        (typeof sort === 'string' && sort.trim().length > 0)
      );

      // Optional: validate subscription limits when userId present and user is actually searching
      let remainingBefore;
      let totalLimit;
      let userType = 'employee'; // Default to employee
      let searchAction = 'search_job'; // Default action

      if (userId && isSearchIntent) {
        try {
          // Determine user type by checking both user and employer collections
          const userModel = require('../Model/User/user');
          const EmployerModel = require('../Model/Employers/employers');

          const user = await userModel.findById(userId);
          const employer = await EmployerModel.findById(userId);

          if (employer) {
            userType = 'employer';
            searchAction = 'search_candidates';
          } else if (user) {
            userType = 'employee';
            searchAction = 'search_job';
          }

          console.log(`🔍 User ${userId} is ${userType}, using action: ${searchAction}`);

          const currentUsage = await require("../../services/subscriptionUsageService").getCurrentUsage(userId, 'daily');
          const validation = await SubscriptionValidationService.validateAction(userId, searchAction, currentUsage);
          if (!validation.allowed) {
            const statusCode = validation.upgradeRequired ? 402 : 403;
            return res.status(statusCode).json({
              success: false,
              error: validation.reason || 'Usage limit exceeded',
              upgradeRequired: !!validation.upgradeRequired,
              remainingUsage: validation.remainingUsage || 0
            });
          }
          remainingBefore = validation.remainingUsage;
          totalLimit = validation.totalLimit;

          // Record search usage (non-blocking) only for real search actions
          try {
            const SubscriptionValidationController = require('../subscriptionValidationController');
            await SubscriptionValidationController.recordUsage({
              body: { userId, action: searchAction, metadata: { endpoint: 'getAllJobs', userType } }
            }, { status: () => ({ json: () => { } }) });
          } catch (recErr) {
            console.log(`Warning: could not record ${searchAction} usage:`, recErr?.message || recErr);
          }
        } catch (vErr) {
          // Fail open but restrict results if validation fails unexpectedly
          console.log('Validation error:', vErr?.message || vErr);
        }
      }

      // Build filters
      const filters = { isDelete: false };
      if (q) {
        const regex = new RegExp(q, "i");
        filters.$or = [
          { jobtitle: { $regex: regex } },
          { jobProfile: { $regex: regex } },
          { companyName: { $regex: regex } },
          { location: { $regex: regex } },
          { skill: { $regex: regex } }
        ];
      }
      if (remote === 'true') {
        filters.typeofwork = 'Remote';
      }

      // Sorting
      let sortSpec = { _id: -1 };
      if (sort === 'location') sortSpec = { location: 1 };
      if (sort === 'salary_low_to_high') sortSpec = { minSalary: 1 };
      if (sort === 'salary_high_to_low') sortSpec = { maxSalary: -1 };

      // Query
      let query = jobModel.find(filters)
        .sort(sortSpec)
        .populate("employerId")
        .populate("industryId", "industryName industryId")
        .populate("categoryId", "categoryName categoryId")
        .populate("subCategoryId", "subCategoryName subCategoryId");
      const numericLimit = parseInt(limit, 10);
      if (!isNaN(numericLimit) && numericLimit > 0) {
        query = query.limit(numericLimit);
      }
      // If no userId, apply a conservative cap to support anonymous access
      if (!userId && (isNaN(numericLimit) || numericLimit > 10)) {
        query = query.limit(10);
      }

      const findData = await query.exec();

      // Sign jdPdf URLs so private S3 objects are accessible
      const signedData = await Promise.all(
        findData.map(async (job) => {
          const obj = job.toObject();
          if (obj.jdPdf) {
            try { obj.jdPdf = await getPresignedUrl(obj.jdPdf, 3600); } catch (_) {}
          }
          return obj;
        })
      );

      // Record usage for successful searches only when userId is present
      try {
        const effectiveUserId = req.query.userId || req.params.userId;
        if (effectiveUserId && isSearchIntent) {
          // Use the same userType and searchAction determined earlier
          await SubscriptionUsageService.recordUsage(String(effectiveUserId), searchAction, {
            q: q || '',
            remote: remote === 'true',
            sort: sort || '',
            limit: numericLimit || null,
            userType: userType
          });
          console.log(`📝 Recorded ${searchAction} usage for ${userType} user ${effectiveUserId}`);
        }
      } catch (usageErr) {
        console.log('Search usage record failed:', usageErr?.message || usageErr);
      }

      // Include remaining usage info (estimated post-record)
      let remainingSearches = null;
      if (typeof remainingBefore === 'number') {
        remainingSearches = Math.max(0, (remainingBefore || 0) - 1);
      }

      return res.status(200).json({
        success: true,
        data: signedData,
        meta: {
          remainingSearches,
          totalLimit: typeof totalLimit === 'number' ? totalLimit : null
        }
      });
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
  async getJobByEmployerId(req, res) {
    try {
      let employerId = req.params.employerId
      let data = await jobModel.find({ employerId: employerId });
      return res.status(200).json({ success: data });
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
        // New classification filters
        industryId,
        categoryId,
        subCategoryId
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
      
      // Add classification filters
      if (industryId) {
        obj["industryId"] = industryId;
      }
      if (categoryId) {
        obj["categoryId"] = categoryId;
      }
      if (subCategoryId) {
        obj["subCategoryId"] = subCategoryId;
      }
      
      console.log("swagat nhi karoge hamara", obj)
      if (Object.keys(req.body).length <= 0) {
        let findData = await jobModel
          .find({ isVerify: true })
          .populate("industryId", "industryName industryId")
          .populate("categoryId", "categoryName categoryId")
          .populate("subCategoryId", "subCategoryName subCategoryId")
          .sort({ _id: -1 });
        console.log("A");
        if (findData.length <= 0) return res.status(400).json({ success: "Data not found" });
        return res.status(200).json({ success: findData });
      } else {
        if (Object.keys(obj).length <= 0) {
          let findData = await jobModel
            .find({
              isVerify: true,
            })
            .populate("industryId", "industryName industryId")
            .populate("categoryId", "categoryName categoryId")
            .populate("subCategoryId", "subCategoryName subCategoryId")
            .sort({ _id: -1 });
          console.log("B");
          if (findData.length <= 0)
            return res.status(400).json({ success: "Data not found" });
          return res.status(200).json({ success: findData });
        } else {
          obj["isVerify"] = true
          let findData = await jobModel
            .find(obj)
            .populate("industryId", "industryName industryId")
            .populate("categoryId", "categoryName categoryId")
            .populate("subCategoryId", "subCategoryName subCategoryId")
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
  async makeBlockUnBlock(req, res) {
    try {
      const { userId, reasion, isBlock } = req.body;
      let obj = { isBlock }
      obj["reasion"] = reasion

      let data = await jobModel.findOneAndUpdate({ _id: userId }, { $set: obj }, { new: true });
      if (!data) return res.status(400).json({ error: "Something went wong!" });
      if (data.isBlock == false) {
        send.sendMail(data.interviewername, data.email, `Your job is un-bloked now,
                <h3>Thank you <br>Labor Link Team</h3>
                `);
      } else {
        send.sendMail(data.interviewername, data.email, `Your job is blocked  please contact admin,
                <h3>Thank you <br>Labor Link Team</h3>
                `);
      }
      return res.status(200).json({ success: "success" })
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
      await applyModel.deleteMany({ companyId: jobId })
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (err) {
      console.log(err);
    }
  }
  async getJobById(req, res) {
    try {
      let jobId = req.params.jobId;
      console.log(jobId, "this is jobid")
      let data = await jobModel.findById(jobId)
        .populate("industryId", "industryName industryId")
        .populate("categoryId", "categoryName categoryId")
        .populate("subCategoryId", "subCategoryName subCategoryId");
      if (!data) return res.status(400).json({ success: "data not found" });
      return res.status(200).json({ success: data });
    } catch (err) {
      console.log(err);
    }
  }


  async getApplyList(req, res) {
    try {
      const { jobId } = req.params
      console.log("Received companyId:", jobId, "Type:", typeof jobId);

      // Removed search_candidates validation. Viewing applications for your own job
      // should not be subject to search limits.

      let findData = await applyModel
        .find({ companyId: jobId, isDelete: false }) // Ensure only non-deleted are returned
        .sort({ _id: -1 })
        .populate("userId");

      if (!findData || findData.length === 0) {
        return res.status(200).json({ success: true, data: [], message: "No applications found" });
      }

      // Mask sensitive user data for employer view
      const maskedData = findData.map(application => {
        if (application.userId) {
          // Only show employee name and masked email/phone
          const maskedUserData = maskSensitiveData(application.userId.toObject ? application.userId.toObject() : application.userId);
          const maskedUser = {
            _id: application.userId._id,
            fullName: application.userId.fullName,
            email: maskedUserData.email,
            phone: maskedUserData.phone,
            location: application.userId.location,
            profile: application.userId.profile, // Profile picture
            skills: application.userId.skills || [],
            education: application.userId.education || []
          };
          
          return {
            ...application.toObject(),
            userId: maskedUser
          };
        }
        return application;
      });

      // Record employer candidate search usage if employerId provided (query)
      try {
        const employerId = req.query && req.query.employerId;
        if (employerId) {
          const SubscriptionUsageService = require("../../services/subscriptionUsageService");
          await SubscriptionUsageService.recordUsage(String(employerId), 'search_candidates', { endpoint: 'getApplyList', jobId });
        }
      } catch (recErr) {
        console.log('Warning: could not record candidate search usage:', recErr?.message || recErr);
      }

      return res.status(200).json({ success: true, data: maskedData });
    } catch (err) {
      console.error("Server Error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }

  }




  // async addShortList(req, res) {
  //   try {
  //     const { userId, companyId } = req.body;
  //     console.log("Received request with the rdfjk:", userId, companyId);

  //     let data = await applyModel
  //     .findOne({ userId: mongoose.Types.ObjectId(userId), companyId: mongoose.Types.ObjectId(companyId) })
  //     .populate("userId")
  //       .populate("companyId");
  //       console.log("Query result:", data);  
  //     if (!data) {
  //       return res.status(404).json({ error: "Application record not found" });
  //     }
  //     if (data.status === "Shortlisted") {
  //       return res.status(400).json({ message: "Already shortlisted" });
  //     }

  //     let update = await applyModel.findOneAndUpdate(
  //       { userId: userId, companyId: companyId },
  //       { $set: { status: "Shortlisted" } },
  //       { new: true }
  //     );

  //     console.log(update, "Updated document");

  //     if (!update) {
  //       return res.status(400).json({ success: false, message: "Something went wrong" });
  //     }

  // //Email
  //     if (data.userId && data.companyId) {
  //       sent.sendMail(
  //         data.userId.fullName,
  //         data.userId.email,
  //         ` Congratulations! Your profile has been shortlisted for the position of  ${data.companyId.jobProfile} in ${data.companyId.companyName}<h3>Our team will connect with you shortly to discuss the next steps.</h3>`
  //       );
  //     } else {
  //       console.log("Missing user or company data, email not sent.");
  //     } 

  // //whatsapp
  //   if (data.userId && data.companyId) {
  //       sent.sendWhatsAppShortlisted(
  //         data.userId.fullName,
  //         data.userId.phone,
  //         ` ${data.companyId.jobProfile} in ${data.companyId.companyName}.`
  //       );
  //     } else {
  //       console.log("Missing user or company data, email not sent.");
  //     }  

  //     //sms
  //      if (data.userId && data.companyId) {
  //       sent.sendShortlistedSMS(
  //           data.userId.phone,
  // `Hello ${data.userId.fullName}, Congratulations! Your profile has been shortlisted for the position of ${data.companyId.jobProfile}. Our team will connect with you shortly to discuss the next steps. Thank You For Choosing LaborLink`
  //       );
  //     } else {
  //       console.log("Missing user or company data, sms not sent.");
  //     }
  //     return res.status(200).json({ success: true, message: "Successfully shortlisted" });
  //   } catch (err) {
  //     console.error("Error in addShortList:", err);
  //     return res.status(500).json({ success: false, error: "Internal server error" });
  //   }
  // }   






  async addShortList(req, res) {
    try {
      const { userId, companyId, employerId } = req.body;
      console.log("Received request:", userId, companyId);

      // Validate required ids
      if (!userId || !companyId) {
        return res.status(400).json({ success: false, error: 'userId and companyId are required' });
      }
      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({ success: false, error: 'Invalid userId or companyId format' });
      }

      // Subscription validation is now handled by middleware

      let data = await applyModel
        .findOne({ userId: mongoose.Types.ObjectId(userId), companyId: mongoose.Types.ObjectId(companyId) })
        .populate("userId")
        .populate("companyId");

      if (!data) {
        return res.status(404).json({ error: "Application record not found" });
      }
      if (data.status === "Shortlisted") {
        return res.status(400).json({ message: "Already shortlisted" });
      }
      if (data.status === "Scheduled") {
        return res.status(400).json({ message: "Cannot shortlist - Interview already scheduled" });
      }
      if (data.status === "Selected") {
        return res.status(400).json({ message: "Cannot shortlist - Candidate already selected" });
      }
      if (data.status === "Rejected") {
        return res.status(400).json({ message: "Cannot shortlist - Application already rejected" });
      }

      let update = await applyModel.findOneAndUpdate(
        { userId, companyId },
        { $set: { status: "Shortlisted" } },
        { new: true }
      );

      if (!update) {
        return res.status(400).json({ success: false, message: "Something went wrong" });
      }

      // ✅ Email
      if (data.userId && data.companyId) {
        sent.sendMail(
          data.userId.fullName,
          data.userId.email,
          `Congratulations! Your profile has been shortlisted for the position of ${data.companyId.jobProfile} in ${data.companyId.companyName}<h3>Our team will connect with you shortly to discuss the next steps.</h3>`
        );
      }

      // ✅ WhatsApp
      if (data.userId && data.companyId) {
        sent.sendWhatsAppShortlisted(
          data.userId.fullName,
          data.userId.phone,
          `${data.companyId.jobProfile} in ${data.companyId.companyName}.`
        );
      }

      // ✅ SMS
      if (data.userId && data.companyId) {
        sent.sendShortlistedSMS(
          data.userId.phone,
          `Hello ${data.userId.fullName}, Congratulations! Your profile has been shortlisted for the position of ${data.companyId.jobProfile}. Our team will connect with you shortly to discuss the next steps. Thank You For Choosing LaborLink`
        );
      }

      // ✅ Push Notification (FCM)
      const fcmRecords = await FCMtoken.find({
        employeeId: data.userId._id,
        isActive: true
      });

      if (fcmRecords.length > 0) {
        const tokens = fcmRecords.map(r => r.fcmToken).filter(Boolean);
        console.log("tokenssssssss", tokens)

        if (tokens.length > 0) {
          const message = {
            notification: {
              title: "🎉 Shortlisted!",
              body: `Hi ${data.userId.fullName}, you’ve been shortlisted for ${data.companyId.jobProfile} at ${data.companyId.companyName}.`,
            },
            data: {
              type: "shortlist",
              userId: String(userId),
              companyId: String(companyId),
            },
            tokens, // 👈 send to multiple devices
          };

          try {
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`✅ Firebase  Notification sent: ${response.successCount} success, ${response.failureCount} failed`);
          } catch (fcmError) {
            console.error("❌ FCM Notification Error:", fcmError);
          }
        }
      } else {
        console.log("⚠️ No active FCM token found for this employee");
      }

      // Record application review usage
      try {
        if (employerId) {
          const SubscriptionUsageService = require("../../services/subscriptionUsageService");
          await SubscriptionUsageService.recordUsage(String(employerId), 'application_review', { endpoint: 'addShortList', companyId, candidateId: String(userId) });
        }
      } catch (recErr) {
        console.log('Warning: could not record application_review usage:', recErr?.message || recErr);
      }

      return res.status(200).json({ success: true, message: "Successfully shortlisted" });
    } catch (err) {
      console.error("Error in addShortList:", err);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  }



async addSelect(req, res) {
    console.log(req.body, "this is body");

    const { userId, companyId } = req.body;
    console.log("Received request:", { userId, companyId });

    // Validate input
    if (!userId || !companyId) {
      return res.status(400).json({ error: "User ID and Company ID are required" });
    }


    let userObjectId, companyObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
      companyObjectId = new mongoose.Types.ObjectId(companyId);
    } catch {
      return res.status(400).json({ error: "Invalid ObjectId format" });
    }

    const apps = await applyModel.find({ userId: userObjectId });
    console.log("Apps with this userId:", apps);

    const apps2 = await applyModel.find({ companyId: companyObjectId });
    console.log("Apps with this companyId:", apps2);

    // Fetch application
    let data = await applyModel
      .findOne({ userId: userObjectId, companyId: companyObjectId })
      .populate("userId")
      .populate("companyId")
      .lean();

    console.log("Fetched data:", data);

    if (!data) {
      return res.status(404).json({ error: "No application found" });
    }
    if (data.status === "Selected" || data.status === "selected") {
      console.log("User already selected, returning success");
      // Also delete any lingering interview record
      try {
        await callModel.deleteOne({ 
          userId: userId, 
          companyId: companyObjectId 
        });
        console.log('Cleaned up interview record for already selected candidate');
      } catch (deleteErr) {
        console.log('Warning: could not delete interview record:', deleteErr?.message || deleteErr);
      }
      return res.status(200).json({ success: "User already selected" });
    }
    if (data.status === "Rejected" || data.status === "rejected") {
      console.log("User already rejected, cannot select");
      return res.status(400).json({ error: "Cannot select an already rejected candidate" });
    }

    const update = await applyModel.findOneAndUpdate(
      { userId: userObjectId, companyId: companyObjectId },
      { $set: { status: "Selected" } },
      { new: true }
    );
    if (!update) {
      return res.status(400).json({ error: "Something went wrong" });
    }

    console.log("Update successful:", update);
    await sent.sendMail(
      data.userId.fullName,
      data.userId.email,
      `We are pleased to inform you that you have been selected for the position of ${data.companyId.jobProfile} in ${data.companyId.companyName}. Our HR team will contact you with the joining formalities and offer details. Congratulations once again!<br><br>
     <h3>Thank you <br>Labor Link Team</h3>`
    );
    console.log("Email sent successfully");

    await sent.sendSelectedWhatsapp(
      data.userId.fullName,
      data.userId.phone,
      `${data.companyId.jobProfile} in ${data.companyId.companyName}. `
    );
    console.log("WhatsApp message sent successfully");

    // SMS 
    await sent.sendSelectedSMS(
      data.userId.phone,
      `Congratulations ${data.userId.fullName} You have been selected for the role of ${data.companyId.jobProfile} at ${data.companyId.companyName}. Please check your offer details for the next steps - Labor Link`
    );
    console.log("SMS sent successfully");

    // Record application review usage
    try {
      const employerId = req.body.employerId || req.query.employerId;
      if (employerId) {
        const SubscriptionUsageService = require("../../services/subscriptionUsageService");
        await SubscriptionUsageService.recordUsage(String(employerId), 'application_review', { endpoint: 'addSelect', companyId, candidateId: String(userId) });
      }
    } catch (recErr) {
      console.log('Warning: could not record application_review usage:', recErr?.message || recErr);
    }
    try {
      await callModel.deleteOne({ 
        userId: userId, 
        companyId: companyObjectId 
      });
      console.log('Interview record deleted for selected candidate');
    } catch (deleteErr) {
      console.log('Warning: could not delete interview record:', deleteErr?.message || deleteErr);
    }
    return res.status(200).json({ success: "Successfully Selected" });
  }
async getSelectData(req, res) {
    try {
    let companyId = req.params.companyId
      console.log(companyId, "this is company id")
      const hash = await applyModel
        .find({ companyId, status: "Selected", isDelete: false })
        .populate("userId");
      console.log(hash, "this is hash");

      // Mask sensitive user data for employer view
      const maskedData = hash.map(application => {
        if (application.userId) {
          // Only show employee name and masked email/phone
          const maskedUserData = maskSensitiveData(application.userId.toObject ? application.userId.toObject() : application.userId);
          const maskedUser = {
            _id: application.userId._id,
            fullName: application.userId.fullName,
            email: maskedUserData.email,
            phone: maskedUserData.phone,
            location: application.userId.location,
            profile: application.userId.profile, // Profile picture
            skills: application.userId.skills || [],
            education: application.userId.education || []
          };
          
          return {
            ...application.toObject(),
            userId: maskedUser
          };
        }
        return application;
      });

      return res.status(200).json({ success: true, data: maskedData });
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

      // Mask sensitive user data for employer view
      const maskedData = shortlistingData.map(application => {
        if (application.userId) {
          // Only show employee name and masked email/phone
          const maskedUserData = maskSensitiveData(application.userId.toObject ? application.userId.toObject() : application.userId);
          const maskedUser = {
            _id: application.userId._id,
            fullName: application.userId.fullName,
            email: maskedUserData.email,
            phone: maskedUserData.phone,
            location: application.userId.location,
            profile: application.userId.profile, // Profile picture
            skills: application.userId.skills || [],
            education: application.userId.education || []
          };
          
          return {
            ...application.toObject(),
            userId: maskedUser
          };
        }
        return application;
      });

      return res.status(200).json({
        success: true,
        data: maskedData
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

async getScheduledData(req, res) {
    try {
      const { jobId } = req.params;
      console.log("Fetching scheduled applications for jobId:", jobId);

      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid job ID format"
        });
      }

      // Get applications with "Scheduled" status
      const scheduledData = await applyModel
        .find({
          companyId: new mongoose.Types.ObjectId(jobId),
          status: "Scheduled",
          isDelete: false
        })
        .populate("userId")
        .sort({ updatedAt: -1 });

      if (!scheduledData || scheduledData.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "No scheduled applications found"
        });
      }

      // Get interview details for each scheduled application
      const callModel = require("../../Model/Employers/scheduleinterview");
      const scheduledWithInterviews = await Promise.all(
        scheduledData.map(async (application) => {
          const interview = await callModel.findOne({
            userId: application.userId._id,
            companyId: application.companyId
          });

          // Mask sensitive user data
          const maskedUserData = maskSensitiveData(
            application.userId.toObject ? application.userId.toObject() : application.userId
          );
          const maskedUser = {
            _id: application.userId._id,
            fullName: application.userId.fullName,
            email: maskedUserData.email,
            phone: maskedUserData.phone,
            location: application.userId.location,
            profile: application.userId.profile,
            skills: application.userId.skills || [],
            education: application.userId.education || []
          };

          return {
            ...application.toObject(),
            userId: maskedUser,
            isInterviewScheduled: true,
            interviewDetails: interview ? {
              schedule: interview.schedule,
              platform: interview.platform,
              meetingLink: interview.meetingLink,
              duration: interview.duration,
              status: interview.status
            } : null
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: scheduledWithInterviews
      });

    } catch (err) {
      console.error("Error in getScheduledData:", err);
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

      // Mask sensitive user data for employer view
      const maskedData = data.map(application => {
        if (application.userId) {
          // Only show employee name and masked email/phone
          const maskedUserData = maskSensitiveData(application.userId.toObject ? application.userId.toObject() : application.userId);
          const maskedUser = {
            _id: application.userId._id,
            fullName: application.userId.fullName,
            email: maskedUserData.email,
            phone: maskedUserData.phone,
            location: application.userId.location,
            profile: application.userId.profile, // Profile picture
            skills: application.userId.skills || [],
            education: application.userId.education || []
          };
          
          return {
            ...application.toObject(),
            userId: maskedUser
          };
        }
        return application;
      });

      return res.status(200).json({ success: maskedData });
    } catch (error) {
      console.log(error);
    }
  }
async rejectApply(req, res) {
    try {
      const { userId, companyId, employerId } = req.body;
      console.log(companyId, "lililili")

      // Validate required ids
      if (!userId || !companyId) {
        return res.status(400).json({ success: false, error: 'userId and companyId are required' });
      }
      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({ success: false, error: 'Invalid userId or companyId format' });
      }

      // Enforce application review limit for employer if provided
      try {
        if (employerId) {
          const currentUsage = await SubscriptionValidationService.getCurrentUsage(employerId, 'daily');
          const validation = await SubscriptionValidationService.validateAction(employerId, 'application_review', currentUsage);
          if (!validation.allowed) {
            const statusCode = validation.upgradeRequired ? 402 : 403;
            return res.status(statusCode).json({
              success: false,
              error: validation.reason || 'Application review limit reached',
              upgradeRequired: !!validation.upgradeRequired,
              remainingUsage: validation.remainingUsage || 0
            });
          }
        }
      } catch (vErr) {
        console.log('Warning: application_review validation error:', vErr?.message || vErr);
      }
      let data = await applyModel
        .findOne({ userId: mongoose.Types.ObjectId(userId), companyId: mongoose.Types.ObjectId(companyId) })
        .populate("userId")
        .populate("companyId");

      if (!data) {
        return res.status(404).json({ success: false, error: "Application not found" });
      }

      // Check if already rejected or selected - prevent duplicate actions
      if (data.status === "Rejected" || data.status === "rejected") {
        console.log("User already rejected, returning success");
        // Also delete any lingering interview record
        try {
          await callModel.deleteOne({ 
            userId: userId, 
            companyId: mongoose.Types.ObjectId(companyId) 
          });
          console.log('Cleaned up interview record for already rejected candidate');
        } catch (deleteErr) {
          console.log('Warning: could not delete interview record:', deleteErr?.message || deleteErr);
        }
        return res.status(200).json({ success: "User already rejected" });
      }
      if (data.status === "Selected" || data.status === "selected") {
        console.log("User already selected, cannot reject");
        return res.status(400).json({ success: false, error: "Cannot reject an already selected candidate" });
      }

      // Use fullName and phone from populated userId
      const candidateName = data.userId.fullName || data.userId.name || "Candidate";
      const candidateEmail = data.userId.email;
      const candidatePhone = data.userId.phone;
      const jobTitle = data.companyId.jobProfile || data.companyId.jobtitle || "the position";
      const companyName = data.companyId.CompanyName || "our company";

      // Send Email
      sent.sendMail(
        candidateName,
        candidateEmail,
        `This ${companyName} company rejected you for position ${jobTitle}, thanks for showing your interest.<h3>Thank you <br>Labor Link Team</h3>`
      );

      // Send WhatsApp Notification
      if (candidatePhone) {
        try {
          const whatsappMsg = `We regret to inform you that your application for ${jobTitle} at ${companyName} has been rejected. Thank you for your interest.`;
          await sent.sendRejectedWhatsapp(candidateName, candidatePhone, whatsappMsg);
        } catch (waErr) {
          console.log('Warning: WhatsApp rejection notification failed:', waErr.message);
        }
      }

      await applyModel.findOneAndUpdate({ _id: data._id }, { $set: { status: "Rejected" } })

      // Delete the scheduled interview record if it exists
      try {
        await callModel.deleteOne({ 
          userId: userId, 
          companyId: mongoose.Types.ObjectId(companyId) 
        });
        console.log('Interview record deleted for rejected candidate');
      } catch (deleteErr) {
        console.log('Warning: could not delete interview record:', deleteErr?.message || deleteErr);
      }

      // Record application review usage
      try {
        if (employerId) {
          const SubscriptionUsageService = require("../../services/subscriptionUsageService");
          await SubscriptionUsageService.recordUsage(String(employerId), 'application_review', { endpoint: 'rejectApply', companyId, candidateId: String(userId) });
        }
      } catch (recErr) {
        console.log('Warning: could not record application_review usage:', recErr?.message || recErr);
      }
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
        .find({ companyId: companyId, status: "Rejected", isDelete: false })
        .populate("userId") // Populate user details
        .populate("companyId"); // Populate company details
      if (!rejectedApplications || rejectedApplications.length === 0) {
        console.log("rejectedApplications.length : ", rejectedApplications.length)
        return res.status(200).json({ success: true, data: [], message: "No rejected applications found" });
      }

      // Mask sensitive user data for employer view
      const maskedData = rejectedApplications.map(application => {
        if (application.userId) {
          // Only show employee name and masked email/phone
          const maskedUserData = maskSensitiveData(application.userId.toObject ? application.userId.toObject() : application.userId);
          const maskedUser = {
            _id: application.userId._id,
            fullName: application.userId.fullName,
            email: maskedUserData.email,
            phone: maskedUserData.phone,
            location: application.userId.location,
            profile: application.userId.profile, // Profile picture
            skills: application.userId.skills || [],
            education: application.userId.education || []
          };
          
          return {
            ...application.toObject(),
            userId: maskedUser
          };
        }
        return application;
      });

      return res.status(200).json({ success: true, data: maskedData });
    } catch (err) {
      console.error("Error in getRejectedApplications:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
async deleteApply(req, res) {
    try {
      let applyId = req.params.applyId;
      let data = await applyModel.deleteOne({ _id: applyId });
      if (data.deletedCount === 0) return res.status(400).json({ error: "Data not found" });
      return res.status(200).json({ success: "Successfully deleted" })
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
        { $set: { isVerify: true, isBlock: false } },
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
        verify.companyName +
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
        { $set: { isVerify: false, isBlock: true } },
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
      console.log(userId, "jajs")

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }


      // Fetch user with skills
      const user = await userModel.findById(userId)
      // console.log(user,"User from DB:")
      if (!user) return res.status(404).json({ message: "User not found" });
      console.log(user, "yusdna")
      if (!user.skills || user.skills.length === 0) {
        return res.status(200).json({ 
          success: true, 
          data: [], 
          message: "User has no skills listed. Complete your profile to get suggestions." 
        });
      }

      // Extract skill names (since skills are stored as an array of strings)
      const userSkills = user.skills; // No need for `.map(s => s.skill)`

      // Fetch jobs matching skills and sort by highest salary
      const jobs = await jobModel
        .find({ skill: { $in: userSkills } }) // Match jobs where any skill matches
        .sort({ "preferredSalary.min": -1 }) // Sort by highest min salary
        .limit(10);

      if (jobs.length === 0) {
        return res.status(200).json({ 
          success: true, 
          data: [], 
          message: "No matching jobs found" 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data: jobs,
        message: "Suggested jobs retrieved successfully" 
      });
    } catch (error) {
      console.error("Error in getSuggestedJobs:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Server error", 
        details: error.message 
      });
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
      console.log("User : ", user)
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
async getHighestPayingJob(req, res) {
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
async addIndustry(req, res) {
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
async addJobRole(req, res) {
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
  async addChef(req, res) {
    try {
      console.log("Received body:", req.body); // Debugging step ✅

      const { chefCategory } = req.body;

      if (!chefCategory) {
        return res.status(400).json({ error: "Chefs name is required" });
      }

      // ✅ Check if skill already exists
      const existingSkill = await Chefs.findOne({ chefCategory: { $regex: new RegExp(`^${chefCategory}$`, "i") } });
      if (existingSkill) {
        return res.status(400).json({ error: "chefCategory already exists" });
      }

      // ✅ Fetch last skillId correctly
      const lastRecord = await Chefs.find().sort({ createdAt: -1 }).limit(1).lean();
      let newIdNumber = 1;
      if (lastRecord.length > 0 && lastRecord[0].chefId) {
        const match = lastRecord[0].chefId.match(/\d+/);
        newIdNumber = match ? parseInt(match[0], 10) + 1 : 1;
      }
      const newSkillId = `SK${String(newIdNumber).padStart(3, "0")}`;

      // ✅ Create new skill
      const newSkill = await Chefs.create({
        chefCategory,
        chefId: newSkillId,
        action: true,
      });

      return res.status(201).json({
        success: true,
        data: newSkill,
      });
    } catch (error) {
      console.error("Error adding Chefs:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }
async addCuisine(req, res) {
    try {
      console.log("Received body:", req.body);

      const { Cuisine } = req.body;

      if (!Cuisine) {
        return res.status(400).json({ error: "Cuisine name is required" });
      }

      // Check if the Cuisine already exists (case-insensitive)
      const existingCuisine = await Cuisines.findOne({
        Cuisine: { $regex: new RegExp(`^${Cuisine}$`, "i") }
      });

      if (existingCuisine) {
        return res.status(400).json({ error: "Cuisine already exists" });
      }

      const newCuisine = await Cuisines.create({
        Cuisine,
        action: true
      });

      return res.status(201).json({
        success: true,
        data: newCuisine
      });

    } catch (error) {
      console.error("Error adding Cuisine:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }
async getCompanyTypes(req, res) {
    try {
      // Fetch industries instead of company types
      const industries = await Industry.find({ isActive: true })
        .select('_id industryName industryId')
        .sort({ industryName: 1 });

      let companyTypes = [];
      
      if (industries && industries.length > 0) {
        // Transform to match expected format
        companyTypes = industries.map(industry => ({
          _id: industry._id,
          type: industry.industryName,
          typeId: industry.industryId
        }));
      } else {
        // Provide default company types if no industries exist
        const defaultIndustries = [
          'Information Technology',
          'Healthcare',
          'Finance & Banking',
          'Education',
          'Manufacturing',
          'Retail & E-commerce',
          'Construction',
          'Transportation',
          'Hospitality',
          'Media & Entertainment',
          'Real Estate',
          'Consulting',
          'Non-Profit',
          'Government',
          'Agriculture'
        ];
        
        companyTypes = defaultIndustries.map((industry, index) => ({
          _id: `default-industry-${index}`,
          type: industry,
          typeId: `ind-${index + 1}`
        }));
      }

      return res.status(200).json({
        success: true,
        count: companyTypes.length,
        data: companyTypes
      });
    } catch (error) {
      console.error("Error fetching company types (industries):", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }
  async getIndustries(req, res) {
    try {
      const industries = await Industry.find({ isActive: true })
        .select('industryId industryName description')
        .sort({ industryName: 1 });
      
      res.status(200).json({
        success: true,
        data: industries,
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
      // Get optional filter parameter from query string
      const { industryId } = req.query;
      
      let departments = [];
      
      // Try new structured Category model first
      try {
        // Build filter query based on provided parameters
        let filter = { isActive: true };
        if (industryId) {
          filter.industryId = industryId;
        }
        
        const newCategories = await Category.find(filter)
          .select('_id categoryName categoryId industryId')
          .populate('industryId', 'industryName type')
          .sort({ categoryName: 1 });
        
        if (newCategories && newCategories.length > 0) {
          departments = newCategories.map(cat => ({
            _id: cat._id,
            departmentName: cat.categoryName,
            categoryName: cat.categoryName,
            departmentId: cat.categoryId || cat._id.toString(),
            industryId: cat.industryId?._id || cat.industryId,
            industryName: cat.industryId?.industryName || cat.industryId?.type,
            industry: cat.industryId
          }));
        }
      } catch (newModelError) {
        console.log("New Category model not available or empty, trying old model");
      }
      
      // Fallback to old simple category model if new model has no data
      if (departments.length === 0 && !industryId) {
        const OldCategory = require("../../Model/Admin/category");
        const oldCategories = await OldCategory.find({})
          .select('_id category Industry')
          .sort({ category: 1 });
        
        departments = oldCategories.map(cat => ({
          _id: cat._id,
          departmentName: cat.category,
          categoryName: cat.category,
          departmentId: cat._id.toString(),
          industryName: cat.Industry,
          industry: cat.Industry
        }));
      }

      // If still no data and no filter applied, provide some default departments
      if (departments.length === 0 && !industryId) {
        const defaultDepartments = [
          'Information Technology',
          'Human Resources',
          'Finance',
          'Marketing',
          'Sales',
          'Operations',
          'Customer Service',
          'Engineering',
          'Design',
          'Administration'
        ];
        
        departments = defaultDepartments.map((dept, index) => ({
          _id: `default-dept-${index}`,
          departmentName: dept,
          departmentId: `dept-${index + 1}`
        }));
      }

      return res.status(200).json({
        success: true,
        count: departments.length,
        data: departments,
        filtered: !!industryId
      });
    } catch (error) {
      console.error("Error fetching departments:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }
  async getJobRoles(req, res) {
    try {
      // Get optional filter parameters from query string
      const { industryId, categoryId } = req.query;
      
      let roles = [];
      
      // Try SubCategory model first
      try {
        const SubCategory = require("../../Model/Admin/jobmanagment/SubCategory");
        
        // Build filter query based on provided parameters
        let filter = { isActive: true };
        if (categoryId) {
          filter.categoryId = categoryId;
        } else if (industryId) {
          filter.industryId = industryId;
        }
        
        const subCategories = await SubCategory.find(filter)
          .select('_id subCategoryName subCategoryId categoryId industryId')
          .populate('categoryId', 'categoryName')
          .populate('industryId', 'industryName type')
          .sort({ subCategoryName: 1 });
        
        if (subCategories && subCategories.length > 0) {
          roles = subCategories.map(subCat => ({
            _id: subCat._id,
            jobRole: subCat.subCategoryName,
            categoryName: subCat.subCategoryName,
            departmentId: subCat.categoryId?._id || subCat.categoryId,
            departmentName: subCat.categoryId?.categoryName,
            department: subCat.categoryId,
            categoryId: subCat.categoryId?._id || subCat.categoryId,
            category: subCat.categoryId?.categoryName,
            industryId: subCat.industryId?._id || subCat.industryId,
            industryName: subCat.industryId?.industryName || subCat.industryId?.type,
            industry: subCat.industryId
          }));
        }
      } catch (subCategoryError) {
        console.log("SubCategory model not available or empty, trying Category model");
        
        // Fallback to Category model
        try {
          let filter = { isActive: true };
          if (industryId) {
            filter.industryId = industryId;
          }
          
          const categories = await Category.find(filter)
            .select('_id categoryName categoryId industryId')
            .populate('industryId', 'industryName type')
            .sort({ categoryName: 1 });
          
          if (categories && categories.length > 0) {
            roles = categories.map(cat => ({
              _id: cat._id,
              jobRole: cat.categoryName,
              categoryName: cat.categoryName,
              departmentId: cat._id,
              departmentName: cat.categoryName,
              department: cat.categoryName,
              categoryId: cat._id,
              category: cat.categoryName,
              industryId: cat.industryId?._id || cat.industryId,
              industryName: cat.industryId?.industryName || cat.industryId?.type,
              industry: cat.industryId
            }));
          }
        } catch (categoryError) {
          console.log("Category model also not available, trying old model");
        }
      }
      
      // Fallback to old simple category model if other models have no data
      if (roles.length === 0) {
        try {
          const OldCategory = require("../../Model/Admin/category");
          const oldCategories = await OldCategory.find({})
            .select('_id category Industry')
            .sort({ category: 1 });
          
          roles = oldCategories.map(cat => ({
            _id: cat._id,
            jobRole: cat.category,
            categoryName: cat.category,
            departmentName: cat.category,
            department: cat.category,
            category: cat.category,
            industryName: cat.Industry,
            industry: cat.Industry
          }));
        } catch (oldCategoryError) {
          console.log("Old category model also not available");
        }
      }

      // If still no data, provide some default job roles
      if (roles.length === 0) {
        const defaultRoles = [
          'Software Developer',
          'Frontend Developer',
          'Backend Developer',
          'Full Stack Developer',
          'Mobile App Developer',
          'DevOps Engineer',
          'Data Scientist',
          'Data Analyst',
          'UI/UX Designer',
          'Product Manager',
          'Project Manager',
          'Business Analyst',
          'Quality Assurance Engineer',
          'System Administrator',
          'Database Administrator',
          'Sales Executive',
          'Marketing Specialist',
          'Digital Marketing Manager',
          'Content Writer',
          'Graphic Designer',
          'Customer Support Representative',
          'HR Specialist',
          'Finance Analyst',
          'Operations Manager',
          'Administrative Assistant'
        ];
        
        roles = defaultRoles.map((role, index) => ({
          _id: `default-role-${index}`,
          jobRole: role
        }));
      }

      console.log(roles, "job roles from subcategories")
      return res.status(200).json({ success: true, data: roles });
    } catch (error) {
      console.error('Error fetching job roles:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  async getWorkModes(req, res) {
    try {
      const workModes = await WorkMode.find({ action: true })
        .select('_id workMode') 
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
      const educations = await Education.find().sort({ qualification: 1 });;
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
  async getChefs(req, res) {
    try {
      const chefs = await Chefs.find({ action: true })
        .select('_id chefCategory chefId') // include chefId for sorting
        .sort({ chefCategory: 1 });

      return res.status(200).json({
        success: true,
        count: chefs.length,
        data: chefs
      });
    } catch (error) {
      console.error("Error fetching chefs:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }
  async getCuisine(req, res) {
    try {
      const cuisines = await Cuisines.find({ action: true })
        .select('_id Cuisine CuisineId') // fields relevant to Cuisine
        .sort({ Cuisine: 1 }); // sort by CuisineId ascending

      return res.status(200).json({
        success: true,
        count: cuisines.length,
        data: cuisines
      });
    } catch (error) {
      console.error("Error fetching cuisines:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }
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
  async editIndustry(req, res) {
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
  async editChef(req, res) {
    try {
      const { id } = req.params;
      const { chefCategory, action } = req.body;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid skill ID format",
          details: "The provided ID is not a valid MongoDB ObjectId"
        });
      }

      if (!chefCategory) {
        return res.status(400).json({ error: "Skill name is required" });
      }

      // Check if skill name already exists (excluding the current record)
      const existingSkill = await Chefs.findOne({
        chefCategory,
        _id: { $ne: id }
      });

      if (existingSkill) {
        return res.status(400).json({ error: "Skill name already exists" });
      }

      const updatedSkill = await Chefs.findByIdAndUpdate(
        id,
        {
          chefCategory,
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
      console.error("Error updating chefCategory:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }
  async editCuisine(req, res) {
    try {
      const { id } = req.params;
      const { Cuisine: cuisineName, action } = req.body;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid Cuisine ID format",
          details: "The provided ID is not a valid MongoDB ObjectId"
        });
      }

      if (!cuisineName) {
        return res.status(400).json({ error: "Cuisine name is required" });
      }

      // Check if Cuisine name already exists (case-insensitive, excluding current record)
      const existingCuisine = await Cuisines.findOne({
        Cuisine: { $regex: new RegExp(`^${cuisineName}$`, "i") },
        _id: { $ne: id }
      });

      if (existingCuisine) {
        return res.status(400).json({ error: "Cuisine name already exists" });
      }

      // Update the Cuisine
      const updatedCuisine = await Cuisines.findByIdAndUpdate(
        id,
        {
          Cuisine: cuisineName,
          action: action !== undefined ? action : true
        },
        {
          new: true,
          runValidators: true
        }
      );

      if (!updatedCuisine) {
        return res.status(404).json({ error: "Cuisine not found" });
      }

      return res.status(200).json({
        success: true,
        data: updatedCuisine
      });
    } catch (error) {
      console.error("Error updating Cuisine:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }
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
  async deleteJobRole(req, res) {
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
  async deletechefCategory(req, res) {
    try {
      const { id } = req.params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid Chefs ID format",
          details: "The provided ID is not a valid MongoDB ObjectId"
        });
      }

      const deletedSkill = await Chefs.findByIdAndDelete(id);

      if (!deletedSkill) {
        return res.status(404).json({ error: "Skill not found" });
      }

      return res.status(200).json({
        success: true,
        message: "chefCategory deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting chefCategory:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }
  async deleteCuisine(req, res) {
    try {
      const { id } = req.params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid Cuisine ID format",
          details: "The provided ID is not a valid MongoDB ObjectId"
        });
      }

      const deletedSkill = await Cuisines.findByIdAndDelete(id);

      if (!deletedSkill) {
        return res.status(404).json({ error: "Skill not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Cuisine deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting chefCategory:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }
}
module.exports = new company();


