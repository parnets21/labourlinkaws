const Job = require('../Model/Job');
const User = require('../Model/User');
const JobApplication = require('../Model/JobApplication');

exports.getDashboardStats = async (req, res) => {
    try {
        const stats = {
            users: {
                total: await User.countDocuments(),
                employees: await User.countDocuments({ role: 'employee' }),
                employers: await User.countDocuments({ role: 'employer' }),
                activeToday: await User.countDocuments({
                    lastLogin: { $gte: new Date(Date.now() - 24*60*60*1000) }
                })
            },
            jobs: {
                total: await Job.countDocuments(),
                active: await Job.countDocuments({ status: 'active' }),
                filled: await Job.countDocuments({ status: 'closed' }),
                premium: await Job.countDocuments({ isPremium: true })
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

exports.getRevenueStats = async (req, res) => {
    try {
        const startDate = new Date(req.query.startDate || Date.now() - 30*24*60*60*1000);
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
