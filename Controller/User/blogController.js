const blogModel=require('../../Model/User/blogModel');
// const Validator=require('../../Config/function');
const commentModel=require("../../Model/User/blogComment");
const { uploadFile2, deleteFile } = require("../../middileware/aws");

class blogcreate {
  //create blog
    async blogcreate(req, res) {
      try {
        let {title,authorName,authorImage,body,body2,body3,tag,subcategory,adminId,sellerId}=req.body
        let obj={title,authorName,authorImage,body,body2,body3,tag,subcategory,adminId,sellerId}
        
        if (req.files && req.files.length > 0) {
          const uploadPromises = [];
          
          // Find image and image1 files
          const imageFile = req.files.find(file => file.fieldname === "image");
          const image1File = req.files.find(file => file.fieldname === "image1");
          
          // Upload image to S3 if it exists
          if (imageFile) {
            const uploadPromise = uploadFile2(imageFile, "blog-images")
              .then(imageUrl => {
                obj["image"] = imageUrl;
              })
              .catch(error => {
                console.error("Error uploading image to S3:", error);
                throw new Error(`Failed to upload image: ${error.message}`);
              });
            
            uploadPromises.push(uploadPromise);
          }
          
          // Upload image1 to S3 if it exists
          if (image1File) {
            const uploadPromise = uploadFile2(image1File, "blog-images")
              .then(imageUrl => {
                obj["image1"] = imageUrl;
              })
              .catch(error => {
                console.error("Error uploading image1 to S3:", error);
                throw new Error(`Failed to upload image1: ${error.message}`);
              });
            
            uploadPromises.push(uploadPromise);
          }
          
          // Wait for all uploads to complete
          await Promise.all(uploadPromises);
        }
        
        console.log(obj);
            let blogs = new blogModel(obj);
        await blogs.save();
        return res.status(200).json({ success: true, message: "Successfully blog posted" });
        } catch (error) {
          console.error("Error creating blog:", error);
          return res.status(500).json({ success: false, message: "Failed to create blog", error: error.message });
        }
      }
//getblog
      async getBlogs(req, res) {
        let blogList = await blogModel.find({})
        // .populate('sellerId');
        //.populate('adminId');
        if (blogList) {
          return res.status(200).json({ blog: blogList });
        } else {
          return res.status(500).json({ error: "something went wrong" });
        }
      }
      async letestPlog(req,res){
        try{
            let blogList = await blogModel.find({}).sort({_id:-1}).limit(10)
            // .populate('sellerId');
            //.populate('adminId');
            if (blogList) {
              return res.status(200).json({ blog: blogList });
            } else {
              return res.status(500).json({ error: "something went wrong" });
            }
        }catch(err){
            console.log(err.message)
        }
      }
//delete blog
      async getBlogsById(req,res){
        try{
          let blogId=req.params.blogId
        
          console.log(blogId)
          let blogone=await blogModel.findById(blogId)
             // .populate('sellerId');
            //.populate('adminId');
          if(!blogone) return res.status(404).json({error:"blog is not Found"});
          await blogModel.findOneAndUpdate({_id:blogId},{$set:{populer:blogone.populer+1}},{new:true});
          if(blogone.tranding==false){
          if(blogone.count!=10){
 
          await blogModel.findByIdAndUpdate({_id:blogId},{$set:{count:blogone.count+1}},{new:true})
        }else{
          await blogModel.findOneAndUpdate({_id:blogId},{$set:{tranding:true}},{new:true});
        }}
          return res.status(200).json({status:true,Success:blogone});

        }catch(err){
          console.log(err)
        }
      }
//get populer blog
      async populerBlog(req,res){
        try{
            let blog =await blogModel.find({createdAt:{$gte : new Date(Date.now() - 1000 * 3600 * 24 * 7) }}).sort({populer:-1})
            if(blog.length<=0) return res.status(404).json({status:false,msg:"No blog found"});
            return res.status(200).json({Success:blog})
         }catch(err){
            console.log(err.message)
        }
      }

//update blog
      async updateBlog(req,res){
        try{
          let blogId=req.params.blogId
       
          let {title,body,body2,body3,tag,subcategory}=req.body

          // Get existing blog to check for images that need to be deleted
          const existingBlog = await blogModel.findById(blogId);
          if (!existingBlog) {
            return res.status(404).json({ status: false, message: "Blog not found" });
          }

          let obj={}
          if(title){
            obj['title']=title
          }
          if(body){
            obj['body']=body;
          }
          if(body2){
            obj['body2']=body2;
          }
          if(body3){
            obj['body3']=body3;
          }
          if(tag){
            obj['tag']=tag
          }
          if(subcategory){
            obj['subcategory']=subcategory
          }
         
          if (req.files && req.files.length > 0) {
            const uploadPromises = [];
            
            // Find image and image1 files
            const imageFile = req.files.find(file => file.fieldname === "image");
            const image1File = req.files.find(file => file.fieldname === "image1");
            
            // Upload new image and delete old one if it exists
            if (imageFile) {
              // Delete old image from S3 if it exists and is an S3 URL
              if (existingBlog.image && existingBlog.image.startsWith('https://')) {
                try {
                  await deleteFile(existingBlog.image);
                } catch (deleteError) {
                  console.warn("Could not delete old image:", deleteError);
                  // Continue with the update even if delete fails
                }
              }
              
              // Upload new image
              const uploadPromise = uploadFile2(imageFile, "blog-images")
                .then(imageUrl => {
                  obj["image"] = imageUrl;
                })
                .catch(error => {
                  console.error("Error uploading image to S3:", error);
                  throw new Error(`Failed to upload image: ${error.message}`);
                });
              
              uploadPromises.push(uploadPromise);
            }
            
            // Upload new image1 and delete old one if it exists
            if (image1File) {
              // Delete old image1 from S3 if it exists and is an S3 URL
              if (existingBlog.image1 && existingBlog.image1.startsWith('https://')) {
                try {
                  await deleteFile(existingBlog.image1);
                } catch (deleteError) {
                  console.warn("Could not delete old image1:", deleteError);
                  // Continue with the update even if delete fails
                }
              }
              
              // Upload new image1
              const uploadPromise = uploadFile2(image1File, "blog-images")
                .then(imageUrl => {
                  obj["image1"] = imageUrl;
                })
                .catch(error => {
                  console.error("Error uploading image1 to S3:", error);
                  throw new Error(`Failed to upload image1: ${error.message}`);
                });
              
              uploadPromises.push(uploadPromise);
            }
            
            // Wait for all uploads to complete
            await Promise.all(uploadPromises);
          }
          console.log(obj)
         
          let blogubdate=await blogModel.findOneAndUpdate({_id:blogId},{$set:obj},{new:true})
          if(!blogubdate) return res.status(400).json({status:false,msg:"Samething went worng"})

          return res.status(200).json({status:true,msg:"Successfully updated blog", data: blogubdate})
        }catch(err){
          console.error("Error updating blog:", err);
          return res.status(500).json({ status: false, message: "Internal server error", error: err.message });
        }
      } 
//delete blog
      async deleteBlog(req,res){
        try{
          let blogId=req.params.blogId
       
          // Get the blog to be deleted so we can delete its images from S3
          const blogToDelete = await blogModel.findById(blogId);
          if (!blogToDelete) {
            return res.status(404).json({ status: false, message: "Blog not found" });
          }
          
          // Delete images from S3 if they exist and are S3 URLs
          const deletePromises = [];
          
          if (blogToDelete.image && blogToDelete.image.startsWith('https://')) {
            deletePromises.push(deleteFile(blogToDelete.image));
          }
          
          if (blogToDelete.image1 && blogToDelete.image1.startsWith('https://')) {
            deletePromises.push(deleteFile(blogToDelete.image1));
          }
          
          // Wait for all deletes to complete
          await Promise.all(deletePromises);
          
          // Delete the blog from database
          let check= await blogModel.deleteOne(blogId);

          if(check.deletedCount==0){
            return res.status(400).json({status:false,msg:"Blog is already delete"});
          }else{
          return res.status(200).json({status:false,msg:"Blog  Successfully deleted"});
          }
        }catch(err){
          console.error("Error deleting blog:", err);
          return res.status(500).json({ status: false, message: "Internal server error", error: err.message });
        }
      }
//get by category blog
      async getByCategorey (req,res){
        try{
          let category=req.query.category
          let blog=await blogModel.find({category:category})
            // .populate('sellerId');
            //.populate('adminId');
          if(blog.length <=0) return res.status(404).json({status:false,msg:"blog not found"})

          return res.status(200).json({status:true,count:blog.length,data:blog});
        }catch(err){
          console.log(err.message)
        }
      }
//tranding Api blog
      async blogTranding(req,res){
        try{
          let trandBlog=await blogModel.find({tranding:true}).sort({_id:-1});
          if(trandBlog.length<=0) return res.status(404).json({status:false,msg:"No tranding Blog"});
          return res.status(200).json({status:true,count:trandBlog.length,data:trandBlog})
        }catch{err}{
          console.log(err.message)
        }
      }
      

// add comments
async addComments(req,res){
    try{
       const {blogId,userId,comment,userName,userImage}=req.body;
     if(!comment){
      return res.status(400).json({error:"comment is require!"})
     }
        let comments=await commentModel.create({blogId,userId,comment,userName,userImage})
        //.populate('comments.userId')
        if(!comments) return res.status(400).json({error:"Samthing went worng"});
        return res.status(200).json({Success:"Successfully commented"})
    }catch(err){
        console.log(err.message)
    }
}
// delete comment
async deletecomment(req,res){
    try{
      
        let commentId=req.params.commentId;
      
        let comments=await commentModel.deleteOne({_id:commentId})
          //.populate('comments.userId')
        if(comments.deletedCount===0) return res.status(400).json({error:"Samthing went worng"});
        return res.status(201).json({success:"Successfully comment deleted"})
    }catch(err){
        console.log(err.message)
    }
}

async getallComment(req,res){
  try {
    let allData=await commentModel.find()
    return res.status(200).json({success:allData})
  } catch (error) {
    console.log(error)
  }
}
async getallCommentByblogId(req,res){
  try {
    let blogId=req.params.blogId
    let allData=await commentModel.find({blogId:blogId})
    return res.status(200).json({success:allData})
  } catch (error) {
    console.log(error)
  }
}
      
    }
    const blogController = new blogcreate();
    module.exports = blogController;
    