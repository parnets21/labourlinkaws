
const businessModel=require("../../Model/Admin/business");
class business{
   
  async addbusiness(req,res){
    try {
        const {text}=req.body;
       
        let data=await businessModel.create({text:text})
        if(!data) return res.status(400).json({error:"Something went worng!"});
        return res.status(200).json({success:"Successfully added"})
    } catch (error) {
        console.log(error)
    }
  }
  async getbusiness(req,res){
    try{
        let data =await businessModel.find({})
        if(!data) return res.status(400).json({error:"Data not found!"})
        return res.status(200).json({success:data})
    }catch(err){
        console.log(err)
    }
  }
  async deletebusiness(req,res){
    try {
        let id=req.params.Id;
        let data=await businessModel.deleteOne({_id:id})
        return res.status(200).json({success:"Successfully delete"})
    } catch (error) {
        console.log(error)
    }
  }
}
module.exports=new business();