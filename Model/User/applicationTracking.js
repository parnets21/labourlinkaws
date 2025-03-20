const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applicationTrackingSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    jobId: {
        type: Schema.Types.ObjectId,
        ref: 'job',
        required: true
    },
    status: {
        type: String,
        enum: ['applied', 'shortlisted', 'in_process', 'rejected', 'selected'],
        default: 'applied'
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    nextStep: {
        type: String,
        default: 'Application under review'
    },
    statusUpdates: [{
        status: {
            type: String,
            enum: ['applied', 'shortlisted', 'in_process', 'rejected', 'selected']
        },
        note: String,
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    interviewSchedule: {
        date: Date,
        type: {
            type: String,
            enum: ['phone', 'video', 'in-person', 'technical']
        },
        location: String,
        interviewerName: String,
        notes: String
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('ApplicationTracking', applicationTrackingSchema); 