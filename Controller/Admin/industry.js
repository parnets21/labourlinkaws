const industryModel = require("../../Model/Admin/industry");


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

}
module.exports = new industry();