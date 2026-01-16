const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otp = new Schema(
      {
         otp: {
          type: String,
          required: true,
          maxlength: 6,
         }, 
         mobile: {
          type: String,
          required: true,
          trim: true,
          index: { unique: true },
        },
        type: {
          type: String,
        },
        verified: {
          type: Boolean,
          default: false,
        },
        attempts: {
          type: Number,
          default: 0,
        },
        expiresAt: {
          type: Date,
          default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
        expire_at: {
            type: Date, 
            default: Date.now, 
            expires: 600, // 10 minutes TTL
        },     
      },{ timestamps: true }
  );
  module.exports = mongoose.model("otp", otp);
