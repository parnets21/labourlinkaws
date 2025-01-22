const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subadmin = new Schema({
    
    name:{
        type:String
    },
    email:{
        type:String
    },
    password:{
        type:String
    },
    mobile:{
        type:String
    },
    date:{
        type:String
    },
     profile:{
            type:String
        },
   
    Subscription:{
        type:String
    },
    rfqEnquiry:{
        type:String
    },
   
    payments:{
        type:String
    },
    graphics:{
        type:String
    },
    notification:{
        type:String
    },
    subadmin:{
        type:String
    },
    category:{
        type:String
    },
    services:{
        type:String
    },
   industries:{
        type:String
    },
    intrested:{
        type:String
    },
    employee:{
        type:String
    },
    employer:{
        type:String
    },
    home:{ type:String},
    appliedDetails:{
        type:String
    },
    PostedJob:{
        type:String
    },
    verifiedJob:{
        type:String
    },
    ourClient:{
        type:String
    },
    adminId:{ type:String}

})

const subadminModel = mongoose.model("subadmin", subadmin);
module.exports = subadminModel