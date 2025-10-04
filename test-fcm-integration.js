// Test script for FCM integration
// Run this with: node test-fcm-integration.js

const axios = require('axios');

const BASE_URL = 'https://laborlink.co.in'; // Change to your server URL
const TEST_USER_ID = 'test_user_id_123'; // Replace with actual user ID
const TEST_FCM_TOKEN = 'test_fcm_token_123'; // Replace with actual FCM token

async function testFCMIntegration() {
  console.log('🧪 Testing FCM Integration...\n');

  try {
    // Test 1: Update FCM Token
    console.log('1️⃣ Testing FCM Token Update...');
    const updateResponse = await axios.post(`${BASE_URL}/api/user/update-token`, {
      userId: TEST_USER_ID,
      fcmToken: TEST_FCM_TOKEN,
      deviceId: `device_${TEST_USER_ID}_${Date.now()}`,
      platform: 'ios'
    });
    
    console.log('✅ FCM Token Update Response:', updateResponse.data);

    // Test 2: Get FCM Token
    console.log('\n2️⃣ Testing Get FCM Token...');
    const getResponse = await axios.get(`${BASE_URL}/api/user/token/${TEST_USER_ID}`);
    console.log('✅ Get FCM Token Response:', getResponse.data);

    // Test 3: Send Single Notification
    console.log('\n3️⃣ Testing Single Notification...');
    const singleNotificationResponse = await axios.post(`${BASE_URL}/api/user/fcmToken`, {
      token: TEST_FCM_TOKEN,
      title: 'Test Notification',
      body: 'This is a test notification from LaborLink'
    });
    console.log('✅ Single Notification Response:', singleNotificationResponse.data);

    // Test 4: Send Bulk Notification
    console.log('\n4️⃣ Testing Bulk Notification...');
    const bulkNotificationResponse = await axios.post(`${BASE_URL}/api/user/bulk-notification`, {
      employeeIds: [TEST_USER_ID],
      title: 'Bulk Test Notification',
      body: 'This is a bulk test notification from LaborLink'
    });
    console.log('✅ Bulk Notification Response:', bulkNotificationResponse.data);

    // Test 5: Get All Active Tokens
    console.log('\n5️⃣ Testing Get All Active Tokens...');
    const allTokensResponse = await axios.get(`${BASE_URL}/api/user/all-tokens`);
    console.log('✅ All Active Tokens Response:', allTokensResponse.data);

    // Test 6: Clear FCM Token
    console.log('\n6️⃣ Testing Clear FCM Token...');
    const clearTokenResponse = await axios.post(`${BASE_URL}/api/user/clear-token`, {
      userId: TEST_USER_ID,
      deviceId: `device_${TEST_USER_ID}_${Date.now()}`
    });
    console.log('✅ Clear FCM Token Response:', clearTokenResponse.data);

    // Test 7: Reactivate FCM Token
    console.log('\n7️⃣ Testing Reactivate FCM Token...');
    const reactivateTokenResponse = await axios.post(`${BASE_URL}/api/user/reactivate-token`, {
      userId: TEST_USER_ID,
      deviceId: `device_${TEST_USER_ID}_${Date.now()}`
    });
    console.log('✅ Reactivate FCM Token Response:', reactivateTokenResponse.data);

    // Test 8: Get FCM Token Statistics
    console.log('\n8️⃣ Testing FCM Token Statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/api/user/stats`);
    console.log('✅ FCM Token Statistics Response:', statsResponse.data);

    console.log('\n🎉 All FCM integration tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testFCMIntegration();
