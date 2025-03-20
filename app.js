const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const morgan = require("morgan");
const path = require('path')

var cookieParser = require("cookie-parser");
//Db Connection
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.set('strictQuery', false);
mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database Connected........."))
  .catch((err) => console.log("Database Not Connected !!!"));

//import route
const user = require("./Routes/User/user");
const job = require("./Routes/Employers/company");
const otp = require("./Routes/User/otp");
const employer = require("./Routes/Employers/employer");
const admin = require("./Routes/Admin/admin");
const blog = require("./Routes/User/blogRoutes");
const chat = require("./Routes/User/chatbox");
const resume = require("./Routes/User/resume");
const category = require("./Routes/Admin/category");
const industry = require("./Routes/Admin/industry");
const graph =require('./Routes/Admin/graph')
const headingText =require('./Routes/Admin/headingText')
const notification =require('./Routes/Admin/notification')
const business =require('./Routes/Admin/business')
const ourclient=require("./Routes/Admin/ourclien");
const subadmin=require("./Routes/Admin/subadmin");

//middleware
app.use(morgan("dev"));
app.use(cors());
// app.use(express.static("Public"));
app.use(express.static(path.join(__dirname, 'Public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//create route,
app.use("/api/user", user);
app.use("/api/user", otp);
app.use("/api/user", job);
app.use("/api/admin", admin);
app.use("/api/admin", graph);
app.use("/api/admin", category);
app.use("/api/admin", industry);
app.use("/api/admin", ourclient);
app.use("/api/admin", headingText);
app.use("/api/admin", notification);
app.use("/api/admin", business);
app.use("/api/user", employer);
app.use("/api/user", blog);
app.use("/api/user", chat);
app.use("/api/user", resume);
app.use("/api/admin",subadmin);

const employerController=require("./Controller/Employers/employers");
const employeeController=require("./Controller/User/user");
setInterval(()=>{
  employerController.deleteOfline();
  employeeController.deleteOfline();
},60000)

const PORT = process.env.PORT || 8500;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
