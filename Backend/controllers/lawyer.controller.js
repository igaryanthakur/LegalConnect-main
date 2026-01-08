import multer from "multer";
import path from "path";
import Lawyer from "../models/Lawyer.js";
import { uploadProfile, processUpload } from "../utils/imagekit.js";

// Create upload middleware
export const uploadProfilePhoto = async (req, res) => {
  try {
    // req.file should be available from the uploadProfile middleware
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("File upload details:", req.file);

    // Get lawyer ID from URL parameter
    const lawyerId = req.params.id;

    // Find the lawyer profile
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer profile not found",
      });
    }

    // Ensure the logged-in user owns this profile
    if (lawyer.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this profile",
      });
    }

    // Update lawyer profile with the new image URL
    lawyer.profileImage = req.file.path || req.file.secure_url;
    await lawyer.save();

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      data: {
        profileImage: lawyer.profileImage,
      },
    });
  } catch (error) {
    console.error("Error in uploadProfilePhoto:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading profile image",
      error: error.message,
    });
  }
};
