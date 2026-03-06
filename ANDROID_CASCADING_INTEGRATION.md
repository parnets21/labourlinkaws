# Android App - Cascading Dropdowns Integration Guide

## Problem
The Android app is currently fetching ALL categories and ALL job roles, not filtering by selected industry/category.

## Current (Wrong) Endpoints Being Used

```
❌ GET /api/user/industries - Returns all industries (OK)
❌ GET /api/admin/getAllCategory - Returns ALL categories (NOT FILTERED)
❌ GET /api/user/job-roles - Returns ALL job roles (NOT FILTERED)
```

## Correct Endpoints to Use

```
✅ GET /api/user/industries - Get all industries
✅ GET /api/user/categories/by-industry/:industryId - Get categories for selected industry
✅ GET /api/user/subcategories/by-category/:categoryId - Get job roles for selected category
```

## Step-by-Step Implementation

### Step 1: Fetch Industries (On Screen Load)

```kotlin
// Kotlin/Java example
val response = apiService.getIndustries()
// GET https://laborlink.co.in/api/user/industries

// Response:
{
  "success": true,
  "data": [
    {
      "_id": "69932cf69217cbf65fdc6abd",
      "industryName": "Hotel",
      "industryId": "001"
    },
    {
      "_id": "69932cf69217cbf65fdc6abe",
      "industryName": "Hospitality",
      "industryId": "002"
    }
  ]
}
```

### Step 2: When User Selects Industry

```kotlin
// User selected "Hotel" with ID: 69932cf69217cbf65fdc6abd
val industryId = "69932cf69217cbf65fdc6abd"

// Fetch categories for this industry ONLY
val response = apiService.getCategoriesByIndustry(industryId)
// GET https://laborlink.co.in/api/user/categories/by-industry/69932cf69217cbf65fdc6abd

// Response:
{
  "success": true,
  "data": [
    {
      "_id": "6993339d9217cbf65fdc6b88",
      "categoryName": "Front Office",
      "categoryId": "001",
      "industryId": "69932cf69217cbf65fdc6abd"
    }
  ]
}

// ✅ Only shows categories for Hotel industry
// ❌ Does NOT show categories from Restaurant, Retail, etc.
```

### Step 3: When User Selects Category

```kotlin
// User selected "Front Office" with ID: 6993339d9217cbf65fdc6b88
val categoryId = "6993339d9217cbf65fdc6b88"

// Fetch job roles for this category ONLY
val response = apiService.getSubCategoriesByCategory(categoryId)
// GET https://laborlink.co.in/api/user/subcategories/by-category/6993339d9217cbf65fdc6b88

// Response:
{
  "success": true,
  "data": [
    {
      "_id": "699333d79217cbf65fdc6b8e",
      "subCategoryName": "Receptionist",
      "subCategoryId": "001",
      "categoryId": "6993339d9217cbf65fdc6b88",
      "industryId": "69932cf69217cbf65fdc6abd"
    },
    {
      "_id": "699333d79217cbf65fdc6b8f",
      "subCategoryName": "Concierge",
      "subCategoryId": "002",
      "categoryId": "6993339d9217cbf65fdc6b88",
      "industryId": "69932cf69217cbf65fdc6abd"
    }
  ]
}

// ✅ Only shows job roles for Front Office category
// ❌ Does NOT show job roles from Housekeeping, Kitchen, etc.
```

### Step 4: Submit Registration

```kotlin
val registrationData = mapOf(
    "fullName" to "John Doe",
    "email" to "john@example.com",
    "phone" to "1234567890",
    "password" to "password123",
    "industryId" to "69932cf69217cbf65fdc6abd",  // Hotel
    "categoryId" to "6993339d9217cbf65fdc6b88",  // Front Office
    "jobRoleId" to "699333d79217cbf65fdc6b8e",   // Receptionist
    "aadharNumber" to "123456789012"
)

val response = apiService.register(registrationData)
// POST https://laborlink.co.in/api/user/register
```

## Complete Android Code Example

```kotlin
// API Service Interface
interface LaborLinkApi {
    @GET("user/industries")
    suspend fun getIndustries(): Response<IndustryResponse>
    
    @GET("user/categories/by-industry/{industryId}")
    suspend fun getCategoriesByIndustry(
        @Path("industryId") industryId: String
    ): Response<CategoryResponse>
    
    @GET("user/subcategories/by-category/{categoryId}")
    suspend fun getSubCategoriesByCategory(
        @Path("categoryId") categoryId: String
    ): Response<SubCategoryResponse>
    
    @POST("user/register")
    suspend fun register(@Body data: RegistrationRequest): Response<RegistrationResponse>
}

// ViewModel or Repository
class RegistrationViewModel : ViewModel() {
    private val _industries = MutableLiveData<List<Industry>>()
    val industries: LiveData<List<Industry>> = _industries
    
    private val _categories = MutableLiveData<List<Category>>()
    val categories: LiveData<List<Category>> = _categories
    
    private val _jobRoles = MutableLiveData<List<JobRole>>()
    val jobRoles: LiveData<List<JobRole>> = _jobRoles
    
    fun loadIndustries() {
        viewModelScope.launch {
            val response = api.getIndustries()
            if (response.isSuccessful) {
                _industries.value = response.body()?.data
            }
        }
    }
    
    fun onIndustrySelected(industryId: String) {
        // Clear dependent dropdowns
        _categories.value = emptyList()
        _jobRoles.value = emptyList()
        
        // Fetch categories for selected industry
        viewModelScope.launch {
            val response = api.getCategoriesByIndustry(industryId)
            if (response.isSuccessful) {
                _categories.value = response.body()?.data
            }
        }
    }
    
    fun onCategorySelected(categoryId: String) {
        // Clear dependent dropdown
        _jobRoles.value = emptyList()
        
        // Fetch job roles for selected category
        viewModelScope.launch {
            val response = api.getSubCategoriesByCategory(categoryId)
            if (response.isSuccessful) {
                _jobRoles.value = response.body()?.data
            }
        }
    }
}

// Activity/Fragment
class RegistrationActivity : AppCompatActivity() {
    private lateinit var viewModel: RegistrationViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        viewModel = ViewModelProvider(this).get(RegistrationViewModel::class.java)
        
        // Load industries on screen load
        viewModel.loadIndustries()
        
        // Observe industries
        viewModel.industries.observe(this) { industries ->
            industrySpinner.adapter = IndustryAdapter(industries)
        }
        
        // Industry selection listener
        industrySpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val selectedIndustry = viewModel.industries.value?.get(position)
                selectedIndustry?.let {
                    viewModel.onIndustrySelected(it._id)
                }
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
        
        // Observe categories
        viewModel.categories.observe(this) { categories ->
            categorySpinner.adapter = CategoryAdapter(categories)
            categorySpinner.isEnabled = categories.isNotEmpty()
        }
        
        // Category selection listener
        categorySpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val selectedCategory = viewModel.categories.value?.get(position)
                selectedCategory?.let {
                    viewModel.onCategorySelected(it._id)
                }
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
        
        // Observe job roles
        viewModel.jobRoles.observe(this) { jobRoles ->
            jobRoleSpinner.adapter = JobRoleAdapter(jobRoles)
            jobRoleSpinner.isEnabled = jobRoles.isNotEmpty()
        }
    }
}
```

## UI/UX Flow

1. **Initial State**
   - Industry dropdown: ✅ Enabled, populated
   - Category dropdown: ❌ Disabled, empty
   - Job Role dropdown: ❌ Disabled, empty

2. **After Industry Selection**
   - Industry dropdown: ✅ Selected
   - Category dropdown: ✅ Enabled, populated with filtered categories
   - Job Role dropdown: ❌ Disabled, empty

3. **After Category Selection**
   - Industry dropdown: ✅ Selected
   - Category dropdown: ✅ Selected
   - Job Role dropdown: ✅ Enabled, populated with filtered job roles

4. **If User Changes Industry**
   - Category dropdown: ❌ Reset to empty, repopulated
   - Job Role dropdown: ❌ Reset to empty, disabled

## Testing Checklist

- [ ] Industry dropdown shows all 10 industries
- [ ] Selecting "Hotel" shows only Hotel categories (not Restaurant categories)
- [ ] Selecting "Front Office" shows only Front Office job roles
- [ ] Changing industry clears category and job role selections
- [ ] Changing category clears job role selection
- [ ] Registration sends industryId, categoryId, jobRoleId (not strings)
- [ ] Backend validation accepts the registration

## Common Mistakes to Avoid

❌ **Don't do this:**
```kotlin
// Fetching all categories and filtering in app
val allCategories = api.getAllCategories()
val filtered = allCategories.filter { it.industryId == selectedIndustryId }
```

✅ **Do this instead:**
```kotlin
// Let backend filter
val categories = api.getCategoriesByIndustry(selectedIndustryId)
```

## API Endpoints Summary

| Endpoint | Method | Purpose | When to Call |
|----------|--------|---------|--------------|
| `/api/user/industries` | GET | Get all industries | On screen load |
| `/api/user/categories/by-industry/:id` | GET | Get categories for industry | When industry selected |
| `/api/user/subcategories/by-category/:id` | GET | Get job roles for category | When category selected |
| `/api/user/register` | POST | Register user | On form submit |

## Data Models

```kotlin
data class Industry(
    val _id: String,
    val industryName: String,
    val industryId: String
)

data class Category(
    val _id: String,
    val categoryName: String,
    val categoryId: String,
    val industryId: String
)

data class JobRole(
    val _id: String,
    val subCategoryName: String,
    val subCategoryId: String,
    val categoryId: String,
    val industryId: String
)

data class RegistrationRequest(
    val fullName: String,
    val email: String,
    val phone: String,
    val password: String,
    val industryId: String,  // Send ID, not name
    val categoryId: String,  // Send ID, not name
    val jobRoleId: String,   // Send ID, not name
    val aadharNumber: String
)
```

## Need Help?

Run this test to verify endpoints are working:
```bash
node test-cascading-dropdowns.js
```

Check database status:
```bash
node check-categories.js
```
