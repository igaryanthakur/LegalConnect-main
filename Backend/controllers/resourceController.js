import ResourceModel from "../models/Resource.js";
import { uploadFile } from "../utils/imagekit.js";
import { logger } from "../utils/logger.js";

/**
 * @desc    Get all resources (with filters)
 * @route   GET /api/resources
 * @access  Public
 */
export const getResources = async (req, res) => {
  try {
    const { category, type, search } = req.query;
    let query = {};

    if (category && category !== "all") {
      query.category = category;
    }
    if (type && type !== "all") {
      query.type = type;
    }
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
        { tags: { $in: [new RegExp(term, "i")] } },
      ];
    }

    const resources = await ResourceModel.find(query)
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const data = resources.map((r) => ({
      id: r._id.toString(),
      title: r.title,
      description: r.description,
      type: r.type,
      category: r.category,
      file: r.file,
      content: r.content,
      author: r.author?.name || "Unknown",
      tags: r.tags,
      createdAt: r.createdAt,
    }));

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    logger.error("Get resources error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get resource categories
 * @route   GET /api/resources/categories
 * @access  Public
 */
export const getResourceCategories = async (req, res) => {
  try {
    const categories = [
      "Housing & Tenant Rights",
      "Family Law",
      "Employment Law",
      "Consumer Rights",
      "Civil Rights",
      "Other",
      "Immigration",
      "Traffic & Driving",
      "Criminal Defense",
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get resource by ID
 * @route   GET /api/resources/:id
 * @access  Public
 */
export const getResourceById = async (req, res) => {
  try {
    const resource = await ResourceModel.findById(req.params.id)
      .populate("author", "name email")
      .lean();

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Increment views
    await ResourceModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true },
    );

    res.json({
      success: true,
      data: {
        id: resource._id.toString(),
        title: resource.title,
        description: resource.description,
        type: resource.type,
        category: resource.category,
        file: resource.file,
        content: resource.content,
        author: resource.author?.name || "Unknown",
        tags: resource.tags,
        createdAt: resource.createdAt,
      },
    });
  } catch (error) {
    logger.error("Get resource by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Create new resource (admin only)
 * @route   POST /api/admin/resources
 * @access  Private/Admin
 */
export const createResource = async (req, res) => {
  try {
    const { title, description, type, category, content, tags } = req.body;

    // Validate required fields
    if (!title || !description || !type || !category) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, description, type, and category",
      });
    }

    let fileUrl = null;

    // Handle file upload to ImageKit
    if (req.file) {
      try {
        const uploadedFile = await uploadFile(
          req.file.buffer,
          `legalconnect/resources/${Date.now()}-${req.file.originalname}`,
          "pdf",
        );
        fileUrl = uploadedFile.url;
      } catch (uploadError) {
        logger.error("ImageKit upload error:", uploadError);
        return res.status(400).json({
          success: false,
          message: "Failed to upload file to ImageKit",
        });
      }
    }

    // Validate that either file or content is provided
    if (!fileUrl && !content) {
      return res.status(400).json({
        success: false,
        message: "Please provide either a PDF file or content text",
      });
    }

    // Create new resource
    const resource = await ResourceModel.create({
      title,
      description,
      type,
      category,
      content: content || null,
      file: fileUrl,
      author: req.user._id,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
    });

    await resource.populate("author", "name email");

    res.status(201).json({
      success: true,
      message: "Resource created successfully",
      data: {
        id: resource._id.toString(),
        title: resource.title,
        description: resource.description,
        type: resource.type,
        category: resource.category,
        file: resource.file,
        content: resource.content,
        author: resource.author?.name,
        tags: resource.tags,
        createdAt: resource.createdAt,
      },
    });
  } catch (error) {
    logger.error("Create resource error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating resource",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get resource file for download or view
 * @route   GET /api/resources/:id/file
 * @access  Public
 */
export const getResourceFile = async (req, res) => {
  try {
    const resource = await ResourceModel.findById(req.params.id).lean();

    if (!resource || !resource.file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Increment downloads
    await ResourceModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true },
    );

    const download = req.query.download === "true";

    // Return file info with URLs
    res.json({
      success: true,
      data: {
        fileUrl: resource.file,
        previewUrl: resource.file,
        downloadUrl: `${resource.file}?dl=1`,
        fileName: `${resource.title}.pdf`,
        download,
      },
    });
  } catch (error) {
    logger.error("Get resource file error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get resource file for download or view (Old implementation - can be removed)
 * @route   GET /api/resources/:id/file
 * @access  Public
 */
export const getResourceFileOld = async (req, res) => {
  try {
    const resourceId = req.params.id;

    // In a real app, you would fetch the resource from the database
    // Here we're using our mock data
    const resources = [
      // ...mock data with files
      { id: "1", file: "Tenants-Rights.pdf" },
      { id: "5", file: "DISCRIMINATION.pdf" }, // Note: URL has typo as "DISCRIMATION.pdf"
      { id: "6", file: "englishconstitution.pdf" },
      { id: "7", file: "Labour_Law.pdf" },
      { id: "8", file: "Model-Tenancy-Act-English.pdf" }, // Note: URL has "Model-Tenancy-Act-English-02_06_2021.pdf"
      { id: "9", file: "Notice-of-Termination.pdf" },
      { id: "10", file: "PRIVACY_LAW.pdf" },
      { id: "11", file: "RIGHT_EVICTION.pdf" },
      { id: "12", file: "Tenants-Rights-Handbook.pdf" },
      { id: "13", file: "Woman_Law.pdf" },
    ];

    const resource = resources.find((r) => r.id === resourceId);

    if (!resource || !resource.file) {
      return res.status(404).json({
        success: false,
        message: "Resource file not found",
      });
    }

    // Map to ImageKit URLs
    const pdfUrls = {
      "DISCRIMATION.pdf":
        "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/DISCRIMATION.pdf",
      "englishconstitution.pdf":
        "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/englishconstitution.pdf",
      "Labour_Law.pdf":
        "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/Labour_Law.pdf",
      "Model-Tenancy-Act-English-02_06_2021.pdf":
        "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/Model-Tenancy-Act-English-02_06_2021.pdf",
      "Notice-of-Termination.pdf":
        "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/Notice-of-Termination.pdf",
      "PRIVACY_LAW.pdf":
        "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/PRIVACY_LAW.pdf",
      "RIGHT_EVICTION.pdf":
        "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/RIGHT_EVICTION.pdf",
      "Tenants-Rights-Handbook.pdf":
        "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/Tenants-Rights-Handbook.pdf",
      "Woman_Law.pdf":
        "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/Woman_Law.pdf",
    };

    // Get the URL for the file
    const fileUrl = pdfUrls[resource.file];

    if (!fileUrl) {
      return res.status(404).json({
        success: false,
        message: "File URL not found",
      });
    }

    // Redirect to the ImageKit URL
    const download = req.query.download === "true";

    if (download) {
      res.redirect(fileUrl);
    } else {
      res.redirect(fileUrl);
    }
  } catch (error) {
    console.error("Get resource file error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
