const mongoose=require('mongoose');

const  notificationShema=new mongoose.Schema({
    text:{type:String}
})
module.exports=mongoose.model("notification",notificationShema);