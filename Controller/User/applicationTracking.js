const ApplicationTracking = require('../../Model/User/applicationTracking');
const jobModel = require('../../Model/Employers/company');
const mongoose = require("mongoose");

class ApplicationTrackingController {
    // Get all applications for a user with filters
    async getMyApplications(req, res) {
        try {
            const { userId } = req.params;
            const { status, page = 1, limit = 10 } = req.query;

            let query = { userId };
            
            // Add status filter if provided
            if (status && status !== 'all') {
                query.status = status;
            }

            // Get applications with pagination
            const applications = await ApplicationTracking.find(query)
                .populate({
                    path: 'jobId',
                    select: 'CompanyName jobtitle location minSalary typeofwork '
                })
                .sort({ appliedDate: -1 })
                .skip((page - 1) * limit)
                .limit(limit);

            // Get counts for different statuses
            const statusCounts = await ApplicationTracking.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Format the response
            const formattedApplications = applications.map(app => ({
                id: app._id,
                title: app.jobId.jobtitle,
                company: app.jobId.CompanyName,
                location: app.jobId.location,
                salary: `${app.jobId.minSalary} - ${app.jobId.maxSalary}`,
                appliedDate: app.appliedDate.toLocaleDateString(),
                status: app.status,
                nextStep: app.nextStep,
                jobType: app.jobId.workMode,
                experience: `${app.jobId.experiencerequired} years`,
                statusUpdates: app.statusUpdates,
                interviewSchedule: app.interviewSchedule
            }));

            // Format status counts
            const summary = {
                total: statusCounts.reduce((acc, curr) => acc + curr.count, 0),
                shortlisted: statusCounts.find(s => s._id === 'shortlisted')?.count || 0,
                rejected: statusCounts.find(s => s._id === 'rejected')?.count || 0,
                in_process: statusCounts.find(s => s._id === 'in_process')?.count || 0
            };

            return res.status(200).json({
                success: true,
                data: {
                    applications: formattedApplications,
                    summary,
                    pagination: {
                        current: parseInt(page),
                        total: Math.ceil(summary.total / limit)
                    }
                }
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    // Get detailed information about a specific application
    async getApplicationDetails(req, res) {
        try {
            const { applicationId } = req.params;

            const application = await ApplicationTracking.findById(applicationId)
                .populate({
                    path: 'jobId',
                    select: 'CompanyName jobtitle location salary workMode experiencerequired description'
                });

            if (!application) {
                return res.status(404).json({ error: "Application not found" });
            }

            return res.status(200).json({
                success: true,
                data: application
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    // Archive an application
    async archiveApplication(req, res) {
        try {
            const { applicationId } = req.params;

            const application = await ApplicationTracking.findByIdAndUpdate(
                applicationId,
                { isArchived: true },
                { new: true }
            );

            if (!application) {
                return res.status(404).json({ error: "Application not found" });
            }

            return res.status(200).json({
                success: true,
                message: "Application archived successfully"
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}

module.exports = new ApplicationTrackingController(); 