const mongoose=require('mongoose');

const commentSchema=new mongoose.Schema({
    comment:{type:String},
    userId:{
        type:String,
        // ref:'user'
    },
    blogId:{
        type:String
    },
    userName:{
        type:String
    },
    userImage:{
        type:String
    }
},{timestamps:true})

module.exports=mongoose.model("commentBlog",commentSchema);