const mongoose=require('mongoose');

const  subcategoryShema=new mongoose.Schema({
        image1:{
         type:String
         },
        link:{
          type:String
            
        },
        text1:{
          type:String
            
        }
})
module.exports=mongoose.model("homeImage",subcategoryShema);