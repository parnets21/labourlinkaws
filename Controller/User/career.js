const careerModel = require('../../Model/User/career');
// const Validator=require('../../Config/function');


class career {

    async careerAdd(req, res) {
        try {
            let { title, category, subcategory, description, adminId } = req.body
            let obj = { title, category, description, subcategory, adminId }
            if (req.files.length != 0) {
                let arr = req.files
                let i
                for (i = 0; i < arr.length; i++) {

                    if (arr[i].fieldname == "image") {
                        obj["image"] = arr[i].filename
                    }
                    if (arr[i].fieldname == "image1") {
                        obj["image1"] = arr[i].filename
                    }
                    if (arr[i].fieldname == "video") {
                        obj["video"] = arr[i].filename
                    }
                    if (arr[i].fieldname == "video1") {
                        obj["video1"] = arr[i].filename
                    }
                }
            }


            let career = new careerModel(obj);
            career.save().then((data) => {
                console.log(data);
                return res.status(200).json({ Success: "Successfully blogs posted" });
            });
        } catch (error) {
            console.log(error.message);
        }
    }

    async getCareer(req, res) {
        let data = await careerModel.find({})
            .populate('adminId');
        if (data.length != 0) {
            return res.status(200).json({ success: data });
        } else {
            return res.status(500).json({ success: "data not found" });
        }
    }
    async updateCareer(req, res) {
        try {
            let careerId = req.params.careerId

            let { description, title, category, subcategory } = req.body

            let obj = {}
            if (title) {
                obj['title'] = title
            }
            if (description) {
                obj['description'] = description;
            }

            if (category) {
                obj['category'] = category
            }
            if (subcategory) {
                obj['subcategory'] = subcategory
            }

            if (req.files.length != 0) {
                let arr = req.files
                let i
                for (i = 0; i < arr.length; i++) {
                    if (arr[i].fieldname == "image") {
                        obj["image"] = arr[i].filename
                    }
                    if (arr[i].fieldname == "image1") {
                        obj["image1"] = arr[i].filename
                    }
                    if (arr[i].fieldname == "video") {
                        obj["video"] = arr[i].filename
                    }
                    if (arr[i].fieldname == "video1") {
                        obj["video1"] = arr[i].filename
                    }
                }
            }
            let career = await careerModel.findOneAndUpdate({ _id: careerId }, { $set: obj }, { new: true })
            if (!career) return res.status(400).json({ msg: "Samething went worng" })

            return res.status(200).json({ status: true, msg: "Successfully updated" })
        } catch (err) {
            console.log(err)
        }
    }

    async deleteCareer(req, res) {
        try {
            let careerId = req.params.careerId

            let check = await careerModel.deleteOne({ _id: careerId });

            if (check.deletedCount == 0) {
                return res.status(400).json({ status: false, msg: "career is already delete" });
            } else {
                return res.status(200).json({ status: false, msg: "Career  Successfully deleted" });
            }
        } catch (err) {
            console.log(err)
        }
    }
   
    async getCareerByCategorey(req, res) {
        try {
            let category = req.query.category
            let blog = await careerModel.find({ category: category })
            .populate('adminId');
            if (blog.length <= 0) return res.status(404).json({ status: false, msg: "data not found" })

            return res.status(200).json({ Success: blog });
        } catch (err) {
            console.log(err.message)
        }
    }
}
const blogController = new career();
module.exports = blogController;
