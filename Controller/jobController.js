const Job = require('../Model/Job');
const User = require('../Model/User');
const JobApplication = require('../Model/JobApplication');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createJob = async (req, res) => {
    try {
        const newJob = await Job.create({
            ...req.body,
            employer: req.user._id
        });

        res.status(201).json({
            status: 'success',
            data: {
                job: newJob
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.searchJobs = async (req, res) => {
    try {
        const query = {};
        
        // Filter by category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Filter by location
        if (req.query.latitude && req.query.longitude) {
            const maxDistance = req.query.distance || 10000; // Default 10km
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(req.query.longitude), parseFloat(req.query.latitude)]
                    },
                    $maxDistance: maxDistance
                }
            };
        }

        // Filter by salary range
        if (req.query.minSalary || req.query.maxSalary) {
            query.salary = {};
            if (req.query.minSalary) query.salary.$gte = parseInt(req.query.minSalary);
            if (req.query.maxSalary) query.salary.$lte = parseInt(req.query.maxSalary);
        }

        // Filter by work mode
        if (req.query.workMode) {
            query.workMode = req.query.workMode;
        }

        // Only show active jobs
        query.status = 'active';

        // Implement free/paid search logic
        let limit = 5; // Default free limit
        if (req.user.paidSearch) {
            limit = parseInt(req.query.limit) || 20;
        }

        const jobs = await Job.find(query)
            .limit(limit)
            .populate('employer', 'profile.firstName profile.lastName');

        res.status(200).json({
            status: 'success',
            results: jobs.length,
            data: {
                jobs
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.applyForJob = async (req, res) => {
  try {
    const { job, applicant, status, documents, notes } = req.body;

    // Validate required fields
    if (!job || !applicant) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['job', 'applicant'],
        received: req.body
      });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      job,
      applicant
    });

    if (existingApplication) {
      return res.status(400).json({
        error: "Already applied"
      });
    }

    // Create new application
    const newApplication = new JobApplication({
      job,
      applicant,
      status,
      documents: documents || [],
      notes: notes || []
    });

    await newApplication.save();

    res.status(201).json({
      message: "Successfully applied for the job",
      application: newApplication
    });

  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({
      error: "Failed to submit application",
      details: error.message
    });
  }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const application = await JobApplication.findById(req.params.applicationId);
        
        if (!application) {
            throw new Error('Application not found');
        }

        // Only employer of the job or admin can update status
        const job = await Job.findById(application.job);
        if (req.user.role !== 'admin' && job.employer.toString() !== req.user._id.toString()) {
            throw new Error('You do not have permission to perform this action');
        }

        application.status = req.body.status;
        
        // If selected, lock the user's profile
        if (req.body.status === 'selected') {
            const user = await User.findById(application.applicant);
            await user.lockProfile();
        }

        await application.save();

        res.status(200).json({
            status: 'success',
            data: {
                application
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getPopularJobs = async (req, res) => {
    try {
        // Aggregate jobs with their application counts
        const popularJobs = await Job.aggregate([
            // Match only active jobs
            { $match: { status: 'active' } },
            
            // Lookup applications
            {
                $lookup: {
                    from: 'jobapplications',
                    localField: '_id',
                    foreignField: 'job',
                    as: 'applications'
                }
            },
            
            // Add application count field
            {
                $addFields: {
                    applicationCount: { $size: '$applications' }
                }
            },

            // Sort by application count in descending order
            { $sort: { applicationCount: -1 } },

            // Limit to 10 results
            { $limit: 10 },

            // Lookup employer details
            {
                $lookup: {
                    from: 'users',
                    localField: 'employer',
                    foreignField: '_id',
                    as: 'employerDetails'
                }
            },
            { $unwind: '$employerDetails' },

            // Project only needed fields
            {
                $project: {
                    title: 1,
                    description: 1,
                    category: 1,
                    location: 1,
                    salary: 1,
                    workMode: 1,
                    applicationCount: 1,
                    'employerDetails.profile.firstName': 1,
                    'employerDetails.profile.lastName': 1,
                    'employerDetails.profile.companyName': 1,
                    requirements: 1,
                    createdAt: 1
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            results: popularJobs.length,
            data: {
                jobs: popularJobs
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};


