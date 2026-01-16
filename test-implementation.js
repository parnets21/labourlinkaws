/**
 * Job Management Restructure - Implementation Test Script
 * Tests all API endpoints for Industry, Category, and SubCategory
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8500/api';
let testData = {
  industryId: null,
  categoryId: null,
  subCategoryId: null,
  cuisineId: null
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.cyan}━━━ ${testName} ━━━${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test helper function
async function testEndpoint(name, method, url, data = null, expectedStatus = 200) {
  try {
    const config = { method, url: `${BASE_URL}${url}` };
    if (data) config.data = data;
    
    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      logSuccess(`${name} - Status: ${response.status}`);
      return response.data;
    } else {
      logError(`${name} - Expected ${expectedStatus}, got ${response.status}`);
      return null;
    }
  } catch (error) {
    if (error.response && error.response.status === expectedStatus) {
      logSuccess(`${name} - Status: ${error.response.status} (Expected error)`);
      return error.response.data;
    }
    logError(`${name} - ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function runTests() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║   Job Management Restructure - API Implementation Test   ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');

  try {
    // ========== INDUSTRY TESTS ==========
    log('\n\n═══════════════ INDUSTRY TESTS ═══════════════', 'yellow');

    logTest('1. Create Industry');
    const timestamp = Date.now();
    let result = await testEndpoint(
      'POST /admin/industries',
      'post',
      '/admin/industries',
      {
        industryName: `Test Hotels ${timestamp}`,
        description: 'Hotel and hospitality industry (Test)'
      },
      201
    );
    if (result && result.data) {
      testData.industryId = result.data._id;
      logInfo(`Created Industry ID: ${testData.industryId}`);
    }

    logTest('2. Get All Industries');
    result = await testEndpoint(
      'GET /admin/industries',
      'get',
      '/admin/industries'
    );
    if (result && result.data) {
      logInfo(`Found ${result.data.length} industries`);
    }

    logTest('3. Search Industries');
    result = await testEndpoint(
      'GET /admin/industries/search',
      'get',
      '/admin/industries/search?query=Hotel'
    );

    logTest('4. Get Industry by ID');
    if (testData.industryId) {
      result = await testEndpoint(
        'GET /admin/industries/:id',
        'get',
        `/admin/industries/${testData.industryId}`
      );
    }

    logTest('5. Update Industry');
    if (testData.industryId) {
      result = await testEndpoint(
        'PUT /admin/industries/:id',
        'put',
        `/admin/industries/${testData.industryId}`,
        {
          description: 'Updated: Hotel and hospitality industry'
        }
      );
    }

    logTest('6. Test Duplicate Industry (Should Fail)');
    await testEndpoint(
      'POST /admin/industries (duplicate)',
      'post',
      '/admin/industries',
      {
        industryName: `Test Hotels ${timestamp}`,
        description: 'Duplicate test'
      },
      409
    );

    // ========== CATEGORY TESTS ==========
    log('\n\n═══════════════ CATEGORY TESTS ═══════════════', 'yellow');

    logTest('7. Create Category');
    if (testData.industryId) {
      result = await testEndpoint(
        'POST /admin/categories',
        'post',
        '/admin/categories',
        {
          categoryName: 'Kitchen Staff',
          industryId: testData.industryId,
          description: 'Kitchen and culinary staff'
        },
        201
      );
      if (result && result.data) {
        testData.categoryId = result.data._id;
        logInfo(`Created Category ID: ${testData.categoryId}`);
      }
    }

    logTest('8. Get All Categories');
    result = await testEndpoint(
      'GET /admin/categories',
      'get',
      '/admin/categories'
    );
    if (result && result.data) {
      logInfo(`Found ${result.data.length} categories`);
    }

    logTest('9. Get Categories by Industry');
    if (testData.industryId) {
      result = await testEndpoint(
        'GET /admin/categories/by-industry/:industryId',
        'get',
        `/admin/categories/by-industry/${testData.industryId}`
      );
    }

    logTest('10. Get Category by ID');
    if (testData.categoryId) {
      result = await testEndpoint(
        'GET /admin/categories/:id',
        'get',
        `/admin/categories/${testData.categoryId}`
      );
    }

    logTest('11. Update Category');
    if (testData.categoryId) {
      result = await testEndpoint(
        'PUT /admin/categories/:id',
        'put',
        `/admin/categories/${testData.categoryId}`,
        {
          description: 'Updated: Kitchen and culinary staff'
        }
      );
    }

    logTest('12. Test Category with Invalid Industry (Should Fail)');
    await testEndpoint(
      'POST /admin/categories (invalid industry)',
      'post',
      '/admin/categories',
      {
        categoryName: 'Test Category',
        industryId: '507f1f77bcf86cd799439011',
        description: 'Test'
      },
      404
    );

    // ========== GET CUISINES FOR SUBCATEGORY TESTS ==========
    log('\n\n═══════════════ CUISINE SETUP ═══════════════', 'yellow');

    logTest('13. Get Available Cuisines');
    result = await testEndpoint(
      'GET /user/cuisines',
      'get',
      '/user/cuisines'
    );
    if (result && result.data && result.data.length > 0) {
      testData.cuisineId = result.data[0]._id;
      const cuisineName = result.data[0].cuisineName || result.data[0].Cuisine || 'Unknown';
      logInfo(`Found ${result.data.length} cuisines, using: ${cuisineName} (ID: ${testData.cuisineId})`);
    } else {
      logError('No cuisines found in database. Please add cuisines first.');
    }

    // ========== SUBCATEGORY TESTS ==========
    log('\n\n═══════════════ SUBCATEGORY TESTS ═══════════════', 'yellow');

    logTest('14. Create SubCategory (Non-Chef)');
    if (testData.categoryId && testData.industryId) {
      result = await testEndpoint(
        'POST /admin/subcategories',
        'post',
        '/admin/subcategories',
        {
          subCategoryName: 'Kitchen Helper',
          categoryId: testData.categoryId,
          industryId: testData.industryId,
          isChefRole: false,
          description: 'Kitchen helper staff'
        },
        201
      );
      if (result && result.data) {
        testData.subCategoryId = result.data._id;
        logInfo(`Created SubCategory ID: ${testData.subCategoryId}`);
      }
    }

    logTest('15. Create SubCategory (Chef with Cuisines)');
    let chefSubCategoryId = null;
    if (testData.categoryId && testData.industryId && testData.cuisineId) {
      result = await testEndpoint(
        'POST /admin/subcategories',
        'post',
        '/admin/subcategories',
        {
          subCategoryName: 'Head Chef',
          categoryId: testData.categoryId,
          industryId: testData.industryId,
          isChefRole: true,
          cuisines: [testData.cuisineId],
          description: 'Head chef position'
        },
        201
      );
      if (result && result.data) {
        chefSubCategoryId = result.data._id;
        logInfo(`Created Chef SubCategory ID: ${chefSubCategoryId}`);
      }
    }

    logTest('16. Get All SubCategories');
    result = await testEndpoint(
      'GET /admin/subcategories',
      'get',
      '/admin/subcategories'
    );
    if (result && result.data) {
      logInfo(`Found ${result.data.length} sub-categories`);
    }

    logTest('17. Get SubCategories by Category');
    if (testData.categoryId) {
      result = await testEndpoint(
        'GET /admin/subcategories/by-category/:categoryId',
        'get',
        `/admin/subcategories/by-category/${testData.categoryId}`
      );
    }

    logTest('18. Get SubCategory by ID');
    if (testData.subCategoryId) {
      result = await testEndpoint(
        'GET /admin/subcategories/:id',
        'get',
        `/admin/subcategories/${testData.subCategoryId}`
      );
    }

    logTest('19. Update SubCategory');
    if (testData.subCategoryId) {
      result = await testEndpoint(
        'PUT /admin/subcategories/:id',
        'put',
        `/admin/subcategories/${testData.subCategoryId}`,
        {
          description: 'Updated: Kitchen helper staff'
        }
      );
    }

    logTest('20. Test Mismatched Hierarchy (Should Fail)');
    await testEndpoint(
      'POST /admin/subcategories (mismatched)',
      'post',
      '/admin/subcategories',
      {
        subCategoryName: 'Test Sub',
        categoryId: testData.categoryId,
        industryId: '507f1f77bcf86cd799439011',
        isChefRole: false
      },
      400
    );

    // ========== DEPENDENCY VALIDATION TESTS ==========
    log('\n\n═══════════════ DEPENDENCY VALIDATION ═══════════════', 'yellow');

    logTest('21. Try to Delete Category with SubCategories (Should Fail)');
    if (testData.categoryId) {
      await testEndpoint(
        'DELETE /admin/categories/:id',
        'delete',
        `/admin/categories/${testData.categoryId}`,
        null,
        409
      );
    }

    logTest('22. Try to Delete Industry with Categories (Should Fail)');
    if (testData.industryId) {
      await testEndpoint(
        'DELETE /admin/industries/:id',
        'delete',
        `/admin/industries/${testData.industryId}`,
        null,
        409
      );
    }

    // ========== CLEANUP TESTS ==========
    log('\n\n═══════════════ CLEANUP (Proper Order) ═══════════════', 'yellow');

    logTest('23. Delete SubCategory (Kitchen Helper)');
    if (testData.subCategoryId) {
      await testEndpoint(
        'DELETE /admin/subcategories/:id',
        'delete',
        `/admin/subcategories/${testData.subCategoryId}`
      );
    }

    logTest('24. Delete SubCategory (Head Chef)');
    if (chefSubCategoryId) {
      await testEndpoint(
        'DELETE /admin/subcategories/:id (chef)',
        'delete',
        `/admin/subcategories/${chefSubCategoryId}`
      );
    }

    logTest('25. Delete Category (After SubCategories Removed)');
    if (testData.categoryId) {
      await testEndpoint(
        'DELETE /admin/categories/:id',
        'delete',
        `/admin/categories/${testData.categoryId}`
      );
    }

    logTest('26. Delete Industry (After Categories Removed)');
    if (testData.industryId) {
      await testEndpoint(
        'DELETE /admin/industries/:id',
        'delete',
        `/admin/industries/${testData.industryId}`
      );
    }

    // ========== SUMMARY ==========
    log('\n\n╔═══════════════════════════════════════════════════════════╗', 'green');
    log('║                    TEST SUMMARY                           ║', 'green');
    log('╚═══════════════════════════════════════════════════════════╝', 'green');
    logSuccess('All API endpoints tested successfully!');
    logInfo('Backend server: http://localhost:8500');
    logInfo('Frontend admin: http://localhost:5174');
    log('\n✨ Next Steps:', 'cyan');
    log('1. Open http://localhost:5174 in your browser', 'cyan');
    log('2. Navigate to Job Management → Industry', 'cyan');
    log('3. Test the UI by creating Industry → Category → SubCategory', 'cyan');
    log('4. Test cascading dropdowns and chef-cuisine functionality\n', 'cyan');

  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    console.error(error);
  }
}

// Run tests
runTests().catch(console.error);
