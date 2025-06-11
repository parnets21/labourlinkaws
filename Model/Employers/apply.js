const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
// applySchema.js
const applySchema = new Schema({
    companyId: {
        type: ObjectId,
        ref: "job"
    },
    userId: {
        type: ObjectId,
        ref: "user"
    },
    jobTitle: {
        type: String,
        // required: true
    },
    companyName: {
        type: String,
        // required: true
    },
    status: {
        type: String,
        enum: ['Applied', 'Shortlisted', 'Selected', 'Rejected'],
        default: "Applied"
    },
    isDelete: {
        type: Boolean,
        default: false
    },
    appliedOn: {
        type: Date,
        default: Date.now
    },
    offerLetter: {
    url: String,
    generatedAt: Date,
    status: {
        type: String,
        enum: ['pending','sent','accepted', 'declined'],
        default: 'pending'
    },
    position: String,
    salary: String,
    startDate: String,
    workLocation: String,
    respondedAt: Date,
    response: String
},
applicationStatus: {
    type: String,
    enum: ['applied', 'shortlisted', 'selected', 'hired', 'rejected', 'offer_declined'],
    default: 'applied'
}
}, { timestamps: true });

// Add a compound unique index
applySchema.index({ companyId: 1, userId: 1 }, { unique: true });
module.exports = mongoose.model("apply", applySchema);