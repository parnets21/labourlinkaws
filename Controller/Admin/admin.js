const adminModel=require('../../Model/Admin/admin');
const Feedback=require('../../Model/Admin/feedback')
const bcrypt = require('bcryptjs');
const Appointment=require('../../Model/Admin/slotbook')
const userModel =require("../../Model/User/user")
const subadmininterview =require("../../Model/Admin/subadminInterview")
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

            let check =await adminModel.findOne({$or:[{email:email}]});
            if(!check) return res.status(400).json({error:"Please enter register email Id!"});

             let compare = await bcrypt.compare(password, check.password).then((res) => {
                return res
              });
          
              if (!compare) {return res.status(400).send({error: "Invalid password!" });}

            return res.status(200).json({msg:"Successfully login",success:check});
        }catch(err){
            return res.status(400).json({msg:"error login",message:err.message});
            // console.log(err);
        }
    }
    //subadminlogininterview

    async subadminlogininterview (req ,res){
      try{

        const  {email ,password}=req.body
        let check =await subadmininterview.findOne({$or:[{email:email}]})
        if(!check) return res.status(400).json({error:"Please enter register email Id!"});
        let compare = await bcrypt.compare(password, check.password).then((res) => {
          return res
        });
    
        if (!compare) {return res.status(400).send({error: "Invalid password!" });}
  
      return res.status(200).json({msg:"Successfully login",success:check});
      }catch(err){
        return res.status(400).json({msg:"error login",message:err.message});


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
    async createAppointment(req, res) {
      try {
        const { date, time, duration } = req.body;
    
        const appointment = new Appointment({
          date,
          time,
          duration,
          status: "available"
        });
        console.log(appointment,"this is hi")
    
        await appointment.save();
    
        res.status(200).json(appointment);
      } catch (err) {
        console.log(err,"this is err")
        res.status(400).json({ error: err.message });
      }
    }
    
    
      
      // GET ALL
      async getAppointments  (req, res){
        try {
          const appointments = await Appointment.find();
          res.status(200).json(appointments);
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      };
      
      // GET ONE
      async getAppointmentById  (req, res){
        try {
          const appointment = await Appointment.findById(req.params.id);
          if (!appointment) return res.status(404).json({ message: 'Not found' });
          res.status(200).json(appointment);
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      };
      
      // UPDATE
      async updateAppointment  (req, res) {
        try {
          const { date, time, duration } = req.body;
          const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { date, time, duration },
            { new: true }
          );
          if (!appointment) return res.status(404).json({ message: 'Not found' });
          res.status(200).json(appointment);
        } catch (err) {
          res.status(400).json({ error: err.message });
        }
      };
      
      async deleteAppointment(req, res) {
        try {
          const { id } = req.params; // expecting `_id` from the route
      
          const appointment = await Appointment.findByIdAndDelete(id);
      
          if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
          }
      
          res.status(200).json({ message: 'Deleted successfully', deletedId: id });
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      }

      async createFeedback  (req, res){
        try {
          const { name, email, rating,communationskill, message } = req.body;
      
          if (!message || !communationskill) return res.status(400).json({ success: false, error: "Message is required" });
      
          const feedback = await Feedback.create({ name, email, communationskill,rating, message });
      
          res.status(201).json({ success: true, feedback });
        } catch (error) {
          console.error("Create Feedback Error:", error);
          res.status(500).json({ success: false, error: "Server error" });
        }
      };
      
      // GET /api/feedback
      async getAllFeedback  (req, res) {
        try {
          const feedbacks = await Feedback.find().sort({ createdAt: -1 });
          res.json({ success: true, feedbacks });
        } catch (error) {
          console.error("Fetch Feedback Error:", error);
          res.status(500).json({ success: false, error: "Server error" });
        }
      };
      
      async sendNotification  (req, res)  {
        const { userId, title, body } = req.body;
      
        if (!userId || !title || !body) {
          return res.status(400).json({ success: false, message: 'Missing fields' });
        }
      
        try {
          const user = await userModel.findById(userId);
          if (!user || !user.fcmToken) {
            return res.status(404).json({ success: false, message: 'User or FCM token not found' });
          }
      
          const message = {
            notification: {
              title,
              body
            },
            token: user.fcmToken
          };
      
          const response = await admin.messaging().send(message);
          return res.status(200).json({ success: true, message: 'Notification sent', response });
      
        } catch (error) {
          console.error('FCM Notification Error:', error);
          return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
      };
      
      
}
module.exports=new admin();