const ouclientModel = require("../../Model/Admin/ourclien");


class Ourclients {
  async addOurClient(req, res) {
    try {
        let obj={}
        if (req.files.length != 0) {
            let arr = req.files
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].fieldname == "imageLogo") {
                    obj["imageLogo"] = arr[i].filename
                }
            }}else {return res.status(400).json({error:"Logo is required!"})}
    
        
      await ouclientModel.create(obj);
      return res.status(200).json({ success: "Successfully added" });
    } catch (error) {
      console.log(error);
    }
  }

  async getAllOurClient(req, res) {
    try {
      let data = await ouclientModel.find();
      return res.status(200).json({ success: data });
    } catch (error) {
      console.log(error);
    }
  }

  async deleteOurClients(req, res) {
    try {
      let Id = req.params.Id;
      let data = await ouclientModel.deleteOne({ _id: Id });
      if (data.deletedCount === 0)
        return res.status(400).json({ error: "Something went worng" });
      return res.status(200).json({ success: "Successfully deleted" });
    } catch (error) {
      console.log(error);
    }
  }
 
}
module.exports = new Ourclients();