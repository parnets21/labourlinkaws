const careerModel = require('../../Model/User/career');
const { uploadFile2, deleteFile } = require("../../middileware/aws");
// const Validator=require('../../Config/function');


class career {

    async careerAdd(req, res) {
        try {
            let { title, category, subcategory, description, adminId } = req.body
            let obj = { title, category, description, subcategory, adminId }
            
            if (req.files && req.files.length > 0) {
                const uploadPromises = [];
                
                // Find different file types
                const imageFile = req.files.find(file => file.fieldname === "image");
                const image1File = req.files.find(file => file.fieldname === "image1");
                const videoFile = req.files.find(file => file.fieldname === "video");
                const video1File = req.files.find(file => file.fieldname === "video1");
                
                // Upload image to S3 if it exists
                if (imageFile) {
                    const uploadPromise = uploadFile2(imageFile, "career-files")
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
                    const uploadPromise = uploadFile2(image1File, "career-files")
                        .then(imageUrl => {
                            obj["image1"] = imageUrl;
                        })
                        .catch(error => {
                            console.error("Error uploading image1 to S3:", error);
                            throw new Error(`Failed to upload image1: ${error.message}`);
                        });
                    
                    uploadPromises.push(uploadPromise);
                }
                
                // Upload video to S3 if it exists
                if (videoFile) {
                    const uploadPromise = uploadFile2(videoFile, "career-files")
                        .then(videoUrl => {
                            obj["video"] = videoUrl;
                        })
                        .catch(error => {
                            console.error("Error uploading video to S3:", error);
                            throw new Error(`Failed to upload video: ${error.message}`);
                        });
                    
                    uploadPromises.push(uploadPromise);
                }
                
                // Upload video1 to S3 if it exists
                if (video1File) {
                    const uploadPromise = uploadFile2(video1File, "career-files")
                        .then(videoUrl => {
                            obj["video1"] = videoUrl;
                        })
                        .catch(error => {
                            console.error("Error uploading video1 to S3:", error);
                            throw new Error(`Failed to upload video1: ${error.message}`);
                        });
                    
                    uploadPromises.push(uploadPromise);
                }
                
                // Wait for all uploads to complete
                await Promise.all(uploadPromises);
            }

            let career = new careerModel(obj);
            career.save().then((data) => {
                console.log(data);
                return res.status(200).json({ Success: "Successfully career posted" });
            });
        } catch (error) {
            console.error("Error creating career:", error);
            return res.status(500).json({ success: false, message: "Failed to create career", error: error.message });
        }
    }

    async getCareer(req, res) {
        let data = await careerModel.find({})
            .populate('adminId');
        if (data.length != 0) {
            return res.status(200).json({ success: data });
        } else {
            return res.status(500).json({ success: "data not found" });
        }
    }
    
    async updateCareer(req, res) {
        try {
            let careerId = req.params.careerId

            let { description, title, category, subcategory } = req.body

            // Get existing career to check for files that need to be deleted
            const existingCareer = await careerModel.findById(careerId);
            if (!existingCareer) {
                return res.status(404).json({ status: false, message: "Career not found" });
            }

            let obj = {}
            if (title) {
                obj['title'] = title
            }
            if (description) {
                obj['description'] = description;
            }
            if (category) {
                obj['category'] = category
            }
            if (subcategory) {
                obj['subcategory'] = subcategory
            }

            if (req.files && req.files.length > 0) {
                const uploadPromises = [];
                
                // Find different file types
                const imageFile = req.files.find(file => file.fieldname === "image");
                const image1File = req.files.find(file => file.fieldname === "image1");
                const videoFile = req.files.find(file => file.fieldname === "video");
                const video1File = req.files.find(file => file.fieldname === "video1");
                
                // Upload new image and delete old one if it exists
                if (imageFile) {
                    // Delete old image from S3 if it exists and is an S3 URL
                    if (existingCareer.image && existingCareer.image.startsWith('https://')) {
                        try {
                            await deleteFile(existingCareer.image);
                        } catch (deleteError) {
                            console.warn("Could not delete old image:", deleteError);
                            // Continue with the update even if delete fails
                        }
                    }
                    
                    // Upload new image
                    const uploadPromise = uploadFile2(imageFile, "career-files")
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
                    if (existingCareer.image1 && existingCareer.image1.startsWith('https://')) {
                        try {
                            await deleteFile(existingCareer.image1);
                        } catch (deleteError) {
                            console.warn("Could not delete old image1:", deleteError);
                            // Continue with the update even if delete fails
                        }
                    }
                    
                    // Upload new image1
                    const uploadPromise = uploadFile2(image1File, "career-files")
                        .then(imageUrl => {
                            obj["image1"] = imageUrl;
                        })
                        .catch(error => {
                            console.error("Error uploading image1 to S3:", error);
                            throw new Error(`Failed to upload image1: ${error.message}`);
                        });
                    
                    uploadPromises.push(uploadPromise);
                }
                
                // Upload new video and delete old one if it exists
                if (videoFile) {
                    // Delete old video from S3 if it exists and is an S3 URL
                    if (existingCareer.video && existingCareer.video.startsWith('https://')) {
                        try {
                            await deleteFile(existingCareer.video);
                        } catch (deleteError) {
                            console.warn("Could not delete old video:", deleteError);
                            // Continue with the update even if delete fails
                        }
                    }
                    
                    // Upload new video
                    const uploadPromise = uploadFile2(videoFile, "career-files")
                        .then(videoUrl => {
                            obj["video"] = videoUrl;
                        })
                        .catch(error => {
                            console.error("Error uploading video to S3:", error);
                            throw new Error(`Failed to upload video: ${error.message}`);
                        });
                    
                    uploadPromises.push(uploadPromise);
                }
                
                // Upload new video1 and delete old one if it exists
                if (video1File) {
                    // Delete old video1 from S3 if it exists and is an S3 URL
                    if (existingCareer.video1 && existingCareer.video1.startsWith('https://')) {
                        try {
                            await deleteFile(existingCareer.video1);
                        } catch (deleteError) {
                            console.warn("Could not delete old video1:", deleteError);
                            // Continue with the update even if delete fails
                        }
                    }
                    
                    // Upload new video1
                    const uploadPromise = uploadFile2(video1File, "career-files")
                        .then(videoUrl => {
                            obj["video1"] = videoUrl;
                        })
                        .catch(error => {
                            console.error("Error uploading video1 to S3:", error);
                            throw new Error(`Failed to upload video1: ${error.message}`);
                        });
                    
                    uploadPromises.push(uploadPromise);
                }
                
                // Wait for all uploads to complete
                await Promise.all(uploadPromises);
            }
            
            let career = await careerModel.findOneAndUpdate({ _id: careerId }, { $set: obj }, { new: true })
            if (!career) return res.status(400).json({ msg: "Something went wrong" })

            return res.status(200).json({ status: true, msg: "Successfully updated" })
        } catch (err) {
            console.error("Error updating career:", err);
            return res.status(500).json({ success: false, message: "Failed to update career", error: err.message });
        }
    }

    async deleteCareer(req, res) {
        try {
            let careerId = req.params.careerId
            
            // Get career to delete associated files
            const existingCareer = await careerModel.findById(careerId);
            if (existingCareer) {
                // Delete files from S3 if they exist
                const filesToDelete = [
                    existingCareer.image,
                    existingCareer.image1,
                    existingCareer.video,
                    existingCareer.video1
                ].filter(file => file && file.startsWith('https://'));
                
                for (const file of filesToDelete) {
                    try {
                        await deleteFile(file);
                    } catch (deleteError) {
                        console.warn(`Could not delete file ${file}:`, deleteError);
                        // Continue with deletion even if file delete fails
                    }
                }
            }

            let check = await careerModel.deleteOne({ _id: careerId });

            if (check.deletedCount == 0) {
                return res.status(400).json({ status: false, msg: "career is already delete" });
            } else {
                return res.status(200).json({ status: true, msg: "Career Successfully deleted" });
            }
        } catch (err) {
            console.error("Error deleting career:", err);
            return res.status(500).json({ success: false, message: "Failed to delete career", error: err.message });
        }
    }
   
    async getCareerByCategorey(req, res) {
        try {
            let category = req.query.category
            let blog = await careerModel.find({ category: category })
            .populate('adminId');
            if (blog.length <= 0) return res.status(404).json({ status: false, msg: "data not found" })

            return res.status(200).json({ Success: blog });
        } catch (err) {
            console.log(err.message)
        }
    }
}
const careerController = new career();
module.exports = careerController;
