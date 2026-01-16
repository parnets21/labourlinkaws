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
const categoryRoutes = require("./Routes/Admin/categoryRoutes");
const subCategoryRoutes = require("./Routes/Admin/subCategoryRoutes");
const bulkImportRoutes = require("./Routes/Admin/bulkImportRoutes");
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
const passwordResetRoutes = require("./Routes/passwordResetRoutes")

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
app.use("/api/admin/industries", industry);
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/admin/subcategories", subCategoryRoutes);
app.use("/api/admin/bulk-import", bulkImportRoutes);
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
console.log("🔐 Registering password reset routes at /api/auth");
app.use("/api/auth", passwordResetRoutes)

const employerController = require("./Controller/Employers/employers");
const employeeController = require("./Controller/User/user");
setInterval(() => {
  employerController.deleteOfline();
  employeeController.deleteOfline();
}, 60000)

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// API 404 handler - must come after all API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Catch-all handler: send back React's index.html file for non-API routes
app.get("*", (req, res) => {
  return res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
const PORT = process.env.PORT || 8500;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.1.47:${PORT}`);
  console.log(`Android emulator: http://10.0.2.2:${PORT}`);
});
