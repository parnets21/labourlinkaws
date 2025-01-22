const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otp = new Schema(
      {
         otp: {
          type: Number,
          required: true,
          maxlength: 6,
         }, 
         mobile: {
          type: Number,
          required: true,
          trim: true,
          index: { unique :true},
          match: /^\+?([0-9]{2})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{4})$/,
        },
        type: {
          type: String,

        },
        expire_at: {
            type: Date, 
            default: Date.now, 
            expires: 300, 
        },     
      },{ timestamps: true }
  );
  module.exports = mongoose.model("otp", otp);
