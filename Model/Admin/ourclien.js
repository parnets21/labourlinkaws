const mongoose=require('mongoose');

const ourclientSchema=new mongoose.Schema({
    imageLogo:{
        type:String
    }
},{timestamps:true})

module.exports=mongoose.model("ourclient",ourclientSchema);