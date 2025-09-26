const mongoose = require('mongoose');
require('dotenv').config();

// Test MongoDB connection
const testConnection = async () => {
  console.log('🧪 Testing MongoDB Connection...');
  console.log('🔗 Connection String:', process.env.DB ? 'Found' : 'Missing');
  
  if (!process.env.DB) {
    console.error('❌ DB environment variable not found!');
    console.log('💡 Create a .env file with your MongoDB connection string:');
    console.log('   DB=mongodb://localhost:27017/laborlink');
    console.log('   or');
    console.log('   DB=mongodb+srv://username:password@cluster.mongodb.net/laborlink');
    process.exit(1);
  }

  try {
    // Set mongoose options
    mongoose.set('bufferCommands', false);
    
    const conn = await mongoose.connect(process.env.DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });

    console.log('✅ Connection successful!');
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Port: ${conn.connection.port}`);
    console.log(`📈 Ready State: ${conn.connection.readyState}`);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('📋 Collection names:');
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }

    await mongoose.connection.close();
    console.log('🔴 Connection closed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Provide specific troubleshooting tips
    if (error.message.includes('ENOTFOUND')) {
      console.log('🔍 DNS resolution failed. Check your connection string hostname.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('🔍 Connection refused. Check if MongoDB is running on the specified port.');
    } else if (error.message.includes('Authentication failed')) {
      console.log('🔍 Authentication failed. Check your username and password.');
    } else if (error.message.includes('Server selection timed out')) {
      console.log('🔍 Server selection timed out. Check your network connection and MongoDB availability.');
    }
    
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check if MongoDB is running locally: mongod --version');
    console.log('2. For MongoDB Atlas, check your IP whitelist');
    console.log('3. Verify your connection string format');
    console.log('4. Check your network connection');
    
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

testConnection();
