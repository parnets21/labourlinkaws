#!/bin/bash

# AWS EC2 Update Script for LaborLink FCM Integration
echo "🚀 Starting LaborLink update on AWS EC2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running on AWS EC2
if [[ -f /sys/hypervisor/uuid ]] && grep -q product_product_description=.*Amazon.*EC2 /sys/devices/virtual/dmi/id/product_version 2>/dev/null; then
    print_status "Running on AWS EC2"
else
    print_warning "Not running on AWS EC2 - continuing anyway"
fi

# Check if PM2 is running
if command -v pm2 &> /dev/null; then
    print_status "PM2 is installed"
else
    print_error "PM2 is not installed. Installing..."
    sudo npm install -g pm2
fi

# Check if app is running with PM2
if pm2 list | grep -q "labourlink-api"; then
    print_status "Application is running with PM2"
    APP_RUNNING=true
else
    print_warning "Application not running with PM2"
    APP_RUNNING=false
fi

# Stop the application if it's running
if [ "$APP_RUNNING" = true ]; then
    print_status "Stopping application..."
    pm2 stop labourlink-api
fi

# Pull latest changes
print_status "Pulling latest changes from repository..."
git pull origin main

if [ $? -eq 0 ]; then
    print_status "Successfully pulled latest changes"
else
    print_error "Failed to pull changes. Check your repository connection."
    exit 1
fi

# Install dependencies
print_status "Installing/updating dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Test environment variables
if [ -z "$FIREBASE_PROJECT_ID" ] || [ -z "$FIREBASE_CLIENT_EMAIL" ]; then
    print_error "Firebase environment variables not set!"
    print_warning "Please set the following environment variables:"
    echo "export FIREBASE_PROJECT_ID=your-project-id"
    echo "export FIREBASE_PRIVATE_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n\""
    echo "export FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com"
    
    # Try to load from .env file
    if [ -f .env ]; then
        print_status "Loading environment variables from .env file..."
        source .env
    else
        print_warning "No .env file found. Creating template..."
        cat > .env << EOF
# Database Configuration
MONGODB_URI=mongodb://your-mongodb-connection-string
NODE_ENV=production
PORT=8500

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Production Settings
PRODUCTION=true
EOF
        print_warning "Please edit .env file with your actual values and run this script again."
        exit 1
    fi
fi

# Test FCM integration
print_status "Testing FCM integration..."
node -e "
try {
  const fcm = require('./Controller/User/fcmController');
  console.log('✅ FCM Controller loaded successfully');
  console.log('Available functions:', Object.keys(fcm));
} catch (error) {
  console.error('❌ FCM Controller error:', error.message);
  process.exit(1);
}
"

if [ $? -eq 0 ]; then
    print_status "FCM integration test passed"
else
    print_error "FCM integration test failed"
    exit 1
fi

# Test MongoDB connection
print_status "Testing MongoDB connection..."
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
"

if [ $? -eq 0 ]; then
    print_status "MongoDB connection test passed"
else
    print_error "MongoDB connection test failed"
    exit 1
fi

# Start the application
if [ "$APP_RUNNING" = true ]; then
    print_status "Starting application with PM2..."
    pm2 start labourlink-api
else
    print_status "Starting new PM2 process..."
    pm2 start app.js --name "labourlink-api"
fi

# Save PM2 configuration
pm2 save

# Check application status
pm2 status

print_status "Update completed successfully!"

# Show logs
print_status "Showing recent logs..."
pm2 logs labourlink-api --lines 10

echo ""
print_status "🎉 LaborLink FCM integration updated successfully on AWS EC2!"
echo ""
print_status "Your application is now running at: http://$(curl -s ifconfig.me):8500"
echo ""
print_status "To monitor your application:"
echo "  pm2 status                    # Check status"
echo "  pm2 logs labourlink-api       # View logs"
echo "  pm2 monit                     # Monitor in real-time"
echo "  pm2 restart labourlink-api   # Restart application"
