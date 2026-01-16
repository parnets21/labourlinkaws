const subCategoryModel = require("../../Model/Admin/jobmanagment/SubCategory");
const categoryModel = require("../../Model/Admin/jobmanagment/Category");
const industryModel = require("../../Model/Admin/jobmanagment/industrymanagment");
const cuisineModel = require("../../Model/Admin/jobmanagment/Cuisines");

class SubCategoryController {
  // POST /api/admin/subcategories - Create new sub-category
  async addSubCategory(req, res) {
    try {
      const { subCategoryName, categoryId, industryId, isChefRole, cuisines, description } = req.body;

      // Validate required fields
      if (!subCategoryName) {
        return res.status(400).json({ error: "Sub-category name is required" });
      }

      if (!categoryId) {
        return res.status(400).json({ error: "Parent category is required" });
      }

      if (!industryId) {
        return res.status(400).json({ error: "Parent industry is required" });
      }

      // Verify category exists and belongs to the specified industry
      const category = await categoryModel.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Parent category not found" });
      }

      if (category.industryId.toString() !== industryId) {
        return res.status(400).json({ error: "Selected category does not belong to selected industry" });
      }

      // Verify industry exists
      const industry = await industryModel.findById(industryId);
      if (!industry) {
        return res.status(404).json({ error: "Parent industry not found" });
      }

      // Check if sub-category already exists within this category
      const existingSubCategory = await subCategoryModel.findOne({
        categoryId,
        subCategoryName: { $regex: new RegExp(`^${subCategoryName}$`, 'i') }
      });

      if (existingSubCategory) {
        return res.status(409).json({ error: "Sub-category already exists within this category" });
      }

      // Validate cuisines if chef role
      let validatedCuisines = [];
      if (isChefRole && cuisines && cuisines.length > 0) {
        validatedCuisines = cuisines;
        // Verify all cuisine IDs exist (check with or without isActive filter)
        const cuisineCount = await cuisineModel.countDocuments({
          _id: { $in: cuisines }
        });
        if (cuisineCount !== cuisines.length) {
          return res.status(400).json({ error: "One or more cuisine IDs are invalid" });
        }
      }

      // Create new sub-category
      const newSubCategory = await subCategoryModel.create({
        subCategoryName: subCategoryName.trim(),
        categoryId,
        industryId,
        isChefRole: isChefRole || false,
        cuisines: validatedCuisines,
        description: description?.trim(),
        isActive: true,
        createdBy: req.user?._id
      });

      // Populate references
      await newSubCategory.populate([
        { path: 'industryId', select: 'industryName industryId' },
        { path: 'categoryId', select: 'categoryName categoryId' },
        { path: 'cuisines', select: 'cuisineName cuisineId' }
      ]);

      return res.status(201).json({
        success: "Sub-category created successfully",
        data: newSubCategory
      });
    } catch (error) {
      console.error("Error adding sub-category:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/admin/subcategories - Get all sub-categories
  async getAllSubCategories(req, res) {
    try {
      const subCategories = await subCategoryModel
        .find({ isActive: true })
        .populate('industryId', 'industryName industryId')
        .populate('categoryId', 'categoryName categoryId')
        .populate('cuisines', 'cuisineName cuisineId')
        .sort({ subCategoryName: 1 });

      return res.status(200).json({
        success: true,
        data: subCategories
      });
    } catch (error) {
      console.error("Error fetching sub-categories:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/admin/subcategories/:id - Get sub-category by ID
  async getSubCategoryById(req, res) {
    try {
      const { id } = req.params;

      const subCategory = await subCategoryModel
        .findById(id)
        .populate('industryId', 'industryName industryId')
        .populate('categoryId', 'categoryName categoryId')
        .populate('cuisines', 'cuisineName cuisineId');

      if (!subCategory) {
        return res.status(404).json({ error: "Sub-category not found" });
      }

      return res.status(200).json({
        success: true,
        data: subCategory
      });
    } catch (error) {
      console.error("Error fetching sub-category:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // PUT /api/admin/subcategories/:id - Update sub-category
  async updateSubCategory(req, res) {
    try {
      const { id } = req.params;
      const { subCategoryName, categoryId, industryId, isChefRole, cuisines, description, isActive } = req.body;

      const subCategory = await subCategoryModel.findById(id);

      if (!subCategory) {
        return res.status(404).json({ error: "Sub-category not found" });
      }

      // If category is being changed, verify it exists and belongs to the industry
      if (categoryId && categoryId !== subCategory.categoryId.toString()) {
        const category = await categoryModel.findById(categoryId);
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }

        const targetIndustryId = industryId || subCategory.industryId;
        if (category.industryId.toString() !== targetIndustryId.toString()) {
          return res.status(400).json({ error: "Selected category does not belong to selected industry" });
        }
      }

      // If industry is being changed, verify it exists
      if (industryId && industryId !== subCategory.industryId.toString()) {
        const industry = await industryModel.findById(industryId);
        if (!industry) {
          return res.status(404).json({ error: "Industry not found" });
        }
      }

      // Check if new name already exists within the category (excluding current sub-category)
      if (subCategoryName && subCategoryName !== subCategory.subCategoryName) {
        const targetCategoryId = categoryId || subCategory.categoryId;
        const existingSubCategory = await subCategoryModel.findOne({
          subCategoryName: { $regex: new RegExp(`^${subCategoryName}$`, 'i') },
          categoryId: targetCategoryId,
          _id: { $ne: id }
        });

        if (existingSubCategory) {
          return res.status(409).json({ error: "Sub-category name already exists within this category" });
        }
      }

      // Validate cuisines if chef role
      if (isChefRole !== undefined && isChefRole && cuisines && cuisines.length > 0) {
        const cuisineCount = await cuisineModel.countDocuments({
          _id: { $in: cuisines }
        });
        if (cuisineCount !== cuisines.length) {
          return res.status(400).json({ error: "One or more cuisine IDs are invalid" });
        }
      }

      // Update fields
      if (subCategoryName) subCategory.subCategoryName = subCategoryName.trim();
      if (categoryId) subCategory.categoryId = categoryId;
      if (industryId) subCategory.industryId = industryId;
      if (isChefRole !== undefined) subCategory.isChefRole = isChefRole;
      if (cuisines !== undefined) subCategory.cuisines = cuisines;
      if (description !== undefined) subCategory.description = description?.trim();
      if (isActive !== undefined) subCategory.isActive = isActive;
      subCategory.updatedAt = Date.now();

      await subCategory.save();
      await subCategory.populate([
        { path: 'industryId', select: 'industryName industryId' },
        { path: 'categoryId', select: 'categoryName categoryId' },
        { path: 'cuisines', select: 'cuisineName cuisineId' }
      ]);

      return res.status(200).json({
        success: "Sub-category updated successfully",
        data: subCategory
      });
    } catch (error) {
      console.error("Error updating sub-category:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE /api/admin/subcategories/:id - Delete sub-category with job reference validation
  async deleteSubCategory(req, res) {
    try {
      const { id } = req.params;

      const subCategory = await subCategoryModel.findById(id);

      if (!subCategory) {
        return res.status(404).json({ error: "Sub-category not found" });
      }

      // TODO: Check for active job postings referencing this sub-category
      // This will be implemented when job posting integration is done
      // const jobCount = await jobModel.countDocuments({ subCategoryId: id, isActive: true });
      // if (jobCount > 0) {
      //   return res.status(409).json({
      //     error: `Cannot delete sub-category: ${jobCount} active job postings reference it`
      //   });
      // }

      // Soft delete by setting isActive to false
      subCategory.isActive = false;
      subCategory.updatedAt = Date.now();
      await subCategory.save();

      return res.status(200).json({
        success: "Sub-category deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting sub-category:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/admin/subcategories/by-category/:categoryId - Get sub-categories by category
  async getSubCategoriesByCategory(req, res) {
    try {
      const { categoryId } = req.params;

      // Verify category exists
      const category = await categoryModel.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const subCategories = await subCategoryModel
        .find({
          categoryId,
          isActive: true
        })
        .populate('cuisines', 'cuisineName cuisineId')
        .sort({ subCategoryName: 1 });

      return res.status(200).json({
        success: true,
        data: subCategories
      });
    } catch (error) {
      console.error("Error fetching sub-categories by category:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // POST /api/admin/subcategories/:id/cuisines - Add cuisine to chef sub-category
  async addCuisineToSubCategory(req, res) {
    try {
      const { id } = req.params;
      const { cuisineId } = req.body;

      if (!cuisineId) {
        return res.status(400).json({ error: "Cuisine ID is required" });
      }

      const subCategory = await subCategoryModel.findById(id);

      if (!subCategory) {
        return res.status(404).json({ error: "Sub-category not found" });
      }

      if (!subCategory.isChefRole) {
        return res.status(400).json({ error: "Can only add cuisines to chef sub-categories" });
      }

      // Verify cuisine exists
      const cuisine = await cuisineModel.findById(cuisineId);
      if (!cuisine) {
        return res.status(404).json({ error: "Cuisine not found" });
      }

      // Check if cuisine is already associated
      if (subCategory.cuisines.includes(cuisineId)) {
        return res.status(409).json({ error: "Cuisine already associated with this sub-category" });
      }

      subCategory.cuisines.push(cuisineId);
      subCategory.updatedAt = Date.now();
      await subCategory.save();
      await subCategory.populate('cuisines', 'cuisineName cuisineId');

      return res.status(200).json({
        success: "Cuisine added successfully",
        data: subCategory
      });
    } catch (error) {
      console.error("Error adding cuisine to sub-category:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE /api/admin/subcategories/:id/cuisines/:cuisineId - Remove cuisine from sub-category
  async removeCuisineFromSubCategory(req, res) {
    try {
      const { id, cuisineId } = req.params;

      const subCategory = await subCategoryModel.findById(id);

      if (!subCategory) {
        return res.status(404).json({ error: "Sub-category not found" });
      }

      if (!subCategory.isChefRole) {
        return res.status(400).json({ error: "Can only remove cuisines from chef sub-categories" });
      }

      // Check if cuisine is associated
      if (!subCategory.cuisines.includes(cuisineId)) {
        return res.status(404).json({ error: "Cuisine not associated with this sub-category" });
      }

      subCategory.cuisines = subCategory.cuisines.filter(
        c => c.toString() !== cuisineId
      );
      subCategory.updatedAt = Date.now();
      await subCategory.save();
      await subCategory.populate('cuisines', 'cuisineName cuisineId');

      return res.status(200).json({
        success: "Cuisine removed successfully",
        data: subCategory
      });
    } catch (error) {
      console.error("Error removing cuisine from sub-category:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new SubCategoryController();
