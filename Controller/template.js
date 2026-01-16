const Template = require("../Model/template");
const { uploadFile2, deleteFile } = require(".././middileware/aws");

const templateController = {
  // Create Template
  async createTemplate(req, res) {
    try {
      const { title, description, category, tags ,type} = req.body;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "Image file is required" });
      }

      const file = req.files[0];
      const imageUrl = await uploadFile2(file, "templates");

      const newTemplate = await Template.create({
        title,
        description,
        category,
        tags: Array.isArray(tags) ? tags : tags?.split(",").map(tag => tag.trim()),
        image: imageUrl,
        type
      });

      return res.status(201).json({ success: true, message: "Template created successfully", data: newTemplate });
    } catch (error) {
      console.error("Error creating template:", error);
      return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  },

  // Get All Templates
  async getAllTemplates(req, res) {
    try {
      const templates = await Template.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: templates });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to fetch templates", error: error.message });
    }
  },

  // Update Template
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { title, description, category, tags, status, type } = req.body;

      let imageUrl;
      if (req.files && req.files.length > 0) {
        const file = req.files[0];

        // Find existing template to delete previous image
        const existingTemplate = await Template.findById(id);
        if (existingTemplate && existingTemplate.image?.startsWith("https://")) {
          await deleteFile(existingTemplate.image);
        }

        imageUrl = await uploadFile2(file, "templates");
      }

      const updatedData = {
        title,
        description,
        category,
        status,
        tags: Array.isArray(tags) ? tags : tags?.split(",").map(tag => tag.trim()),
      };

      if (type) updatedData.type = type;
      if (imageUrl) updatedData.image = imageUrl;

      const updatedTemplate = await Template.findByIdAndUpdate(id, updatedData, { new: true });

      if (!updatedTemplate) {
        return res.status(404).json({ success: false, message: "Template not found" });
      }

      return res.status(200).json({ success: true, message: "Template updated", data: updatedTemplate });
    } catch (error) {
      console.error("Error updating template:", error);
      return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  },

  // Delete Template
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const template = await Template.findById(id);
      if (!template) {
        return res.status(404).json({ success: false, message: "Template not found" });
      }

      // Delete image from S3
      // if (template.image?.startsWith("https://")) {
      //   await deleteFile(template.image);
      // }

      await Template.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: "Template deleted successfully" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  },
};

module.exports = templateController;
