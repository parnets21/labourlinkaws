const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema.Types;
const ChatboxModel = new Schema(
  {

    userId: {
      type: ObjectId,
    },
    userName: {
      type: String,
    },
    userAavtar: {
      type: String,
    },
    recieverId: {
      type: ObjectId,
    },
    recieverName: {
      type: String,
    },
    recieverAvatar: {
      type: String,
    },
    text: {
      type: String,
    },
    type: {
      type: String,
    },
    profile:{
      type:String
    },
    status: {
      type: String,
      default: "unseen",
    },

  },
  { timestamps: true }
);
const userModel = mongoose.model("ChatboxModel", ChatboxModel);
module.exports = userModel;
