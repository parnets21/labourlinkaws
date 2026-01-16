const industryModel = require("../../Model/Admin/jobmanagment/industrymanagment");
const categoryModel = require("../../Model/Admin/jobmanagment/Category");

class industry {
  // POST /api/admin/industries - Create new industry
  async addIndustry(req, res) {
    try {
      const { industryName, description } = req.body;

      // Validate required fields
      if (!industryName) {
        return res.status(400).json({ error: "Industry name is required" });
      }

      // Check if industry already exists
      const existingIndustry = await industryModel.findOne({ 
        industryName: { $regex: new RegExp(`^${industryName}$`, 'i') } 
      });
      
      if (existingIndustry) {
        return res.status(409).json({ error: "Industry already exists" });
      }

      // Create new industry
      const newIndustry = await industryModel.create({ 
        industryName: industryName.trim(),
        description: description?.trim(),
        isActive: true,
        createdBy: req.user?._id // Assuming user info is in req.user from auth middleware
      });

      return res.status(201).json({ 
        success: "Industry created successfully",
        data: newIndustry 
      });
    } catch (error) {
      console.error("Error adding industry:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/admin/industries - Get all industries with category counts
  async getAllIndustry(req, res) {
    try {
      const industries = await industryModel.find({ isActive: true }).sort({ industryName: 1 });

      // Get category counts for each industry
      const industriesWithCounts = await Promise.all(
        industries.map(async (industry) => {
          const categoryCount = await categoryModel.countDocuments({ 
            industryId: industry._id,
            isActive: true 
          });
          
          return {
            ...industry.toObject(),
            categoryCount
          };
        })
      );

      return res.status(200).json({ 
        success: true,
        data: industriesWithCounts 
      });
    } catch (error) {
      console.error("Error fetching industries:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/admin/industries/:id - Get industry by ID
  async getIndustryById(req, res) {
    try {
      const { id } = req.params;

      const industry = await industryModel.findById(id);
      
      if (!industry) {
        return res.status(404).json({ error: "Industry not found" });
      }

      // Get category count
      const categoryCount = await categoryModel.countDocuments({ 
        industryId: industry._id,
        isActive: true 
      });

      return res.status(200).json({ 
        success: true,
        data: {
          ...industry.toObject(),
          categoryCount
        }
      });
    } catch (error) {
      console.error("Error fetching industry:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // PUT /api/admin/industries/:id - Update industry
  async updateIndustry(req, res) {
    try {
      const { id } = req.params;
      const { industryName, description, isActive } = req.body;

      const industry = await industryModel.findById(id);
      
      if (!industry) {
        return res.status(404).json({ error: "Industry not found" });
      }

      // Check if new name already exists (excluding current industry)
      if (industryName && industryName !== industry.industryName) {
        const existingIndustry = await industryModel.findOne({ 
          industryName: { $regex: new RegExp(`^${industryName}$`, 'i') },
          _id: { $ne: id }
        });
        
        if (existingIndustry) {
          return res.status(409).json({ error: "Industry name already exists" });
        }
      }

      // Update fields
      if (industryName) industry.industryName = industryName.trim();
      if (description !== undefined) industry.description = description?.trim();
      if (isActive !== undefined) industry.isActive = isActive;
      industry.updatedAt = Date.now();

      await industry.save();

      return res.status(200).json({ 
        success: "Industry updated successfully",
        data: industry 
      });
    } catch (error) {
      console.error("Error updating industry:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE /api/admin/industries/:id - Delete industry with dependency validation
  async deleteIndustry(req, res) {
    try {
      const { id } = req.params;

      const industry = await industryModel.findById(id);
      
      if (!industry) {
        return res.status(404).json({ error: "Industry not found" });
      }

      // Check for dependent categories
      const categoryCount = await categoryModel.countDocuments({ 
        industryId: id,
        isActive: true 
      });

      if (categoryCount > 0) {
        return res.status(409).json({ 
          error: `Cannot delete industry: ${categoryCount} dependent categories exist` 
        });
      }

      // Soft delete by setting isActive to false
      industry.isActive = false;
      industry.updatedAt = Date.now();
      await industry.save();

      return res.status(200).json({ 
        success: "Industry deleted successfully" 
      });
    } catch (error) {
      console.error("Error deleting industry:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/admin/industries/:id/categories - Get categories for industry
  async getIndustryCategories(req, res) {
    try {
      const { id } = req.params;

      const industry = await industryModel.findById(id);
      
      if (!industry) {
        return res.status(404).json({ error: "Industry not found" });
      }

      const categories = await categoryModel.find({ 
        industryId: id,
        isActive: true 
      }).sort({ categoryName: 1 });

      return res.status(200).json({ 
        success: true,
        data: categories 
      });
    } catch (error) {
      console.error("Error fetching industry categories:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/admin/industries/search - Search industries
  async searchIndustries(req, res) {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const industries = await industryModel.find({
        industryName: { $regex: query, $options: 'i' },
        isActive: true
      }).sort({ industryName: 1 });

      // Get category counts for each industry
      const industriesWithCounts = await Promise.all(
        industries.map(async (industry) => {
          const categoryCount = await categoryModel.countDocuments({ 
            industryId: industry._id,
            isActive: true 
          });
          
          return {
            ...industry.toObject(),
            categoryCount
          };
        })
      );

      return res.status(200).json({ 
        success: true,
        data: industriesWithCounts 
      });
    } catch (error) {
      console.error("Error searching industries:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new industry();