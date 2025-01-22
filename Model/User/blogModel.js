
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema.Types;

const blogsSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        body: {
            type: String,
           
        },
       
        body2: {
            type: String,
           
        },
        body3: {
            type: String,
           
        },
        
        adminId: {
            type: String,
            // ref: "Admin",  
        },

        sellerId:{
            type: String,
            // ref: "user",
        },
        authorName:{
            type:String
        },
        authorImage:{
            type:String
        },

        tag:{
            type:String
        },
   
        subcategory: {
            type:String
        },
        image: {
            type:String
        },
        image1: {
            type:String
        },
       
           tranding:{
            type:Boolean,
            default:false
        },
        count:{
            type:Number,
            default:0
        },
        populer:{
            type:Number,
            default:0
        },

    }, { timestamps: true })
    const blogModel = mongoose.model("blog", blogsSchema);
    module.exports = blogModel;