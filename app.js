const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const morgan = require("morgan");
const path = require('path');
const locationRoutes = require('./Routes/User/location');
const { connectDB, setupConnectionEvents } = require('./Config/database');

var cookieParser = require("cookie-parser");

// Set mongoose options
mongoose.set('strictQuery', false);

// Database Connection
console.log('🚀 Starting LaborLink Server...');
console.log('📡 Connecting to MongoDB...');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔧 Production mode:', process.env.PRODUCTION || 'false');

// Setup connection events and connect to database
setupConnectionEvents();
connectDB();

// Middleware - MUST be applied BEFORE routes
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors()); // CORS must be before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'Public')));

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
const graph = require('./Routes/Admin/graph')
const headingText = require('./Routes/Admin/headingText')
const notification = require('./Routes/Admin/notification')
const business = require('./Routes/Admin/business')
const ourclient = require("./Routes/Admin/ourclien");
const subadmin = require("./Routes/Admin/subadmin");
const offer = require("./Routes/offerRoutes")
const subscription = require("./Routes/subscription")

const offertemplate = require("./Routes/template")
const fcm = require("./Routes/User/fcmRoutes")
const phonepe = require("./Routes/PhonepeRoutes")
const subscriptionValidation = require("./Routes/subscriptionValidationRoutes")
const adminSubscriptionRoutes = require("./Routes/Admin/adminSubscriptionRoutes")
const analyticsRoutes = require("./Routes/analyticsRoutes")
const iapRoutes = require("./Routes/iapRoutes")
const supportRoutes = require("./Routes/supportRoutes")

// Health check endpoint
app.get('/api/health', (req, res) => {
  const { getConnectionInfo } = require('./Config/database');
  const dbInfo = getConnectionInfo();

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbInfo,
    server: {
      port: process.env.PORT || 8500,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Mount routes AFTER middleware
app.use('/api/user', locationRoutes);
app.use('/api/admin/analytics', analyticsRoutes);

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
app.use("/api/admin", subadmin);
app.use("/api/offers", offer)
app.use("/api/subscription", subscription)

app.use("/api/templates", offertemplate)
app.use("/api/user", fcm)
app.use("/api/user", phonepe)
app.use("/api/subscription-validation", subscriptionValidation)
app.use("/api/admin/subscriptions", adminSubscriptionRoutes)
app.use("/api/user", iapRoutes)
app.use("/api/support", supportRoutes)

const employerController = require("./Controller/Employers/employers");
const employeeController = require("./Controller/User/user");
setInterval(() => {
  employerController.deleteOfline();
  employeeController.deleteOfline();
}, 60000)
app.use(express.static(path.join(__dirname, 'build')));

app.get("*", (req, res) => {
  return res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
const PORT = process.env.PORT || 8500;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
