const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['applied', 'shortlisted', 'interview_scheduled', 'selected', 'rejected', 'offer_accepted', 'offer_declined'],
        default: 'applied'
    },
    documents: [{
        type: {
            type: String,
            enum: ['resume', 'cover_letter', 'certificate', 'other']
        },
        url: String
    }],
    interviews: [{
        scheduledTime: Date,
        platform: {
            type: String,
            enum: ['zoom', 'google_meet', 'teams']
        },
        meetingLink: String,
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled', 'rescheduled']
        },
        feedback: String
    }],
    offerLetter: {
        url: String,
        generatedAt: Date,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined']
        }
    },
    travelArrangements: [{
        type: {
            type: String,
            enum: ['train', 'flight', 'bus']
        },
        bookingDetails: {
            pnr: String,
            departure: Date,
            arrival: Date,
            from: String,
            to: String
        },
        status: {
            type: String,
            enum: ['booked', 'cancelled', 'completed']
        }
    }],
    applicationFee: {
        amount: Number,
        currency: {
            type: String,
            default: 'INR'
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'refunded']
        },
        transactionId: String
    },
    notes: [{
        content: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

// Update timestamp on save
jobApplicationSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
