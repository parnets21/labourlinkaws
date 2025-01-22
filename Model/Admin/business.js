const mongoose=require('mongoose');

const  businessShema=new mongoose.Schema({
    text:{type:String}
})
module.exports=mongoose.model("business",businessShema);