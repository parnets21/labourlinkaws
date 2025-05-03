const ChatboxModel = require("../../Model/User/chatbox")
const mongoose = require("mongoose");
const { uploadFile2 } = require("../../middileware/aws");


class chat {
  async addchat(req, res) {
    try{
    let {  userId,userName,userAavtar, recieverId,recieverName,recieverAvatar, text, type } = req.body;

    let obj={ userId,userName,userAavtar, recieverId,recieverName,recieverAvatar,
      text,
      type,}
      
    if (req.files && req.files.length > 0) {
      // Find profile file
      const profileFile = req.files.find(file => file.fieldname === "profile");
      
      if (profileFile) {
        try {
          // Upload profile to S3
          const profileUrl = await uploadFile2(profileFile, "chat-attachments");
          obj["profile"] = profileUrl;
        } catch (uploadError) {
          console.error("Error uploading attachment to S3:", uploadError);
          return res.status(500).json({ 
            success: false, 
            message: "Failed to upload attachment", 
            error: uploadError.message 
          });
        }
      }
    }
      let Newchat = new ChatboxModel(obj);
      Newchat.save().then((data) => {
        console.log(data);
        return res.status(200).json({ success: "success" });
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Failed to add chat", error: error.message });
    }
  }
  async getchat(req, res) {
    let senderId = req.params.senderId;
    let recieverId = req.params.recieverId;
    let chat = await ChatboxModel.find({$or:[{$and:[{userId: senderId} ,{ recieverId: recieverId}]},
      {$and:[{userId: recieverId} ,{ recieverId: senderId}]}
    ] }).sort({_id:1});
  
    if (chat) {
      return res.status(200).json({ chat: chat });
    }
  }

  async chatsseen(req, res) {
    let userId=req.params.userId;
    let recieverId=req.params.recieverId;
    try {
      let seenmsg = await ChatboxModel.updateMany(
        { recieverId: userId, userId: recieverId },
        { $set: { status: "seen" } },
        { multi: true }
      );
      if(seenmsg.modifiedCount!=0){
          await ChatboxModel.updateMany(
          { recieverId: recieverId, userId: userId },
          { $set: { status: "seen" } },
          { multi: true });
      }
        return res.status(200).json({ success: seenmsg});
    } catch (error) {
      console.log(error);
    }
  }

  async deletechat(req, res) {
    let chatId = req.params.chatId;
    try {
    let deletechat=  await ChatboxModel.deleteOne({ _id: chatId })
      if(deletechat.deletedCount!=0) {
          return res.json({ Success: "Removed Successfully" });
        }else{
          return res.status({ error: "Something went wrong" });
        }
    } catch (error) {
      console.log(error);
    }
  }

  async getUnSeenchat(req,res){
    try{
      let userId=req.params.userId
      let getChat= await ChatboxModel.find({recieverId:userId,status:"unseen"});
       return res.status(200).json({success:getChat})
    }catch(err){
      console.log(err)
    }
  }
}

const userchatboxController = new chat();
module.exports = userchatboxController;
