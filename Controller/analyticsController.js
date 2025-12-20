const Job = require('../Model/Employers/company');
const User = require('../Model/User/user');
const JobApplication = require('../Model/Employers/apply');

exports.getDashboardStats = async (req, res) => {
    try {
        const stats = {
            users: {
                total: await User.countDocuments(),
                employees: await User.countDocuments({ userType: 'employee' }),
                employers: await User.countDocuments({ userType: 'employer' }),
                activeToday: await User.countDocuments({
                    lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                })
            },
            jobs: {
                total: await Job.countDocuments(),
                active: await Job.countDocuments({ isDelete: false }),
                filled: await Job.countDocuments({ status: 'closed' }),
                premium: await Job.countDocuments({ isPrime: true })
            },
            applications: {
                total: await JobApplication.countDocuments(),
                pending: await JobApplication.countDocuments({ status: 'applied' }),
                interviews: await JobApplication.countDocuments({ status: 'interview_scheduled' }),
                selected: await JobApplication.countDocuments({ status: 'selected' }),
                rejected: await JobApplication.countDocuments({ status: 'rejected' })
            },
            referrals: {
                total: await User.aggregate([
                    { $unwind: '$referrals' },
                    { $group: { _id: null, count: { $sum: 1 } } }
                ]).then(result => result[0]?.count || 0),
                successful: await User.aggregate([
                    { $unwind: '$referrals' },
                    { $match: { 'referrals.status': 'hired' } },
                    { $group: { _id: null, count: { $sum: 1 } } }
                ]).then(result => result[0]?.count || 0)
            }
        };

        // Monthly Trends (Last 6 months)
        const monthlyTrends = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const [users, employers, jobs, applications] = await Promise.all([
                User.countDocuments({ userType: 'employee', createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
                User.countDocuments({ userType: 'employer', createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
                Job.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
                JobApplication.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } })
            ]);

            monthlyTrends.push({
                name: startOfMonth.toLocaleString('default', { month: 'short' }),
                users,
                employers,
                jobs,
                applications
            });
        }

        // Recent Activity
        const [recentJobs, recentUsers, recentApps] = await Promise.all([
            Job.find({ isDelete: false }).sort({ createdAt: -1 }).limit(5).populate('employerId', 'name CompanyName'),
            User.find({ isDelete: false }).sort({ createdAt: -1 }).limit(5),
            JobApplication.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'fullName').populate('jobId', 'jobtitle')
        ]);

        const activities = [
            ...recentJobs.map(j => ({
                id: j._id,
                type: 'job',
                title: 'New Job Posted',
                description: `${j.jobtitle} at ${j.companyName || j.employerId?.CompanyName || 'Company'}`,
                time: j.createdAt,
                icon: 'FiBriefcase'
            })),
            ...recentUsers.map(u => ({
                id: u._id,
                type: 'user',
                title: 'New User Registered',
                description: `${u.fullName || 'A new user'} joined as Job Seeker`,
                time: u.createdAt,
                icon: 'FiUsers'
            })),
            ...recentApps.map(a => ({
                id: a._id,
                type: 'application',
                title: 'New Application',
                description: `${a.userId?.fullName || 'A user'} applied for ${a.jobId?.jobtitle || 'a job'}`,
                time: a.createdAt,
                icon: 'FiFileText'
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

        res.status(200).json({
            status: 'success',
            data: {
                stats,
                monthlyTrends,
                activities
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getRevenueStats = async (req, res) => {
    try {
        const startDate = new Date(req.query.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = new Date(req.query.endDate || Date.now());

        const revenue = await JobApplication.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    'applicationFee.status': 'paid'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    total: { $sum: '$applicationFee.amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.status(200).json({
            status: 'success',
            data: revenue
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getPlacementStats = async (req, res) => {
    try {
        const stats = await JobApplication.aggregate([
            { $match: { status: 'selected' } },
            {
                $lookup: {
                    from: 'jobs',
                    localField: 'job',
                    foreignField: '_id',
                    as: 'jobDetails'
                }
            },
            { $unwind: '$jobDetails' },
            {
                $group: {
                    _id: '$jobDetails.category',
                    count: { $sum: 1 },
                    avgSalary: {
                        $avg: {
                            $divide: [
                                { $add: ['$jobDetails.salary.min', '$jobDetails.salary.max'] },
                                2
                            ]
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: stats
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};
