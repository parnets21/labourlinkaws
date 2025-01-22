const mongoose=require('mongoose');

const categoryShema=new mongoose.Schema({
    Industry:{
        type:String
    },
    category:{
        type:String
    }
})

module.exports=mongoose.model("category",categoryShema);