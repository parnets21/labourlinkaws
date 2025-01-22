const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    mobile: {
      type: Number,
    },
    profile: {
      type: String,
    },
    backgroundImage: {
      type: String,
    },
    age: {
      type: String,
    },
    name: {
      type: String,
    },
    userName: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    skill: { type: String },
    interest: {
      int: { type: String, lowercase: true },
      int1: { type: String, lowercase: true },
      int2: { type: String, lowercase: true },
      int3: { type: String, lowercase: true },
    },
    gender: {
      type: String,
    },
    resume: {
      type: String,
    },
address: {
      type: String,
    },
    education: [
      {
        Institue: { type: String },
        Course: { type: String },
        field: { type: String },
        starting: { type: Number },
        passOut: { type: Number },
      },
    ],
    skillSet: [
      {
        skill: { type: String, uppercase: true },
        Experience: { type: Number },
      },
    ],
    workAndExperience: [
      {
        Company: { type: String },
        Period: { type: String },
        Skill: { type: String },
        Experience: { type: String },
      },
    ],
    bio: { type: String },
    country: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: Number },
    industry:{
      type:Array
    },
    reasion: {
      type: String,
    },
    online: {
      type: String,
      default: "Ofline",
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
     isBlock: {
      type: Boolean,
      default: false,
    },
  },  { timestamps: true }
);

module.exports = mongoose.model("user", userSchema);
