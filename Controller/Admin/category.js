const categoryModel = require("../../Model/Admin/category");
const subcategoryModel = require("../../Model/Admin/subcategory");

class category {
  async addCategory(req, res) {
    try {
      const { category,Industry } = req.body;
      let check = await categoryModel.findOne({ category: category });
      if (check)
        return res.status(400).json({ error: "Category already exist" });
      await categoryModel.create({ category: category,Industry:Industry });
      return res.status(200).json({ success: "Successfully added" });
    } catch (error) {
      console.log(error);
    }
  }

  async getAllCategory(req, res) {
    try {
      let data = await categoryModel.find();
      return res.status(200).json({ success: data });
    } catch (error) {
      console.log(error);
    }
  }

  async deleteCategory(req, res) {
    try {
      let Id = req.params.Id;
      let data = await categoryModel.deleteOne({ _id: Id });
      if (data.deletedCount === 0)
        return res.status(400).json({ error: "Something went worng" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (error) {
      console.log(error);
    }
  }
   async addIndustry(req, res) {
    try {
      const { Industry } = req.body;
      let check = await categoryModel.findOne({ Industry: Industry });
      if (check)
        return res.status(400).json({ error: "Industry already exist" });
      await categoryModel.create({ Industry: Industry });
      return res.status(200).json({ success: "Successfully added" });
    } catch (error) {
      console.log(error);
    }
  }

  async getAllIndustry(req, res) {
    try {
      let data = await categoryModel.find();
      return res.status(200).json({ success: data });
    } catch (error) {
      console.log(error);
    }
  }

  async deleteIndustry(req, res) {
    try {
      let Id = req.params.Id;
      let data = await categoryModel.deleteOne({ _id: Id });
      if (data.deletedCount === 0)
        return res.status(400).json({ error: "Something went worng" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (error) {
      console.log(error);
    }
  }
  async addSubcategory(req, res) {
    try {
      const { category, subcategory } = req.body;
      let check = await subcategoryModel.findOne({
        category: category,
        subcategory: subcategory,
      });
      if (check)
        return res.status(400).json({ error: "Subcategory already exist" });
      await subcategoryModel.create({
        category: category,
        subcategory: subcategory,
      });
      return res.status(200).json({ success: "Successfully added" });
    } catch (error) {
      console.log(error);
    }
  }

  async getAllSubCategory(req, res) {
    try {
      let data = await subcategoryModel.find();
      return res.status(200).json({ success: data });
    } catch (error) {
      console.log(error);
    }
  }

  async deleteSubCategory(req, res) {
    try {
      let Id = req.params.Id;
      let data = await subcategoryModel.deleteOne({ _id: Id });
      if (data.deletedCount === 0)
        return res.status(400).json({ error: "Something went worng" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (error) {
      console.log(error);
    }
  }
}
module.exports = new category();