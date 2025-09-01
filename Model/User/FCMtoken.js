const mongoose = require("mongoose")

const fcmTokenSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        unique: true
    },
    fcmToken: {
        type: String,
        required: true,
    },
    deviceId: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        enum: ["android", "ios"],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("FCMtoken", fcmTokenSchema)