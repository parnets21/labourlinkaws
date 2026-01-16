const categoryModel = require("../../Model/Admin/jobmanagment/Category");
const industryModel = require("../../Model/Admin/jobmanagment/industrymanagment");
const subCategoryModel = require("../../Model/Admin/jobmanagment/SubCategory");

class CategoryController {
  // POST /api/admin/categories - Create new category
  async addCategory(req, res) {
    try {
      const { categoryName, industryId, description } = req.body;

      // Validate required fields
      if (!categoryName) {
        return res.status(400).json({ error: "Category name is required" });
      }

      if (!industryId) {
        return res.status(400).json({ error: "Parent industry is required" });
      }

      // Verify industry exists
      const industry = await industryModel.findById(industryId);
      if (!industry) {
        return res.status(404).json({ error: "Parent industry not found" });
      }

      // Check if category already exists within this industry
      const existingCategory = await categoryModel.findOne({
        industryId,
        categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') }
      });

      if (existingCategory) {
        return res.status(409).json({ error: "Category already exists within this industry" });
      }

      // Create new category
      const newCategory = await categoryModel.create({
        categoryName: categoryName.trim(),
        industryId,
        description: description?.trim(),
        isActive: true,
        createdBy: req.user?._id
      });

      // Populate industry details
      await newCategory.populate('industryId', 'industryName industryId');

      return res.status(201).json({
        success: "Category created successfully",
        data: newCategory
      });
    } catch (error) {
      console.error("Error adding category:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/admin/categories - Get all categories
  async getAllCategories(req, res) {
    try {
      const categories = await categoryModel
        .find({ isActive: true })
        .populate('industryId', 'industryName industryId')
        .sort({ categoryName: 1 });

      // Get subcategory counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const subCategoryCount = await subCategoryModel.countDocuments({
            categoryId: category._id,
            isActive: true
          });

          return {
            ...category.toObject(),
            subCategoryCount
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: categoriesWithCounts
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/admin/categories/:id - Get category by ID
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;

      const category = await categoryModel
        .findById(id)
        .populate('industryId', 'industryName industryId');

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Get subcategory count
      const subCategoryCount = await subCategoryModel.countDocuments({
        categoryId: category._id,
        isActive: true
      });

      return res.status(200).json({
        success: true,
        data: {
          ...category.toObject(),
          subCategoryCount
        }
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // PUT /api/admin/categories/:id - Update category
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { categoryName, industryId, description, isActive } = req.body;

      const category = await categoryModel.findById(id);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // If industry is being changed, verify new industry exists
      if (industryId && industryId !== category.industryId.toString()) {
        const industry = await industryModel.findById(industryId);
        if (!industry) {
          return res.status(404).json({ error: "Industry not found" });
        }
      }

      // Check if new name already exists within the industry (excluding current category)
      if (categoryName && categoryName !== category.categoryName) {
        const targetIndustryId = industryId || category.industryId;
        const existingCategory = await categoryModel.findOne({
          categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') },
          industryId: targetIndustryId,
          _id: { $ne: id }
        });

        if (existingCategory) {
          return res.status(409).json({ error: "Category name already exists within this industry" });
        }
      }

      // Update fields
      if (categoryName) category.categoryName = categoryName.trim();
      if (industryId) category.industryId = industryId;
      if (description !== undefined) category.description = description?.trim();
      if (isActive !== undefined) category.isActive = isActive;
      category.updatedAt = Date.now();

      await category.save();
      await category.populate('industryId', 'industryName industryId');

      return res.status(200).json({
        success: "Category updated successfully",
        data: category
      });
    } catch (error) {
      console.error("Error updating category:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE /api/admin/categories/:id - Delete category with dependency validation
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const category = await categoryModel.findById(id);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Check for dependent sub-categories
      const subCategoryCount = await subCategoryModel.countDocuments({
        categoryId: id,
        isActive: true
      });

      if (subCategoryCount > 0) {
        return res.status(409).json({
          error: `Cannot delete category: ${subCategoryCount} dependent sub-categories exist`
        });
      }

      // Soft delete by setting isActive to false
      category.isActive = false;
      category.updatedAt = Date.now();
      await category.save();

      return res.status(200).json({
        success: "Category deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/admin/categories/by-industry/:industryId - Get categories by industry
  async getCategoriesByIndustry(req, res) {
    try {
      const { industryId } = req.params;

      // Verify industry exists
      const industry = await industryModel.findById(industryId);
      if (!industry) {
        return res.status(404).json({ error: "Industry not found" });
      }

      const categories = await categoryModel
        .find({
          industryId,
          isActive: true
        })
        .sort({ categoryName: 1 });

      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error("Error fetching categories by industry:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/admin/categories/:id/subcategories - Get sub-categories for category
  async getCategorySubCategories(req, res) {
    try {
      const { id } = req.params;

      const category = await categoryModel.findById(id);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const subCategories = await subCategoryModel
        .find({
          categoryId: id,
          isActive: true
        })
        .sort({ subCategoryName: 1 });

      return res.status(200).json({
        success: true,
        data: subCategories
      });
    } catch (error) {
      console.error("Error fetching category sub-categories:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new CategoryController();
