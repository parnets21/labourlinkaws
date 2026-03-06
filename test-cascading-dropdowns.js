/**
 * Test script for cascading dropdowns functionality
 * Run with: node test-cascading-dropdowns.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8500/api';

async function testCascadingDropdowns() {
  console.log('🧪 Testing Cascading Dropdowns API\n');

  try {
    // Test 1: Get all industries
    console.log('1️⃣ Testing GET /api/admin/industries');
    const industriesRes = await axios.get(`${BASE_URL}/admin/industries`);
    console.log('✅ Industries fetched:', industriesRes.data.data.length, 'industries');
    
    if (industriesRes.data.data.length === 0) {
      console.log('⚠️  No industries found. Please add some industries first.');
      return;
    }

    const testIndustry = industriesRes.data.data[0];
    console.log('   Using industry:', testIndustry.industryName, '(ID:', testIndustry._id, ')\n');

    // Test 2: Get categories by industry
    console.log('2️⃣ Testing GET /api/admin/categories/by-industry/:industryId');
    let categoriesRes = await axios.get(`${BASE_URL}/admin/categories/by-industry/${testIndustry._id}`);
    
    // If first industry has no categories, try others
    let industryIndex = 0;
    let selectedIndustry = testIndustry;
    while (categoriesRes.data.data.length === 0 && industryIndex < industriesRes.data.data.length - 1) {
      industryIndex++;
      selectedIndustry = industriesRes.data.data[industryIndex];
      console.log('   No categories found, trying:', selectedIndustry.industryName);
      categoriesRes = await axios.get(`${BASE_URL}/admin/categories/by-industry/${selectedIndustry._id}`);
    }
    
    console.log('✅ Categories fetched:', categoriesRes.data.data.length, 'categories for', selectedIndustry.industryName);
    
    if (categoriesRes.data.data.length === 0) {
      console.log('⚠️  No categories found for this industry. Please add some categories.');
      return;
    }

    const testCategory = categoriesRes.data.data[0];
    console.log('   Using category:', testCategory.categoryName, '(ID:', testCategory._id, ')\n');

    // Test 3: Get subcategories (job roles) by category
    console.log('3️⃣ Testing GET /api/admin/subcategories/by-category/:categoryId');
    const subCategoriesRes = await axios.get(`${BASE_URL}/admin/subcategories/by-category/${testCategory._id}`);
    console.log('✅ Job Roles fetched:', subCategoriesRes.data.data.length, 'job roles for', testCategory.categoryName);
    
    if (subCategoriesRes.data.data.length > 0) {
      const testJobRole = subCategoriesRes.data.data[0];
      console.log('   Sample job role:', testJobRole.subCategoryName, '(ID:', testJobRole._id, ')\n');

      // Test 4: Validate cascading relationship
      console.log('4️⃣ Testing cascading validation');
      console.log('   Industry ID:', testIndustry._id);
      console.log('   Category ID:', testCategory._id);
      console.log('   Category belongs to Industry:', testCategory.industryId === testIndustry._id ? '✅ YES' : '❌ NO');
      console.log('   Job Role ID:', testJobRole._id);
      console.log('   Job Role belongs to Category:', testJobRole.categoryId === testCategory._id ? '✅ YES' : '❌ NO');
      console.log('   Job Role belongs to Industry:', testJobRole.industryId === testIndustry._id ? '✅ YES' : '❌ NO');
    } else {
      console.log('⚠️  No job roles found for this category. Please add some job roles.\n');
    }

    // Test 5: Test with invalid category (should fail)
    console.log('\n5️⃣ Testing validation with mismatched data');
    try {
      // Get a different industry
      const differentIndustry = industriesRes.data.data[1] || industriesRes.data.data[0];
      
      console.log('   Attempting to register with:');
      console.log('   - Industry:', differentIndustry.industryName);
      console.log('   - Category:', testCategory.categoryName, '(from different industry)');
      
      const testRegistration = {
        fullName: 'Test User',
        email: 'test' + Date.now() + '@example.com',
        phone: Math.floor(1000000000 + Math.random() * 9000000000),
        password: 'password123',
        industryId: differentIndustry._id,
        categoryId: testCategory._id, // This category doesn't belong to differentIndustry
        aadharNumber: '123456789012'
      };

      await axios.post(`${BASE_URL}/user/register`, testRegistration);
      console.log('   ❌ Validation failed - should have rejected mismatched data');
    } catch (error) {
      if (error.response && error.response.data.code === 'CATEGORY_INDUSTRY_MISMATCH') {
        console.log('   ✅ Validation working - correctly rejected mismatched data');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('   ⚠️  Different error:', error.response?.data?.error || error.message);
      }
    }

    console.log('\n✅ All tests completed!\n');
    console.log('📱 Mobile App Integration:');
    console.log('   1. GET /api/admin/industries - Fetch all industries');
    console.log('   2. GET /api/admin/categories/by-industry/:industryId - Fetch categories for selected industry');
    console.log('   3. GET /api/admin/subcategories/by-category/:categoryId - Fetch job roles for selected category');
    console.log('   4. POST /api/user/register with industryId, categoryId, jobRoleId\n');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Server is not running. Please start the server first:');
      console.error('   cd labourlinkAws');
      console.error('   npm start\n');
    }
  }
}

// Run tests
testCascadingDropdowns();
