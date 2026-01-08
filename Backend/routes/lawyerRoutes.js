import express from "express";
import {
  getLawyers,
  getLawyerById,
  scheduleLawyerConsultation,
  addLawyerReview,
  createLawyer,
  uploadLawyerProfileImage,
  getLawyerReviews,
  updateLawyerProfile,
} from "../controllers/lawyerController.js";
import { protect } from "../config/auth.js";
import { uploadProfile, processUpload } from "../utils/imagekit.js";
import path from "path";
import fs from "fs";
import {
  getLawyerConsultations,
  scheduleConsultation,
} from "../controllers/consultationController.js";

const router = express.Router();

// Lawyer routes
router.get("/", getLawyers);
router.get("/:id", getLawyerById);
router.post("/", protect, createLawyer);
router.put("/:id", protect, updateLawyerProfile);
router.post(
  "/upload-profile",
  protect,
  (req, res, next) => {
    uploadProfile(req, res, (err) => {
      if (err) {
        console.error("Upload middleware error:", err);
        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed",
        });
      }

      // Check if file was properly uploaded by the middleware
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "File upload failed - no file received",
        });
      }

      next();
    });
  },
  processUpload, // This middleware now handles ImageKit uploads
  uploadLawyerProfileImage
);

// Consultation routes
router.get("/:id/consultations", protect, getLawyerConsultations);
router.post("/:id/consultations", protect, scheduleConsultation);

// Review routes
router.get("/:id/reviews", getLawyerReviews);
router.post("/:id/reviews", protect, addLawyerReview);

// Add test endpoint for ImageKit if needed
router.post("/test-imagekit", protect, (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({
      success: false,
      message: "No image data provided",
    });
  }

  // Process base64 image and upload to ImageKit
  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Create temporary file
    const tempDir = path.join(process.cwd(), "uploads", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `test-${Date.now()}.png`);
    fs.writeFileSync(tempFilePath, buffer);

    // Import the function dynamically to avoid circular dependencies
    import("../utils/imagekit.js").then(async (module) => {
      try {
        const uploadResult = await module.uploadToImageKit(tempFilePath, {
          folder: "/lawsphere/test",
        });

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        res.json({
          success: true,
          url: uploadResult.url,
          fileId: uploadResult.fileId,
          message: "Image uploaded to ImageKit successfully",
        });
      } catch (error) {
        console.error("ImageKit upload error:", error);
        res.status(500).json({
          success: false,
          message: "Error uploading to ImageKit: " + error.message,
        });
      }
    });
  } catch (error) {
    console.error("Test upload error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing image: " + error.message,
    });
  }
});

export default router;
