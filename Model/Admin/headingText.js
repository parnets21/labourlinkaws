const mongoose=require('mongoose');

const  headingTextShema=new mongoose.Schema({
    text1:{type:String}
})
module.exports=mongoose.model("headingtext",headingTextShema);