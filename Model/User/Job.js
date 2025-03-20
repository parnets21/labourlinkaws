const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [Number], // [longitude, latitude]
        address: String
    },
    salary: {
        min: Number,
        max: Number,
        currency: {
            type: String,
            default: 'INR'
        }
    },
    requirements: {
        experience: {
            min: Number,
            max: Number
        },
        skills: [String],
        education: String
    },
    workMode: {
        type: String,
        enum: ['remote', 'onsite', 'hybrid'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'closed', 'draft'],
        default: 'active'
    },
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobApplication'
    }],
    numberOfPositions: {
        type: Number,
        required: true
    },
    positionsFilled: {
        type: Number,
        default: 0
    },
    applicationDeadline: Date,
    isPremium: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

// Index for location-based queries
jobSchema.index({ location: "2dsphere" });

// Update timestamp on save
jobSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Job', jobSchema);
