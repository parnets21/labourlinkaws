const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Employer is required']
    },
    title: {
        type: String,
        required: [true, 'Job title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Job description is required']
    },
    shortDescription: {
        type: String,
        maxlength: [250, 'Short description cannot exceed 250 characters']
    },
    category: {
        type: String,
        required: [true, 'Job category is required'],
        enum: ['entry', 'mid', 'senior', 'executive']
    },
    subCategory: String,
    department: String,
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [Number], // [longitude, latitude]
        address: String,
        city: String,
        state: String,
        country: String,
        pincode: String
    },
    salary: {
        min: {
            type: Number,
            required: [true, 'Minimum salary is required']
        },
        max: {
            type: Number,
            required: [true, 'Maximum salary is required']
        },
        currency: {
            type: String,
            default: 'INR'
        },
        period: {
            type: String,
            enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
            default: 'monthly'
        },
        benefits: [{
            type: String,
            enum: [
                'health_insurance',
                'life_insurance',
                'dental_insurance',
                'vision_insurance',
                'retirement_plan',
                'paid_time_off',
                'performance_bonus',
                'stock_options',
                'gym_membership',
                'meal_allowance',
                'transport_allowance',
                'work_from_home',
                'flexible_hours',
                'other'
            ]
        }]
    },
    requirements: {
        experience: {
            min: {
                type: Number,
                required: [true, 'Minimum experience is required']
            },
            max: Number,
            preferred: Number
        },
        skills: [{
            name: {
                type: String,
                required: true
            },
            level: {
                type: String,
                enum: ['beginner', 'intermediate', 'expert']
            },
            required: {
                type: Boolean,
                default: true
            }
        }],
        education: [{
            degree: String,
            field: String,
            required: Boolean
        }],
        certifications: [String],
        languages: [{
            name: String,
            proficiency: {
                type: String,
                enum: ['basic', 'intermediate', 'fluent', 'native']
            },
            required: Boolean
        }]
    },
    workMode: {
        type: String,
        enum: ['remote', 'onsite', 'hybrid'],
        required: [true, 'Work mode is required']
    },
    employmentType: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship'],
        required: [true, 'Employment type is required']
    },
    schedule: {
        shifts: [{
            name: String,
            startTime: String,
            endTime: String,
            days: [String]
        }],
        workingHours: {
            min: Number,
            max: Number
        },
        overtime: Boolean
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'closed', 'expired'],
        default: 'draft'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'company_only'],
        default: 'public'
    },
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobApplication'
    }],
    numberOfPositions: {
        type: Number,
        required: [true, 'Number of positions is required'],
        min: [1, 'Number of positions must be at least 1']
    },
    positionsFilled: {
        type: Number,
        default: 0
    },
    applicationDeadline: {
        type: Date,
        required: [true, 'Application deadline is required']
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    applicationFee: {
        amount: Number,
        currency: {
            type: String,
            default: 'INR'
        }
    },
    jobPostingFee: {
        amount: Number,
        currency: {
            type: String,
            default: 'INR'
        },
        paidAt: Date,
        transactionId: String
    },
    views: {
        type: Number,
        default: 0
    },
    applicationsCount: {
        type: Number,
        default: 0
    },
    keywords: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date,
    publishedAt: Date,
    closedAt: Date
}, {
    timestamps: true
});

// Indexes
jobSchema.index({ 'location': '2dsphere' });
jobSchema.index({ status: 1, applicationDeadline: 1 });
jobSchema.index({ category: 1, workMode: 1, status: 1 });
jobSchema.index({ 'requirements.skills.name': 1 });
jobSchema.index({ keywords: 'text', title: 'text', description: 'text' });

// Update timestamp middleware
jobSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Status change middleware
jobSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        if (this.status === 'active' && !this.publishedAt) {
            this.publishedAt = new Date();
        } else if (this.status === 'closed' && !this.closedAt) {
            this.closedAt = new Date();
        }
    }
    next();
});

module.exports = mongoose.model('Job', jobSchema);
