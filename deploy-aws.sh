#!/bin/bash

# AWS FCM Deployment Script
echo "🚀 Starting AWS FCM Deployment..."

# Check if required environment variables are set
if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "❌ FIREBASE_PROJECT_ID environment variable is not set"
    exit 1
fi

if [ -z "$FIREBASE_PRIVATE_KEY" ]; then
    echo "❌ FIREBASE_PRIVATE_KEY environment variable is not set"
    exit 1
fi

if [ -z "$FIREBASE_CLIENT_EMAIL" ]; then
    echo "❌ FIREBASE_CLIENT_EMAIL environment variable is not set"
    exit 1
fi

echo "✅ Environment variables are set"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Test Firebase connection
echo "🔥 Testing Firebase connection..."
node -e "
const admin = require('firebase-admin');
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, '\\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  console.log('✅ Firebase initialized successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Firebase error:', error.message);
  process.exit(1);
}
"

if [ $? -eq 0 ]; then
    echo "✅ Firebase connection test passed"
else
    echo "❌ Firebase connection test failed"
    exit 1
fi

# Test FCM controller
echo "🧪 Testing FCM controller..."
node -e "
try {
  const fcm = require('./Controller/User/fcmController');
  console.log('✅ FCM Controller loaded successfully');
  console.log('Available functions:', Object.keys(fcm));
  process.exit(0);
} catch (error) {
  console.error('❌ FCM Controller error:', error.message);
  process.exit(1);
}
"

if [ $? -eq 0 ]; then
    echo "✅ FCM controller test passed"
else
    echo "❌ FCM controller test failed"
    exit 1
fi

# Test routes
echo "🛣️ Testing FCM routes..."
node -e "
try {
  const routes = require('./Routes/User/fcmRoutes');
  console.log('✅ FCM Routes loaded successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ FCM Routes error:', error.message);
  process.exit(1);
}
"

if [ $? -eq 0 ]; then
    echo "✅ FCM routes test passed"
else
    echo "❌ FCM routes test failed"
    exit 1
fi

echo "🎉 All tests passed! FCM integration is ready for AWS deployment"
echo "🚀 You can now start your server with: pm2 start app.js --name labourlink-api"
