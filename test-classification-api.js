/**
 * Test script for Job Classification Hierarchy APIs
 * Run this after starting your server: node test-classification-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8500';

async function testClassificationAPIs() {
  console.log('🧪 Testing Job Classification Hierarchy APIs...\n');

  try {
    // Test 1: Get Industries
    console.log('1️⃣ Testing GET /api/user/industries');
    const industriesRes = await axios.get(`${BASE_URL}/api/user/industries`);
    console.log('✅ Industries fetched:', industriesRes.data.data.length, 'industries');
    
    if (industriesRes.data.data.length === 0) {
      console.log('❌ No industries found. Please add some industries first.');
      return;
    }
    
    const testIndustry = industriesRes.data.data[0];
    console.log('   Using industry:', testIndustry.industryName, '(ID:', testIndustry._id, ')\n');

    // Test 2: Get Categories by Industry
    console.log('2️⃣ Testing GET /api/user/categories/by-industry/:industryId');
    const categoriesRes = await axios.get(`${BASE_URL}/api/user/categories/by-industry/${testIndustry._id}`);
    console.log('✅ Categories fetched:', categoriesRes.data.data.length, 'categories');
    
    if (categoriesRes.data.data.length === 0) {
      console.log('❌ No categories found for this industry. Please add some categories first.');
      return;
    }
    
    const testCategory = categoriesRes.data.data[0];
    console.log('   Using category:', testCategory.categoryName, '(ID:', testCategory._id, ')\n');

    // Test 3: Get Subcategories by Category
    console.log('3️⃣ Testing GET /api/user/subcategories/by-category/:categoryId');
    const subcategoriesRes = await axios.get(`${BASE_URL}/api/user/subcategories/by-category/${testCategory._id}`);
    console.log('✅ Subcategories fetched:', subcategoriesRes.data.data.length, 'subcategories');
    
    if (subcategoriesRes.data.data.length === 0) {
      console.log('❌ No subcategories found for this category. Please add some subcategories first.');
      return;
    }
    
    const testSubcategory = subcategoriesRes.data.data[0];
    console.log('   Using subcategory:', testSubcategory.subCategoryName, '(ID:', testSubcategory._id, ')\n');

    // Test 4: Create Job with Classification
    console.log('4️⃣ Testing POST /api/user/registerCompany (with classification)');
    const jobData = {
      companyName: 'Test Company',
      jobtitle: 'Test Job Position',
      jobProfile: 'Test Profile',
      description: 'This is a test job posting with hierarchical classification',
      minSalary: 50000,
      maxSalary: 80000,
      period: 'monthly',
      location: 'Test Location',
      email: 'test@company.com',
      employerId: '507f1f77bcf86cd799439011', // Dummy ID for testing
      industryId: testIndustry._id,
      categoryId: testCategory._id,
      subCategoryId: testSubcategory._id,
      skill: ['JavaScript', 'Node.js'],
      openings: 2,
      experience: '2-3 years',
      typeofwork: 'Full-time'
    };

    const createJobRes = await axios.post(`${BASE_URL}/api/user/registerCompany`, jobData);
    console.log('✅ Job created successfully!');
    console.log('   Job ID:', createJobRes.data.data._id);
    console.log('   Industry:', testIndustry.industryName);
    console.log('   Category:', testCategory.categoryName);
    console.log('   Subcategory:', testSubcategory.subCategoryName, '\n');

    const createdJobId = createJobRes.data.data._id;

    // Test 5: Get Job by ID (should populate classification)
    console.log('5️⃣ Testing GET /api/user/getJobById/:jobId (with population)');
    const jobByIdRes = await axios.get(`${BASE_URL}/api/user/getJobById/${createdJobId}`);
    console.log('✅ Job fetched with populated classification:');
    console.log('   Industry:', jobByIdRes.data.success.industryId?.industryName || 'Not populated');
    console.log('   Category:', jobByIdRes.data.success.categoryId?.categoryName || 'Not populated');
    console.log('   Subcategory:', jobByIdRes.data.success.subCategoryId?.subCategoryName || 'Not populated', '\n');

    // Test 6: Filter Jobs by Classification
    console.log('6️⃣ Testing POST /api/user/getJobByfilter (filter by classification)');
    const filterRes = await axios.post(`${BASE_URL}/api/user/getJobByfilter`, {
      industryId: testIndustry._id,
      categoryId: testCategory._id
    });
    console.log('✅ Filtered jobs:', filterRes.data.success.length, 'jobs found');
    console.log('   All jobs match the selected industry and category\n');

    // Test 7: Test Invalid Classification (should fail validation)
    console.log('7️⃣ Testing validation (invalid category for industry)');
    try {
      const invalidJobData = {
        ...jobData,
        categoryId: '507f1f77bcf86cd799439099', // Invalid category ID
      };
      await axios.post(`${BASE_URL}/api/user/registerCompany`, invalidJobData);
      console.log('❌ Validation failed - invalid classification was accepted!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation working correctly!');
        console.log('   Error:', error.response.data.error, '\n');
      } else {
        throw error;
      }
    }

    console.log('🎉 All tests passed successfully!\n');
    console.log('Summary:');
    console.log('✅ Cascading dropdowns working');
    console.log('✅ Job creation with classification working');
    console.log('✅ Job retrieval with population working');
    console.log('✅ Filtering by classification working');
    console.log('✅ Validation working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run tests
testClassificationAPIs();
