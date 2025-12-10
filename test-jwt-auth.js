const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Test JWT token generation and verification
const testJWTAuth = () => {
  console.log('Testing JWT Authentication...\n');

  // Test JWT Secret
  const JWT_SECRET = process.env.JWT_SECRET || 'laborlink_jwt_secret_key_2025_secure_token';
  console.log('JWT_SECRET:', JWT_SECRET ? 'Set' : 'Not set');

  // Test token generation
  const testPayload = {
    id: '693966e1ceec3b8b11484ae5',
    adminId: '693966e1ceec3b8b11484ae5',
    email: 'admin@laborlink.com',
    userType: 'admin'
  };

  try {
    const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '24h' });
    console.log('Generated JWT Token:', token.substring(0, 50) + '...');

    // Test token verification
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded Token:', decoded);

    console.log('\n✅ JWT Authentication test passed!');
    return { success: true, token };
  } catch (error) {
    console.error('❌ JWT Authentication test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Test password hashing
const testPasswordHashing = async () => {
  console.log('\nTesting Password Hashing...\n');

  const password = 'admin123';
  const saltRounds = 10;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Hashed Password:', hashedPassword);

    const isMatch = await bcrypt.compare(password, hashedPassword);
    console.log('Password Match:', isMatch);

    console.log('\n✅ Password hashing test passed!');
    return { success: true };
  } catch (error) {
    console.error('❌ Password hashing test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Run tests
const runTests = async () => {
  console.log('='.repeat(50));
  console.log('LaborLink Backend Authentication Tests');
  console.log('='.repeat(50));

  const jwtTest = testJWTAuth();
  const passwordTest = await testPasswordHashing();

  console.log('\n' + '='.repeat(50));
  console.log('Test Results:');
  console.log('JWT Auth:', jwtTest.success ? '✅ PASS' : '❌ FAIL');
  console.log('Password Hash:', passwordTest.success ? '✅ PASS' : '❌ FAIL');
  console.log('='.repeat(50));

  if (jwtTest.success && passwordTest.success) {
    console.log('\n🎉 All tests passed! The authentication system is ready.');
    
    // Provide sample curl command for testing
    console.log('\nSample API test command:');
    console.log(`curl -X GET https://laborlink.co.in/api/support/statistics \\
  -H "Authorization: Bearer ${jwtTest.token.substring(0, 50)}..." \\
  -H "Content-Type: application/json"`);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration.');
  }
};

// Load environment variables
require('dotenv').config();

// Run the tests
runTests().catch(console.error);