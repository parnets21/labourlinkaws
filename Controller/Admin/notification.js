
const notificationModel=require("../../Model/Admin/notification");
class notification{
   
  async addnotification(req,res){
    try {
        const {text}=req.body;
       
        let data=await notificationModel.create({text:text})
        if(!data) return res.status(400).json({error:"Something went worng!"});
        return res.status(200).json({success:"Successfully added"})
    } catch (error) {
        console.log(error)
    }
  }
  async getnotification(req,res){
    try{
        let data =await notificationModel.find({})
        if(!data) return res.status(400).json({error:"Data not found!"})
        return res.status(200).json({success:data})
    }catch(err){
        console.log(err)
    }
  }
  async deletenotification(req,res){
    try {
        let id=req.params.Id;
        let data=await notificationModel.deleteOne({_id:id})
        return res.status(200).json({success:"Successfully delete"})
    } catch (error) {
        console.log(error)
    }
  }
}
module.exports=new notification();