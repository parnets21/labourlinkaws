const industryModel = require("../../Model/Admin/jobmanagment/industrymanagment");
const categoryModel = require("../../Model/Admin/jobmanagment/Category");
const subCategoryModel = require("../../Model/Admin/jobmanagment/SubCategory");
const mongoose = require("mongoose");

class BulkImportController {
  // POST /api/admin/bulk-import/hierarchy - Bulk import industry-category-subcategory data
  async bulkImportHierarchy(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { data } = req.body;

      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ 
          error: "Invalid data format. Expected array of industry objects." 
        });
      }

      const results = {
        successful: {
          industries: 0,
          categories: 0,
          subCategories: 0
        },
        skipped: {
          industries: [],
          categories: [],
          subCategories: []
        },
        errors: []
      };

      // Validate all records before insertion
      const validationErrors = this.validateBulkData(data);
      if (validationErrors.length > 0) {
        await session.abortTransaction();
        return res.status(400).json({
          error: "Validation failed",
          details: validationErrors
        });
      }

      // Process each industry
      for (const industryData of data) {
        try {
          // Check if industry already exists
          let industry = await industryModel.findOne({
            industryName: { $regex: new RegExp(`^${industryData.industryName}$`, 'i') }
          }).session(session);

          if (industry) {
            results.skipped.industries.push({
              name: industryData.industryName,
              reason: "Already exists"
            });
          } else {
            // Create industry
            industry = await industryModel.create([{
              industryName: industryData.industryName.trim(),
              description: industryData.description?.trim(),
              isActive: true,
              createdBy: req.user?._id
            }], { session });
            industry = industry[0];
            results.successful.industries++;
          }

          // Process categories for this industry
          if (industryData.categories && Array.isArray(industryData.categories)) {
            for (const categoryData of industryData.categories) {
              try {
                // Check if category already exists within this industry
                let category = await categoryModel.findOne({
                  industryId: industry._id,
                  categoryName: { $regex: new RegExp(`^${categoryData.categoryName}$`, 'i') }
                }).session(session);

                if (category) {
                  results.skipped.categories.push({
                    name: categoryData.categoryName,
                    industry: industryData.industryName,
                    reason: "Already exists"
                  });
                } else {
                  // Create category
                  category = await categoryModel.create([{
                    categoryName: categoryData.categoryName.trim(),
                    industryId: industry._id,
                    description: categoryData.description?.trim(),
                    isActive: true,
                    createdBy: req.user?._id
                  }], { session });
                  category = category[0];
                  results.successful.categories++;
                }

                // Process sub-categories for this category
                if (categoryData.subCategories && Array.isArray(categoryData.subCategories)) {
                  for (const subCategoryData of categoryData.subCategories) {
                    try {
                      // Check if sub-category already exists within this category
                      const existingSubCategory = await subCategoryModel.findOne({
                        categoryId: category._id,
                        subCategoryName: { $regex: new RegExp(`^${subCategoryData.subCategoryName}$`, 'i') }
                      }).session(session);

                      if (existingSubCategory) {
                        results.skipped.subCategories.push({
                          name: subCategoryData.subCategoryName,
                          category: categoryData.categoryName,
                          industry: industryData.industryName,
                          reason: "Already exists"
                        });
                      } else {
                        // Create sub-category
                        await subCategoryModel.create([{
                          subCategoryName: subCategoryData.subCategoryName.trim(),
                          categoryId: category._id,
                          industryId: industry._id,
                          isChefRole: subCategoryData.isChefRole || false,
                          cuisines: subCategoryData.cuisines || [],
                          description: subCategoryData.description?.trim(),
                          isActive: true,
                          createdBy: req.user?._id
                        }], { session });
                        results.successful.subCategories++;
                      }
                    } catch (subCategoryError) {
                      results.errors.push({
                        type: "subCategory",
                        name: subCategoryData.subCategoryName,
                        category: categoryData.categoryName,
                        industry: industryData.industryName,
                        error: subCategoryError.message
                      });
                    }
                  }
                }
              } catch (categoryError) {
                results.errors.push({
                  type: "category",
                  name: categoryData.categoryName,
                  industry: industryData.industryName,
                  error: categoryError.message
                });
              }
            }
          }
        } catch (industryError) {
          results.errors.push({
            type: "industry",
            name: industryData.industryName,
            error: industryError.message
          });
        }
      }

      // If there were any errors, rollback
      if (results.errors.length > 0) {
        await session.abortTransaction();
        return res.status(500).json({
          error: "Bulk import failed due to errors",
          results
        });
      }

      // Commit transaction
      await session.commitTransaction();

      return res.status(200).json({
        success: "Bulk import completed successfully",
        results
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error in bulk import:", error);
      return res.status(500).json({ 
        error: "Internal server error during bulk import",
        details: error.message 
      });
    } finally {
      session.endSession();
    }
  }

  // Validate bulk data structure
  validateBulkData(data) {
    const errors = [];

    data.forEach((industry, industryIndex) => {
      // Validate industry
      if (!industry.industryName || typeof industry.industryName !== 'string') {
        errors.push({
          index: industryIndex,
          type: "industry",
          field: "industryName",
          message: "Industry name is required and must be a string"
        });
      }

      // Validate categories
      if (industry.categories) {
        if (!Array.isArray(industry.categories)) {
          errors.push({
            index: industryIndex,
            type: "industry",
            field: "categories",
            message: "Categories must be an array"
          });
        } else {
          industry.categories.forEach((category, categoryIndex) => {
            if (!category.categoryName || typeof category.categoryName !== 'string') {
              errors.push({
                index: `${industryIndex}.${categoryIndex}`,
                type: "category",
                field: "categoryName",
                message: "Category name is required and must be a string"
              });
            }

            // Validate sub-categories
            if (category.subCategories) {
              if (!Array.isArray(category.subCategories)) {
                errors.push({
                  index: `${industryIndex}.${categoryIndex}`,
                  type: "category",
                  field: "subCategories",
                  message: "Sub-categories must be an array"
                });
              } else {
                category.subCategories.forEach((subCategory, subCategoryIndex) => {
                  if (!subCategory.subCategoryName || typeof subCategory.subCategoryName !== 'string') {
                    errors.push({
                      index: `${industryIndex}.${categoryIndex}.${subCategoryIndex}`,
                      type: "subCategory",
                      field: "subCategoryName",
                      message: "Sub-category name is required and must be a string"
                    });
                  }
                });
              }
            }
          });
        }
      }
    });

    return errors;
  }
}

module.exports = new BulkImportController();
