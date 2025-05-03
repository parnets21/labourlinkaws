const express = require("express");
const router = express.Router();
const blogController = require('../../Controller/User/blogController');
const multer = require("multer");

// Configure multer to use memory storage for S3 uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/createBlog", upload.any(), blogController.blogcreate);
router.get("/getblog", blogController.getBlogs);
router.get("/blogById/:blogId", blogController.getBlogsById);

router.put("/updateBlogByID/:blogId", upload.any(), blogController.updateBlog);
router.delete("deleteBlog/:blogId", blogController.deleteBlog);

router.get("/blogsByCategory", blogController.getByCategorey);
router.get("/blogTranding", blogController.blogTranding);
router.get('/populerBlog', blogController.populerBlog);
router.get('/letestBlog', blogController.letestPlog);

//comment on blog
//add comment
router.post('/blogComment', blogController.addComments);
//delete comments
router.delete('/blogComment/:commentId', blogController.deletecomment);
router.get("/getBlogAllcomment", blogController.getallComment);
router.get("/getAllCommentBy/:blogId", blogController.getallCommentByblogId);

module.exports = router;
