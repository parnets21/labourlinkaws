const mongoose = require('mongoose');
require('dotenv').config();

const testDatabaseConnection = async () => {
  console.log('🔍 Testing Database Connection...\n');

  try {
    // Get database URL from environment
    const dbUrl = process.env.DB;
    console.log('Database URL:', dbUrl ? 'Set' : 'Not set');
    
    if (!dbUrl) {
      console.log('❌ Database URL not found in environment variables');
      return false;
    }

    // Test connection
    console.log('Connecting to database...');
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Database connected successfully');

    // Test if we can access the SupportEnquiry collection
    const SupportEnquiry = require('./Model/supportModel');
    
    console.log('Testing SupportEnquiry model...');
    const count = await SupportEnquiry.countDocuments();
    console.log(`✅ SupportEnquiry collection accessible. Document count: ${count}`);

    // Test creating a simple document (without saving)
    console.log('Testing document creation...');
    const testEnquiry = new SupportEnquiry({
      name: 'Test User',
      email: 'test@example.com',
      userType: 'Job Seeker',
      priority: 'medium',
      category: 'Technical Issue',
      subject: 'Test subject',
      description: 'Test description for validation'
    });

    // Validate without saving
    const validationError = testEnquiry.validateSync();
    if (validationError) {
      console.log('❌ Model validation failed:', validationError.message);
      return false;
    }

    console.log('✅ Model validation passed');

    // Test actual save and delete
    console.log('Testing save operation...');
    await testEnquiry.save();
    console.log(`✅ Document saved successfully. Ticket ID: ${testEnquiry.ticketId}`);

    // Clean up test document
    await SupportEnquiry.findByIdAndDelete(testEnquiry._id);
    console.log('✅ Test document cleaned up');

    console.log('\n🎉 All database tests passed!');
    return true;

  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.log('💡 This usually means the MongoDB server is unreachable');
    } else if (error.name === 'ValidationError') {
      console.log('💡 Model validation error:', error.message);
    } else if (error.code === 11000) {
      console.log('💡 Duplicate key error - document already exists');
    }
    
    return false;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run test if called directly
if (require.main === module) {
  testDatabaseConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testDatabaseConnection };