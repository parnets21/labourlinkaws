const adminModel=require('../../Model/Admin/admin');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

class admin{
    // async register(req,res){
    //     try{
    //         const {mobile,name,userName,email,password,gender}=req.body;
          
    //         let encryptedPassword = bcrypt.hash(password, saltRounds)
    //         .then((hash) => {
    //           return hash;
    //         });
    //         let pwd = await encryptedPassword;

    //         let obj={mobile,name,userName,email,password:pwd,gender};

    //         if (req.files.length != 0) {
    //             let arr = req.files
    //             let i
    //             for (i = 0; i < arr.length; i++) {
    //                 if (arr[i].fieldname == "profile") {
    //                     obj["profile"] = arr[i].filename
    //                 }
    //             }}

    //         await adminModel.create(obj)
    //         return res.status(200).json({success:"Successfully register"})
    //     }catch(err){
    //         console.log(err);
    //     }
    // }
    async register(req, res) {
        try {
            const { mobile, name, userName, email, password, gender } = req.body;
    
            let pwd = await bcrypt.hash(password, saltRounds);
    
            let obj = { mobile, name, userName, email, password: pwd, gender };
    
            if (req.files && req.files.length > 0) {
                for (let file of req.files) {
                    if (file.fieldname === "profile") {
                        obj["profile"] = file.filename;
                    }
                }
            }
    
            await adminModel.create(obj);
            return res.status(200).json({ success: "Successfully registered" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    
    async login(req,res){
        try{
            const {email,password}=req.body;

            let check =await adminModel.findOne({$or:[{email:email},{userName:email}]});
            if(!check) return res.status(400).json({error:"Please enter register email Id!"});

             let compare = await bcrypt.compare(password, check.password).then((res) => {
                return res
              });
          
              if (!compare) {return res.status(400).send({error: "Invalid password!" });}

            return res.status(200).json({msg:"Successfully login",success:check});
        }catch(err){
            console.log(err);
        }
    }
     async changepassword(req,res){
        try{
            const {userId,password,cpassword}=req.body;
             let obj = {}

             if (password) {
                if(password!==cpassword){
                    return res.status(400).json({error:"Password did not match!"})
                }
                let encryptedPassword = bcrypt.hash(password, saltRounds)
                    .then((hash) => {
                        return hash;
                    });
                let pwd = await encryptedPassword;

                obj["password"] = pwd;
            }
            let updateUser = await adminModel.findOneAndUpdate({ _id: userId }, { $set: obj }, { new: true });
            if (!updateUser) return res.status(400).json({ error: "Something went worng" });
            return res.status(200).json({ msg: "Successfully updated", success: updateUser })
        } catch (err) {
            console.log(err);
        }
    }
    async editAdmin(req,res){
        try{
            const {mobile,name,userName,email,password,gender,adminId}=req.body;
            let obj={}
            if(mobile){
                obj["mobile"]=mobile
            }
            if(name){
                obj["name"]=name
            }
            if(userName){
                obj["userName"]=userName
            }
            if(email){
                obj["email"]=email
            }
            if(password){
                let encryptedPassword = bcrypt.hash(password, saltRounds)
                .then((hash) => {
                  return hash;
                });
                let pwd = await encryptedPassword;
                obj["password"]=pwd;
            }
            if(gender){
                obj["gender"]=gender
            }
            if (req.files.length != 0) {
                let arr = req.files
                let i
                for (i = 0; i < arr.length; i++) {
                    if (arr[i].fieldname == "profile") {
                        obj["profile"] = arr[i].filename
                    }
                }}

        let update =await adminModel.findOneAndUpdate({_id:adminId},{$set:obj},{new:true});
            if(!update) return res.status(400).json({success:"Something went worng"});
            return res.status(200).json({success:update})
        }catch(err){
            console.log(err);
        }
    }
}
module.exports=new admin();