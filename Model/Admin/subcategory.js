const mongoose=require('mongoose');

const  subcategoryShema=new mongoose.Schema({
    category:{
        type:String
    },
    subcategory:{
        type:String
    }
})
module.exports=mongoose.model("subcategory",subcategoryShema);