const mongoose=require('mongoose');

const industryShema=new mongoose.Schema({
    Industry:{
        type:String
    },
   
})

module.exports=mongoose.model("industry",industryShema);