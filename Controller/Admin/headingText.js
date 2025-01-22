
const headingtextModel=require("../../Model/Admin/headingText");
class headingText{
   
  async addHeadingText(req,res){
    try {
        const {text1}=req.body;
       
        let data=await headingtextModel.create({text1:text1})
        if(!data) return res.status(400).json({error:"Something went worng!"});
        return res.status(200).json({success:"Successfully added"})
    } catch (error) {
        console.log(error)
    }
  }
  async getHeadingText(req,res){
    try{
        let data =await headingtextModel.find({})
        if(!data) return res.status(400).json({error:"Data not found!"})
        return res.status(200).json({success:data})
    }catch(err){
        console.log(err)
    }
  }
  async deleteHeadingText(req,res){
    try {
        let id=req.params.Id;
        let data=await headingtextModel.deleteOne({_id:id})
        return res.status(200).json({success:"Successfully delete"})
    } catch (error) {
        console.log(error)
    }
  }
}
module.exports=new headingText();