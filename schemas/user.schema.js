const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: ['employee', 'employer', 'admin'],
        required: [true, 'Role is required']
    },
    profile: {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
        },
        avatar: String,
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['male', 'female', 'other']
        },
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
        currentPosition: String,
        experience: {
            type: Number,
            min: 0
        },
        skills: [{
            name: String,
            level: {
                type: String,
                enum: ['beginner', 'intermediate', 'expert']
            },
            yearsOfExperience: Number
        }],
        languages: [{
            name: String,
            proficiency: {
                type: String,
                enum: ['basic', 'intermediate', 'fluent', 'native']
            }
        }],
        education: [{
            degree: String,
            field: String,
            institution: String,
            startYear: Number,
            endYear: Number,
            grade: String
        }],
        certifications: [{
            name: String,
            issuingOrganization: String,
            issueDate: Date,
            expiryDate: Date,
            credentialId: String
        }],
        resume: {
            url: String,
            lastUpdated: Date
        }
    },
    preferences: {
        jobTypes: [{
            type: String,
            enum: ['full-time', 'part-time', 'contract', 'internship']
        }],
        expectedSalary: {
            min: Number,
            max: Number,
            currency: {
                type: String,
                default: 'INR'
            }
        },
        preferredLocations: [{
            city: String,
            state: String,
            country: String
        }],
        workMode: [{
            type: String,
            enum: ['remote', 'onsite', 'hybrid']
        }],
        industries: [String],
        noticePeriod: Number // in days
    },
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobApplication'
    }],
    referrals: [{
        referredUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'hired', 'not_hired']
        },
        bonusStatus: {
            type: String,
            enum: ['pending', 'paid', 'not_applicable']
        },
        bonusDetails: {
            amount: Number,
            currency: {
                type: String,
                default: 'INR'
            },
            paidAt: Date,
            transactionId: String
        }
    }],
    employerProfile: {
        companyName: String,
        companySize: {
            type: String,
            enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
        },
        industry: String,
        companyWebsite: String,
        companyLogo: String,
        socialMedia: {
            linkedin: String,
            twitter: String,
            facebook: String
        },
        description: String,
        establishedYear: Number,
        registrationNumber: String,
        taxId: String
    },
    verificationStatus: {
        email: {
            type: Boolean,
            default: false
        },
        phone: {
            type: Boolean,
            default: false
        },
        documents: {
            type: Boolean,
            default: false
        }
    },
    stripeCustomerId: String,
    stripeAccountId: String,
    profileLockUntil: Date,
    lastLogin: Date,
    loginHistory: [{
        timestamp: Date,
        ipAddress: String,
        device: String,
        location: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    deactivationReason: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
}, {
    timestamps: true
});

// Indexes
userSchema.index({ 'profile.location': '2dsphere' });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'profile.phone': 1 }, { unique: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Update timestamp middleware
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.lockProfile = function(months = 3) {
    const lockUntil = new Date();
    lockUntil.setMonth(lockUntil.getMonth() + months);
    this.profileLockUntil = lockUntil;
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
