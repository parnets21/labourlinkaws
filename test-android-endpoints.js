/**
 * Test Android app endpoints with filtering
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8500/api/user';

async function testAndroidEndpoints() {
  console.log('🧪 Testing Android App Endpoints with Filtering\n');

  try {
    // Test 1: Get all industries
    console.log('1️⃣ GET /api/user/industries');
    const industriesRes = await axios.get(`${BASE_URL}/industries`);
    console.log('✅ Industries:', industriesRes.data.data?.length || industriesRes.data.success?.length, 'found');
    
    const industries = industriesRes.data.data || industriesRes.data.success || [];
    if (industries.length === 0) {
      console.log('⚠️  No industries found\n');
      return;
    }

    // Find an industry with categories
    let testIndustry = null;
    for (const industry of industries) {
      const testRes = await axios.get(`${BASE_URL}/categories/by-industry/${industry._id}`);
      if (testRes.data.data && testRes.data.data.length > 0) {
        testIndustry = industry;
        break;
      }
    }

    if (!testIndustry) {
      console.log('⚠️  No industry with categories found\n');
      return;
    }

    console.log(`   Using: ${testIndustry.industryName} (${testIndustry._id})\n`);

    // Test 2: Get departments WITHOUT filter (old behavior)
    console.log('2️⃣ GET /api/user/departments (no filter)');
    const allDepartmentsRes = await axios.get(`${BASE_URL}/departments`);
    const allDepartments = allDepartmentsRes.data.data || [];
    console.log(`✅ All departments: ${allDepartments.length} found`);
    console.log(`   Sample: ${allDepartments.slice(0, 3).map(d => d.departmentName).join(', ')}\n`);

    // Test 3: Get departments WITH industry filter (NEW!)
    console.log(`3️⃣ GET /api/user/departments?industryId=${testIndustry._id}`);
    const filteredDepartmentsRes = await axios.get(`${BASE_URL}/departments?industryId=${testIndustry._id}`);
    const filteredDepartments = filteredDepartmentsRes.data.data || [];
    console.log(`✅ Filtered departments for ${testIndustry.industryName}: ${filteredDepartments.length} found`);
    if (filteredDepartments.length > 0) {
      console.log(`   Departments: ${filteredDepartments.map(d => d.departmentName).join(', ')}`);
    }
    console.log(`   Filtered: ${filteredDepartmentsRes.data.filtered ? 'YES ✅' : 'NO'}\n`);

    // Test 4: Get job roles WITHOUT filter (old behavior)
    console.log('4️⃣ GET /api/user/job-roles (no filter)');
    const allRolesRes = await axios.get(`${BASE_URL}/job-roles`);
    const allRoles = allRolesRes.data.data || [];
    console.log(`✅ All job roles: ${allRoles.length} found`);
    console.log(`   Sample: ${allRoles.slice(0, 3).map(r => r.jobRole).join(', ')}\n`);

    // Test 5: Get job roles WITH industry filter (NEW!)
    console.log(`5️⃣ GET /api/user/job-roles?industryId=${testIndustry._id}`);
    const filteredRolesByIndustryRes = await axios.get(`${BASE_URL}/job-roles?industryId=${testIndustry._id}`);
    const filteredRolesByIndustry = filteredRolesByIndustryRes.data.data || [];
    console.log(`✅ Filtered job roles for ${testIndustry.industryName}: ${filteredRolesByIndustry.length} found`);
    if (filteredRolesByIndustry.length > 0) {
      console.log(`   Sample: ${filteredRolesByIndustry.slice(0, 5).map(r => r.jobRole).join(', ')}\n`);
    }

    // Test 6: Get job roles WITH category filter (NEW!)
    if (filteredDepartments.length > 0) {
      const testCategory = filteredDepartments[0];
      console.log(`6️⃣ GET /api/user/job-roles?categoryId=${testCategory._id}`);
      const filteredRolesByCategoryRes = await axios.get(`${BASE_URL}/job-roles?categoryId=${testCategory._id}`);
      const filteredRolesByCategory = filteredRolesByCategoryRes.data.data || [];
      console.log(`✅ Filtered job roles for ${testCategory.categoryName}: ${filteredRolesByCategory.length} found`);
      if (filteredRolesByCategory.length > 0) {
        console.log(`   Roles: ${filteredRolesByCategory.map(r => r.jobRole).join(', ')}\n`);
      }
    }

    console.log('\n✅ All tests completed!\n');
    console.log('📱 Android App Usage:\n');
    console.log('OLD WAY (returns all):');
    console.log('  GET /api/user/departments');
    console.log('  GET /api/user/job-roles\n');
    console.log('NEW WAY (filtered - RECOMMENDED):');
    console.log('  GET /api/user/departments?industryId=SELECTED_INDUSTRY_ID');
    console.log('  GET /api/user/job-roles?categoryId=SELECTED_CATEGORY_ID');
    console.log('  GET /api/user/job-roles?industryId=SELECTED_INDUSTRY_ID\n');
    console.log('OR USE (best practice):');
    console.log('  GET /api/user/categories/by-industry/:industryId');
    console.log('  GET /api/user/subcategories/by-category/:categoryId\n');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Server is not running. Please start the server first.\n');
    }
  }
}

testAndroidEndpoints();
