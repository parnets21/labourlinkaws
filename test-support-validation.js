const axios = require('axios');

// Test support enquiry validation
const testSupportValidation = async () => {
  console.log('🧪 Testing Support Enquiry Validation...\n');

  const API_BASE_URL = 'https://laborlink.co.in/api';

  // Test cases
  const testCases = [
    {
      name: 'Valid submission',
      data: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        userType: 'Job Seeker',
        priority: 'medium',
        category: 'Technical Issue',
        subject: 'Login problem with my account',
        description: 'I am having trouble logging into my account. When I enter my credentials, I get an error message.'
      },
      expectSuccess: true
    },
    {
      name: 'Missing required fields',
      data: {
        name: 'John Doe',
        email: 'john.doe@example.com'
        // Missing userType, priority, category, subject, description
      },
      expectSuccess: false
    },
    {
      name: 'Invalid email',
      data: {
        name: 'John Doe',
        email: 'invalid-email',
        userType: 'Job Seeker',
        priority: 'medium',
        category: 'Technical Issue',
        subject: 'Test subject',
        description: 'Test description that is long enough'
      },
      expectSuccess: false
    },
    {
      name: 'Invalid userType',
      data: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        userType: 'InvalidType',
        priority: 'medium',
        category: 'Technical Issue',
        subject: 'Test subject',
        description: 'Test description that is long enough'
      },
      expectSuccess: false
    },
    {
      name: 'Subject too short',
      data: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        userType: 'Job Seeker',
        priority: 'medium',
        category: 'Technical Issue',
        subject: 'Hi', // Too short (min 5 chars)
        description: 'Test description that is long enough'
      },
      expectSuccess: false
    },
    {
      name: 'Description too short',
      data: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        userType: 'Job Seeker',
        priority: 'medium',
        category: 'Technical Issue',
        subject: 'Valid subject',
        description: 'Short' // Too short (min 10 chars)
      },
      expectSuccess: false
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/support/enquiry`, testCase.data, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const success = response.status === 201 || response.status === 200;
      const result = {
        testName: testCase.name,
        expected: testCase.expectSuccess,
        actual: success,
        status: response.status,
        passed: success === testCase.expectSuccess
      };

      if (success) {
        console.log(`  ✅ Success (${response.status})`);
        if (response.data.data?.ticketId) {
          console.log(`  📋 Ticket ID: ${response.data.data.ticketId}`);
        }
      } else {
        console.log(`  ❌ Failed (${response.status})`);
      }

      results.push(result);

    } catch (error) {
      const failed = error.response?.status >= 400;
      const result = {
        testName: testCase.name,
        expected: testCase.expectSuccess,
        actual: !failed,
        status: error.response?.status || 'Network Error',
        error: error.response?.data?.message || error.message,
        passed: failed === !testCase.expectSuccess
      };

      if (error.response?.status === 400) {
        console.log(`  ❌ Validation Error (400)`);
        if (error.response.data?.errors) {
          console.log(`  📝 Errors:`, error.response.data.errors);
        }
      } else {
        console.log(`  ❌ Error (${error.response?.status || 'Network'}): ${error.message}`);
      }

      results.push(result);
    }

    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('📊 Test Results Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.testName}`);
    if (!result.passed) {
      console.log(`     Expected: ${result.expected ? 'Success' : 'Failure'}, Got: ${result.actual ? 'Success' : 'Failure'}`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    }
  });

  console.log('='.repeat(50));
  console.log(`Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All validation tests passed!');
  } else {
    console.log('⚠️  Some validation tests failed. Check the API validation rules.');
  }

  return results;
};

// Run the tests
if (require.main === module) {
  testSupportValidation().catch(console.error);
}

module.exports = { testSupportValidation };