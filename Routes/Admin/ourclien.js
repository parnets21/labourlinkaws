const express=require('express');
const router=express.Router();
const multer = require("multer");
const ourclientController=require("../../Controller/Admin/ourclien");
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "Public/ourclient");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "_" + file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });
  
router.post("/addOurClient",upload.any(),ourclientController.addOurClient);
router.get("/getAllOurClient",ourclientController.getAllOurClient);
router.delete("/deleteOurClients/:Id",ourclientController.deleteOurClients);

module.exports=router;