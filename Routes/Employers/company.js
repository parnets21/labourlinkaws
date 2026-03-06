const express = require("express");
const router = express.Router();
const jobController = require("../../Controller/Employers/company");
const multer = require("multer");
const { validateSubscription } = require('../../middileware/subscriptionValidationMiddleware');

// Use memory storage for S3 uploads
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

// Existing job routes
router.post("/registerCompany", upload.any(), validateSubscription('post_job', { checkUsage: true }), jobController.register);
router.get("/GetregisterCompany/:jobId", jobController.registeredjobbyId);
router.put("/editJob", upload.any(), jobController.editJob);
router.get("/getAllJobs", jobController.getAllJobs);



router.post("/AddSkillJ", jobController.AddSkillJ);
router.delete('/removeSkillJ/:employerId/:removeId', jobController.removeSkillJ);
router.post("/AddBenefits", jobController.AddBenefits);
router.delete('/removeBenefits/:employerId/:removeId', jobController.removeBenefits);
router.get("/getJobById/:jobId", validateSubscription('view_company_details', { checkUsage: true, usagePeriod: 'daily' }), jobController.getJobById);
router.post("/getJobByfilter", jobController.getJobByfilter);
router.post("/getJobOfTheDay", jobController.jobOftheDay);
router.delete("/deleteJob/:jobId", jobController.deleteJob);

// router.get("/getShortList", jobController.addShortList);
// Apply API routes
router.get("/getApplyList/:jobId", validateSubscription('search_candidates', { checkUsage: true, usagePeriod: 'daily' }), jobController.getApplyList);
router.get("/getShortlistingData/:jobId", jobController.getShortlistingData);
router.get("/getSelectDatas/:companyId", jobController.getSelectData);
router.post("/addShortList", validateSubscription('application_review', { checkUsage: true, usagePeriod: 'daily' }), jobController.addShortList);
router.post("/rejectApply", validateSubscription('application_review', { checkUsage: true, usagePeriod: 'daily' }), jobController.rejectApply);
router.get("/getrejected/:companyId", jobController.getRejectedApplications);
router.post("/addSelect", validateSubscription('application_review', { checkUsage: true, usagePeriod: 'daily' }), jobController.addSelect);


// Job discovery routes
router.get('/popular', jobController.getPopularJobs);
router.get("/recommend/:userId", jobController.getRecommendedJobs);
router.get("/highest-paying-job/:userId", jobController.getHighestPayingJob);
router.get('/suggested-jobs/:userId', jobController.getSuggestedJobs);
router.get("/jobby-role/:userId", jobController.searchJobsByUserRole);

// Verification and management routes
router.get("/unVerify", jobController.isVerify);
router.post("/makeVerifyUnverifyAdmin", jobController.makEverifyUnverify);
router.put('/makeVerify/:companyId', jobController.makeVerify);
router.put("/makeUnVerify/:companyId", jobController.makeUnVerify);
router.post("/makeBlockUnBlockCompany", jobController.makeBlockUnBlock);
router.get("/AllAplliedDetals", jobController.AllAplliedDetals);
router.get("/getJobByEmployerId/:employerId", jobController.getJobByEmployerId);
router.delete("/deleteApply/:applyId", jobController.deleteApply);

// Job Management Routes - POST endpoints
router.post("/add-company-type", jobController.addCompanyType);
router.post("/add-industry", jobController.addIndustry);
router.post("/add-department", jobController.addDepartment);
router.post("/add-job-role", jobController.addJobRole);
router.post("/add-work-mode", jobController.addWorkMode);
router.post("/add-education", jobController.addEducation);
router.post("/add-skill", jobController.addSkill);
router.post("/add-chef", jobController.addChef);
router.post("/add-cuisine", jobController.addCuisine);
// router.post("/add-experience-level", jobController.addExperienceLevel);

// Job Management Routes - GET endpoints
router.get("/company-types", jobController.getCompanyTypes);
router.get("/industries", jobController.getIndustries);
router.get("/departments", jobController.getDepartments);
router.get("/job-roles", jobController.getJobRoles);
router.get("/work-modes", jobController.getWorkModes);
router.get("/educations", jobController.getEducations);
router.get("/skills", jobController.getSkills);
router.get("/chefs", jobController.getChefs);
router.get("/cuisines", jobController.getCuisine);

// Cascading dropdown endpoints for hierarchical classification
const categoryController = require("../../Controller/Admin/categoryController");
const subCategoryController = require("../../Controller/Admin/subCategoryController");
router.get("/categories/by-industry/:industryId", categoryController.getCategoriesByIndustry);
router.get("/subcategories/by-category/:categoryId", subCategoryController.getSubCategoriesByCategory);

//get api https://laborlink.co.in/api/user/skills

// Job Management Routes - PUT (Edit) endpoints
router.put("/edit-company-type/:id", jobController.editCompanyType);
router.put("/edit-industry/:id", jobController.editIndustry);
router.put("/edit-department/:id", jobController.editDepartment);
router.put("/edit-job-role/:id", jobController.editJobRole);
router.put("/edit-work-mode/:id", jobController.editWorkMode);
router.put("/edit-education/:id", jobController.editEducation);
router.put("/edit-skill/:id", jobController.editSkill);
router.put("/edit-chef/:id", jobController.editChef);
router.put("/edit-cuisine/:id", jobController.editCuisine);


// Job Management Routes - DELETE endpoints
router.delete("/delete-company-type/:id", jobController.deleteCompanyType);
router.delete("/delete-industry/:id", jobController.deleteIndustry);
router.delete("/delete-department/:id", jobController.deleteDepartment);
router.delete("/delete-job-role/:id", jobController.deleteJobRole);
router.delete("/delete-work-mode/:id", jobController.deleteWorkMode);
router.delete("/delete-education/:id", jobController.deleteEducation);
router.delete("/delete-skill/:id", jobController.deleteSkill);
router.delete("/delete-chef/:id", jobController.deletechefCategory);
router.delete("/delete-cuisine/:id", jobController.deleteCuisine);

module.exports = router;