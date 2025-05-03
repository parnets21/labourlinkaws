const applyModel=require('../../Model/Employers/apply');
const resumeModel = require('../../Model/User/resume');
const { uploadFile2, deleteFile } = require("../../middileware/aws");

class resume {
    async resumeRegister(req, res) {
        try {
            const {mobile,userId,age,name,email,street,city,state,profile,pincode,gender}=req.body
            let resume=await resumeModel.findOne({userId:userId})
            if(resume) return res.status(200).json({success:"Already created!"})
     
            await resumeModel.create({mobile,userId,age,name,email,profile,street,city,state,pincode,gender})
            return res.status(200).json({success:"Successfully registered"})
        } catch (err) {
            console.log(err);
        }
    }
    async editResume(req,res){
        try{
            
            const {userId,singn,declearation,certificate,dateOfbirth,INTERESTS,reference,Hobbies,nationality,templet,ProfessionalSummary,drivingLicense,birthofPlace,jobTitle,mobile,age,name,email,street,city,state,pincode,gender}=req.body
            let obj={}
            if(mobile){
             obj['mobile']=mobile;
            }
            if(email){
                obj['email']=email;
            }
             if(singn){
                obj['singn']=singn;
            }
          if(declearation){
                obj['declearation']=declearation;
            }
            if(INTERESTS){
                obj['INTERESTS']=INTERESTS;
            }
           
            if(jobTitle){
                obj['jobTitle']=jobTitle;
            }
            if(name){
                obj['name']=name;
            }
            if(Hobbies){
                obj['Hobbies']=Hobbies;
            }
            if(reference){
                obj['reference']=reference;
            }
            if(nationality){
                obj['nationality']=nationality;
            }
            if(dateOfbirth){
                obj['dateOfbirth']=dateOfbirth;
            }
            if(birthofPlace){
                obj['birthofPlace']=birthofPlace;
            }
            if(drivingLicense){
                obj['drivingLicense']=drivingLicense;
            }
            if(ProfessionalSummary){
                obj['ProfessionalSummary']=ProfessionalSummary;
            }
            if(templet){
                obj['templet']=templet;
            }
            if(age){
                obj['age']=age;
            }
            if(gender){
                obj['gender']=gender
            }
            if(street){
                obj['street']=street
            }
            if(city){
                obj['city']=city
            }
            if(state){
                obj['state']=state
            }
            if(pincode){
                obj['pincode']=pincode
            }
        
            // Get existing resume to check for profile that might need to be deleted
            const existingResume = await resumeModel.findOne({userId: userId});
           
            if (req.files && req.files.length > 0) {
                // Find profile file
                const profileFile = req.files.find(file => file.fieldname === "profile");
                
                if (profileFile) {
                    try {
                        // If existing profile is an S3 URL, delete it
                        if (existingResume && existingResume.profile && existingResume.profile.startsWith('https://')) {
                            try {
                                await deleteFile(existingResume.profile);
                            } catch (deleteError) {
                                console.warn("Could not delete old profile:", deleteError);
                                // Continue with the update even if delete fails
                            }
                        }
                        
                        // Upload new profile to S3
                        const profileUrl = await uploadFile2(profileFile, "resume-profiles");
                        obj["profile"] = profileUrl;
                    } catch (uploadError) {
                        console.error("Error uploading profile to S3:", uploadError);
                        return res.status(500).json({ 
                            success: false, 
                            msg: "Failed to upload profile image", 
                            error: uploadError.message 
                        });
                    }
                }
            }
           
            let updateUser = await resumeModel.findOneAndUpdate({userId:userId},{$set:obj},{new:true});
            if(!updateUser) return res.status(400).json({msg:"Something went wrong"});
            return res.status(200).json({msg:"Successfully updated",success:updateUser})  
        }catch(err){
            console.log(err);
            return res.status(500).json({msg:"Internal server error", error: err.message});
        }
    }
    async AddSkill(req,res){
        try{
            const {skill,userId,level}=req.body;
            let obj={skill,level}
        
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$push:{skillSet:obj}},{new:true});
            if(!add)return res.status(400).json({error:"Something went worng"});
            return res.status(200).json({success:"Successfully added"})
        }catch(err){
            console.log(err);
        }
    }
    async removeSkill(req,res){
        try{
            let removeId=req.params.removeId;
            let userId=req.params.userId;
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$pull:{skillSet:{_id:removeId}}},{new:true});
            if(!add)return res.status(400).json({error:"Something went worng"});
            return res.status(200).json({success:"Successfully deleted"})   ;
        }catch(err){
            console.log(err);
        }
    }
    async addlang(req,res){
        try{
            const {LANGUAGES,userId,level}=req.body;
            let obj={LANGUAGES,level}
        
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$push:{langset:obj}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully added"})
        }catch(err){
            console.log(err);
        }
    }
    async removelang(req,res){
        try{
            let removeId=req.params.removeId;
            let userId=req.params.userId;
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$pull:{langset:{_id:removeId}}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully deleted"})   ;
        }catch(err){
            console.log(err);
        }
    }
    async AddEducation(req,res){
        try{
            const {Institue,userId,starting,Course,Location}=req.body;
            let obj={Institue,Course,Location,starting}
        
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$push:{education:obj}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully added"})
        }catch(err){
            console.log(err);
        }
    }
    async removeEducation(req,res){
        try{
            let removeId=req.params.removeId;
            let userId=req.params.userId;
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$pull:{education:{_id:removeId}}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully deleted"})   ;
        }catch(err){
            console.log(err);
        }
    }
    async addWorkExperience(req,res){
        try{
            const {Company,userId,workPlace,position,session}=req.body;
            let obj={Company,workPlace,position,session}
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$push:{workAndExperience:obj}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully added"})
        }catch(err){
            console.log(err);
        }
    }
    async removeWorkExperience(req,res){
        try{
            let removeId=req.params.removeId;
            let userId=req.params.userId;
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$pull:{workAndExperience:{_id:removeId}}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully deleted"})   ;
        }catch(err){
            console.log(err);
        }
    }
    async addProject(req,res){
        try{
            const {projectName,userId,projectLink,discription,DateOftime}=req.body;
            let obj={projectName,projectLink,discription,DateOftime}
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$push:{addProject:obj}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully added"})
        }catch(err){
            console.log(err);
        }
    }
    async removeproject(req,res){
        try{
            let removeId=req.params.removeId;
            let userId=req.params.userId;
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$pull:{addProject:{_id:removeId}}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully deleted"})   ;
        }catch(err){
            console.log(err);
        }
    }
    
     async addCertificatel(req,res){
        try{
            const {certificate,userId}=req.body;
            let obj={certificate}
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$push:{certificate:obj}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully added"})
        }catch(err){
            console.log(err);
        }
    }
    async removeCertificate(req,res){

        try{
            let removeId=req.params.removeId;
            let userId=req.params.userId;
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$pull:{certificate:{_id:removeId}}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully deleted"})   ;
        }catch(err){
            console.log(err);
        }
    }
    
        async addSkiilSummery(req,res){
        try{
            const {summery,userId}=req.body;
            let obj={summery}
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$push:{SkiilSummery:obj}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully added"})
        }catch(err){
            console.log(err);
        }
    }
    async removeSkiilSummery(req,res){
        try{
            let removeId=req.params.removeId;
            let userId=req.params.userId;
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$pull:{SkiilSummery:{_id:removeId}}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully deleted"})   ;
        }catch(err){
            console.log(err);
        }
    }
    
    // async addwebSiteAndSocial(req,res){
    //     try{
    //         const {label,userId,link}=req.body;
    //         let obj={link,label}
    //         let add=await resumeModel.findOneAndUpdate({userId:userId},{$push:{webSiteAndSocial:obj}},{new:true});
    //         if(!add)return res.status(400).json({success:"Something went worng"});
    //         return res.status(200).json({success:"Successfully added"})
    //     }catch(err){
    //         console.log(err);
    //     }
    // }
    // async removewebSiteAndSocial(req,res){
    //     try{
    //         let removeId=req.params.removeId;
    //         let userId=req.params.userId;
    //         let add=await resumeModel.findOneAndUpdate({userId:userId},{$pull:{webSiteAndSocial:{_id:removeId}}},{new:true});
    //         if(!add)return res.status(400).json({success:"Something went worng"});
    //         return res.status(200).json({success:"Successfully deleted"})   ;
    //     }catch(err){
    //         console.log(err);
    //     }
    // }
    // async addcustumsection(req,res){
    //     try{
    //         const {label,userId,activite,start,city,passOut,discription}=req.body;
    //         let obj={label,start,activite,city,passOut,discription}
    //         let add=await resumeModel.findOneAndUpdate({userId:userId},{$push:{custumsection:obj}},{new:true});
    //         if(!add)return res.status(400).json({success:"Something went worng"});
    //         return res.status(200).json({success:"Successfully added"})
    //     }catch(err){
    //         console.log(err);
    //     }
    // }
    // async removecustumsection(req,res){
    //     try{
    //         let removeId=req.params.removeId;
    //         let userId=req.params.userId;
    //         let add=await resumeModel.findOneAndUpdate({userId:userId},{$pull:{custumsection:{_id:removeId}}},{new:true});
    //         if(!add)return res.status(400).json({success:"Something went worng"});
    //         return res.status(200).json({success:"Successfully deleted"})   ;
    //     }catch(err){
    //         console.log(err);
    //     }
    // }
    // async addextraActivies(req,res){
    //     try{
    //         const {label,userId,activite,start,city,passOut,discription}=req.body;
    //         let obj={label,start,activite,city,passOut,discription}
    //         let add=await resumeModel.findOneAndUpdate({userId:userId},{$push:{extraActivies:obj}},{new:true});
    //         if(!add)return res.status(400).json({success:"Something went worng"});
    //         return res.status(200).json({success:"Successfully added"})
    //     }catch(err){
    //         console.log(err);
    //     }
    // }
    // async removeextraActivies(req,res){
    //     try{
    //         let removeId=req.params.removeId;
    //         let userId=req.params.userId;
    //         let add=await resumeModel.findOneAndUpdate({userId:userId},{$pull:{extraActivies:{_id:removeId}}},{new:true});
    //         if(!add)return res.status(400).json({success:"Something went worng"});
    //         return res.status(200).json({success:"Successfully deleted"})   ;
    //     }catch(err){
    //         console.log(err);
    //     }
    // }
    async addCourse(req,res){
        try{
            const {userId,achiveName,discription,session}=req.body;
            let obj={achiveName,discription,session}
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$push:{ACHIEVEMENTS:obj}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully added"})
        }catch(err){
            console.log(err);
        }
    }
    async removeCourse(req,res){
        try{
            let removeId=req.params.removeId;
            let userId=req.params.userId;
            let add=await resumeModel.findOneAndUpdate({userId:userId},{$pull:{ACHIEVEMENTS:{_id:removeId}}},{new:true});
            if(!add)return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:"Successfully deleted"})   ;
        }catch(err){
            console.log(err);
        }
    }
    async getAllResume(req,res){
        try{
            let findData=await resumeModel.find().sort({_id:-1});
            if(findData.length<=0) return res.status(400).json({success:"Data not found"});
            // let am=findData.map(i=>{return i.email})
            // console.log(send.sendMail("Amit",am,"hi dost"));
            return res.status(200).json({success:findData})
        }catch(err){
            console.log(err);
        }
    }
   

    async deleteResume(req,res){
        try{
            let userId=req.params.userId;
            let data=await resumeModel.deleteOne({userId:userId});
            if(data.deletedCount<=0) return res.status(404).json({success:"data not found"});
            return res.status(200).json({success:"Successfully deleted"})
        }catch(err){
            console.log(err);
        }
    }
  

    async getResumeByuser(req,res){
        try{
            let userId=req.params.userId;
            let data=await resumeModel.findOne({userId:userId});
            if(!data) return res.status(400).json({success:"data not found"});
            return res.status(200).json({success:data})
        }catch(err){
            console.log(err);
        }
    }
}

module.exports = new resume()