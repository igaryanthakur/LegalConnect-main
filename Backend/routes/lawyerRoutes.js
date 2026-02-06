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

export default router;
