const axios = require('axios');

// Test configuration
const BASE_URL = 'https://laborlink.co.in/api';
const TEST_DATA = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  userType: 'Job Seeker',
  priority: 'medium',
  category: 'Technical Issue',
  subject: 'Test Support Enquiry',
  description: 'This is a test support enquiry to verify the integration is working correctly.'
};

async function testSupportIntegration() {
  console.log('🧪 Testing Support System Integration...\n');

  try {
    // Test 1: Submit Support Enquiry (Public endpoint)
    console.log('1️⃣ Testing: Submit Support Enquiry');
    const submitResponse = await axios.post(`${BASE_URL}/support/enquiry`, TEST_DATA);
    
    if (submitResponse.data.success) {
      console.log('✅ Support enquiry submitted successfully');
      console.log('📋 Ticket ID:', submitResponse.data.data.ticketId);
      console.log('📅 Created At:', submitResponse.data.data.createdAt);
    } else {
      console.log('❌ Failed to submit support enquiry');
      console.log('Error:', submitResponse.data.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get Statistics (Requires authentication)
    console.log('2️⃣ Testing: Get Support Statistics');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/support/statistics`);
      console.log('✅ Statistics retrieved successfully');
      console.log('📊 Overview:', statsResponse.data.data.overview);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔒 Statistics endpoint requires authentication (Expected)');
        console.log('💡 This is correct - admin endpoints should be protected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Health Check
    console.log('3️⃣ Testing: Server Health Check');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is healthy');
    console.log('🗄️ Database Status:', healthResponse.data.database.status);
    console.log('🌍 Environment:', healthResponse.data.server.environment);

    console.log('\n' + '='.repeat(50) + '\n');
    console.log('🎉 Support System Integration Test Complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start your backend server: cd labourlinkaws && npm start');
    console.log('2. Start your frontend: cd LaborLink-AdminPanel && npm run dev');
    console.log('3. Test the support form on your frontend');
    console.log('4. Login to admin panel to manage support tickets');

  } catch (error) {
    console.log('❌ Integration test failed');
    console.log('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your backend server is running:');
      console.log('   cd labourlinkaws');
      console.log('   npm start');
    }
  }
}

// Run the test
testSupportIntegration();