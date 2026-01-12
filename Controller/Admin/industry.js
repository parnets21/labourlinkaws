const industryModel = require("../../Model/Admin/jobmanagment/industrymanagment");


class industry {
 
   async addIndustry(req, res) {
    try {
      const { Industry } = req.body;
      let check = await industryModel.findOne({ Industry: Industry });
      if (check)
        return res.status(400).json({ error: "Industry already exist" });
      await industryModel.create({ Industry: Industry });
      return res.status(200).json({ success: "Successfully added" });
    } catch (error) {
      console.log(error);
    }
  }

  async getAllIndustry(req, res) {
    try {
      let data = await industryModel.find();
      return res.status(200).json({ success: data });
    } catch (error) {
      console.log(error);
    }
  }

  async deleteIndustry(req, res) {
    try {
      let Id = req.params.Id;
      let data = await industryModel.deleteOne({ _id: Id });
      if (data.deletedCount === 0)
        return res.status(400).json({ error: "Something went worng" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (error) {
      console.log(error);
    }
  }

  // Add subcategory to an industry
  async addSubcategory(req, res) {
    try {
      const { industryId } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Subcategory name is required" });
      }

      const industry = await industryModel.findById(industryId);
      if (!industry) {
        return res.status(404).json({ error: "Industry not found" });
      }

      // Check if subcategory already exists
      const exists = industry.subcategories.some(sub => sub.name === name);
      if (exists) {
        return res.status(400).json({ error: "Subcategory already exists" });
      }

      industry.subcategories.push({ name });
      await industry.save();

      return res.status(200).json({ 
        success: "Subcategory added successfully",
        data: industry 
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Update subcategory
  async updateSubcategory(req, res) {
    try {
      const { industryId, subcategoryId } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Subcategory name is required" });
      }

      const industry = await industryModel.findById(industryId);
      if (!industry) {
        return res.status(404).json({ error: "Industry not found" });
      }

      const subcategory = industry.subcategories.id(subcategoryId);
      if (!subcategory) {
        return res.status(404).json({ error: "Subcategory not found" });
      }

      subcategory.name = name;
      await industry.save();

      return res.status(200).json({ 
        success: "Subcategory updated successfully",
        data: industry 
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Delete subcategory
  async deleteSubcategory(req, res) {
    try {
      const { industryId, subcategoryId } = req.params;

      const industry = await industryModel.findById(industryId);
      if (!industry) {
        return res.status(404).json({ error: "Industry not found" });
      }

      industry.subcategories.pull(subcategoryId);
      await industry.save();

      return res.status(200).json({ 
        success: "Subcategory deleted successfully",
        data: industry 
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

}
module.exports = new industry();