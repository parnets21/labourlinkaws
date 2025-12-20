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

// Middleware
app.use(morgan("dev"));
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'Public')));

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

// Create routes
app.use("/api/user", locationRoutes);
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
app.use("/api/offers", offer);
app.use("/api/subscription", subscription);
app.use("/api/templates", offertemplate);
app.use("/api/user", fcm);
app.use("/api/user", phonepe);
app.use("/api/subscription-validation", subscriptionValidation);
app.use("/api/admin/subscriptions", adminSubscriptionRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/user", iapRoutes);
app.use("/api/support", supportRoutes);

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
