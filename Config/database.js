const mongoose = require('mongoose');

// MongoDB Connection Configuration
const connectDB = async () => {
  try {
    // Connection options for better stability
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      heartbeatFrequencyMS: 2000, // Heartbeat every 2 seconds
      retryWrites: true, // Retry writes if they fail
      w: 'majority', // Write concern
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.DB, options);

    // Set mongoose options for better performance
    mongoose.set('bufferCommands', false); // Disable buffering for immediate errors

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${getConnectionState(conn.connection.readyState)}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    
    // Specific error handling
    if (error.name === 'MongoServerSelectionError') {
      console.error('🔍 Server Selection Error - Check if MongoDB is running and accessible');
    } else if (error.name === 'MongoNetworkError') {
      console.error('🌐 Network Error - Check your internet connection and MongoDB URL');
    } else if (error.name === 'MongoParseError') {
      console.error('🔧 Parse Error - Check your MongoDB connection string format');
    }
    
    console.error('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Get human-readable connection state
const getConnectionState = (state) => {
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  return states[state] || 'Unknown';
};

// Connection event handlers
const setupConnectionEvents = () => {
  mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('🔴 Mongoose connection error:', err.message);
    
    // Handle specific errors
    if (err.name === 'MongoNetworkTimeoutError') {
      console.error('⏰ Network timeout - MongoDB server might be slow to respond');
    }
  });

  mongoose.connection.on('disconnected', () => {
    console.log('🟡 Mongoose disconnected from MongoDB');
    console.log('🔄 Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🟢 Mongoose reconnected to MongoDB');
  });

  mongoose.connection.on('close', () => {
    console.log('🔴 MongoDB connection closed');
  });

  // Monitor connection state changes
  mongoose.connection.on('fullsetup', () => {
    console.log('🎯 MongoDB replica set connected');
  });

  mongoose.connection.on('all', () => {
    console.log('✨ All MongoDB replica set members connected');
  });
};

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔴 MongoDB connection closed due to app termination');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await gracefulShutdown();
  process.exit(0);
});

// Check connection status
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Get connection info
const getConnectionInfo = () => {
  if (!isConnected()) {
    return { status: 'disconnected' };
  }
  
  return {
    status: 'connected',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    readyState: getConnectionState(mongoose.connection.readyState)
  };
};

module.exports = {
  connectDB,
  setupConnectionEvents,
  gracefulShutdown,
  isConnected,
  getConnectionInfo
};
