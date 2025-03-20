// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;
// const { ObjectId } = mongoose.Schema.Types;
// const ChatboxModel = new Schema(
//   {
//     type: {
//       type: String,
//       enum: ['interview', 'job_match', 'hr_message', 'application_update'],
//       required: true
//     },
//     userId: {
//       type: ObjectId,
//     },
//     logo: {
//       type: String,
//       required: true
//     },
//     userName: {
//       type: String,
//     },
//     userAavtar: {
//       type: String,
//     },
//     recieverId: {
//       type: ObjectId,
//     },
//     recieverName: {
//       type: String,
//     },
//     recieverAvatar: {
//       type: String,
//     },
//     text: {
//       type: String,
//     },
//     unread: {
//       type: Boolean,
//       default: true
//     },
//     type: {
//       type: String,
//     },
//     title: {
//       type: String,
//       required: true
//     },

//     profile:{
//       type:String
//     },
//     company: {
//       type: String,
//       required: true
//     },
//     status: {
//       type: String,
//       default: "unseen",
//     },

//   message: {
//     type: String,
//     required: true
//   },
//   time: {
//     type: String,
//     required: true
//   },


//   },
//   { timestamps: true }
// );
// const userModel = mongoose.model("ChatboxModel", ChatboxModel);
// module.exports = userModel;


