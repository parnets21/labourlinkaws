const mongoose=require("mongoose")
const Schema = mongoose.Schema;
const subadminInterview = new  Schema(
  {
      email:{
          type:String
      },
      password:{
          type:String
      },
  }
)

module.exports= mongoose.model("subadmininterview", subadminInterview);
