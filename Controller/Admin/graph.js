const graphModel=require("../../Model/Admin/graph");
const headingtextModel=require("../../Model/Admin/headingText");
class graph{
   async addGraph(req,res){
    try {
        let {link}=req.body;
        let obj={link };

        if (req.files.length != 0) {
            let arr = req.files
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].fieldname == "image1") {
                    obj["image1"] = arr[i].filename
                }
            }}
          
        let data=await graphModel.create(obj)
        if(!data) return res.status(400).json({error:"Something went worng!"});
        return res.status(200).json({success:"Successfully added"})
    } catch (error) {
        console.log(error)
    }
   }
   async getGraph(req,res){
    try{
        let data =await graphModel.find({})
        if(!data) return res.status(400).json({error:"Data not found!"})
        return res.status(200).json({success:data})
    }catch(err){
        console.log(err)
    }
   }
   async deleteGraph(req,res){
    try {
        let id=req.params.Id;
        let data=await graphModel.deleteOne({_id:id})
        return res.status(200).json({success:"Successfully delete"})
    } catch (error) {
        console.log(error)
    }
   }
//   async addHeadingText(req,res){
//     try {
//         let {text1}=req.body;
       
//         let data=await headingtextModel.create({text1:text1})
//         if(!data) return res.status(400).json({error:"Something went worng!"});
//         return res.status(200).json({success:"Successfully added"})
//     } catch (error) {
//         console.log(error)
//     }
//   }
//   async getHeadingText(req,res){
//     try{
//         let data =await headingtextModel.find({})
//         if(!data) return res.status(400).json({error:"Data not found!"})
//         return res.status(200).json({success:data})
//     }catch(err){
//         console.log(err)
//     }
//   }
//   async deleteHeadingText(req,res){
//     try {
//         let id=req.params.Id;
//         let data=await headingtextModel.headingtextModel({_id:id})
//         return res.status(200).json({success:"Successfully delete"})
//     } catch (error) {
//         console.log(error)
//     }
//   }
}
module.exports=new graph();