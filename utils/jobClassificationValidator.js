const Category = require("../Model/Admin/jobmanagment/Category");
const SubCategory = require("../Model/Admin/jobmanagment/SubCategory");
const Industry = require("../Model/Admin/jobmanagment/industrymanagment");

/**
 * Validates that the job classification hierarchy is correct
 * Ensures:
 * 1. Category belongs to the selected Industry
 * 2. SubCategory belongs to the selected Category
 * 
 * @param {String} industryId - MongoDB ObjectId of the industry
 * @param {String} categoryId - MongoDB ObjectId of the category
 * @param {String} subCategoryId - MongoDB ObjectId of the subcategory
 * @returns {Promise<Object>} - { valid: boolean, error: string|null }
 */
async function validateJobClassification(industryId, categoryId, subCategoryId) {
  try {
    // If no classification provided, return valid (backward compatibility)
    if (!industryId && !categoryId && !subCategoryId) {
      return { valid: true, error: null };
    }

    // If industry is provided, verify it exists and is active
    if (industryId) {
      const industry = await Industry.findOne({ 
        _id: industryId, 
        isActive: true 
      });
      
      if (!industry) {
        return { 
          valid: false, 
          error: "Industry not found or inactive" 
        };
      }
    }

    // If category is provided, validate it belongs to the industry
    if (categoryId) {
      if (!industryId) {
        return { 
          valid: false, 
          error: "Industry is required when category is specified" 
        };
      }

      const category = await Category.findOne({ 
        _id: categoryId, 
        industryId: industryId,
        isActive: true 
      });
      
      if (!category) {
        return { 
          valid: false, 
          error: "Category does not belong to selected Industry or is inactive" 
        };
      }
    }

    // If subcategory is provided, validate it belongs to the category
    if (subCategoryId) {
      if (!categoryId) {
        return { 
          valid: false, 
          error: "Category is required when subcategory is specified" 
        };
      }

      const subcategory = await SubCategory.findOne({ 
        _id: subCategoryId, 
        categoryId: categoryId,
        industryId: industryId,
        isActive: true 
      });
      
      if (!subcategory) {
        return { 
          valid: false, 
          error: "Subcategory does not belong to selected Category or is inactive" 
        };
      }
    }

    return { valid: true, error: null };
  } catch (error) {
    console.error("Error validating job classification:", error);
    return { 
      valid: false, 
      error: "Validation error: " + error.message 
    };
  }
}

/**
 * Validates and returns populated classification data
 * @param {String} industryId - MongoDB ObjectId of the industry
 * @param {String} categoryId - MongoDB ObjectId of the category
 * @param {String} subCategoryId - MongoDB ObjectId of the subcategory
 * @returns {Promise<Object>} - { valid: boolean, error: string|null, data: Object|null }
 */
async function validateAndPopulateClassification(industryId, categoryId, subCategoryId) {
  const validation = await validateJobClassification(industryId, categoryId, subCategoryId);
  
  if (!validation.valid) {
    return { ...validation, data: null };
  }

  try {
    const data = {};

    if (industryId) {
      const industry = await Industry.findById(industryId)
        .select('industryId industryName');
      data.industry = industry;
    }

    if (categoryId) {
      const category = await Category.findById(categoryId)
        .select('categoryId categoryName industryId');
      data.category = category;
    }

    if (subCategoryId) {
      const subcategory = await SubCategory.findById(subCategoryId)
        .select('subCategoryId subCategoryName categoryId industryId');
      data.subcategory = subcategory;
    }

    return { valid: true, error: null, data };
  } catch (error) {
    console.error("Error populating classification data:", error);
    return { 
      valid: false, 
      error: "Error fetching classification data: " + error.message,
      data: null 
    };
  }
}

module.exports = {
  validateJobClassification,
  validateAndPopulateClassification
};
