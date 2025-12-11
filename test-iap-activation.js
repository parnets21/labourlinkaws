/**
 * Test script for IAP activation endpoint
 * Run this to test the backend IAP activation functionality
 */

const axios = require('axios');

const BASE_URL = 'https://laborlink.co.in';

// Test data that mimics what the iOS app sends
const testActivationData = {
    userId: '507f1f77bcf86cd799439011', // Example ObjectId
    subscriptionId: null, // IAP purchases might not have backend subscription ID
    transactionId: 'test_transaction_' + Date.now(),
    amount: 99,
    status: 'active',
    startDate: new Date().toISOString(),
    paymentMethod: 'Apple IAP',
    planName: 'Basic Plan',
    serviceType: 'job_portal_subscription',
    serviceDescription: 'Premium subscription features',
    userType: 'employee',
    iapReceipt: 'test_receipt_data',
    iapProductId: 'com.laboremployee.laborlinkapp.jobseeker'
};

async function testIAPActivation() {
    try {
        console.log('Testing IAP activation endpoint...');
        console.log('Test data:', testActivationData);
        
        const response = await axios.post(
            `${BASE_URL}/api/user/activateSubscription`,
            testActivationData,
            {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Success! Response:', response.data);
        
    } catch (error) {
        console.error('❌ Error occurred:');
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response data:', error.response.data);
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error message:', error.message);
        }
        
        console.error('Full error:', error);
    }
}

// Test with missing required fields
async function testValidation() {
    try {
        console.log('\nTesting validation with missing fields...');
        
        const invalidData = {
            // Missing userId and transactionId
            planName: 'Test Plan'
        };
        
        const response = await axios.post(
            `${BASE_URL}/api/user/activateSubscription`,
            invalidData,
            {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Unexpected success:', response.data);
        
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('✅ Validation working correctly:', error.response.data);
        } else {
            console.error('❌ Unexpected error:', error.response?.data || error.message);
        }
    }
}

// Run tests
async function runTests() {
    await testIAPActivation();
    await testValidation();
}

runTests();