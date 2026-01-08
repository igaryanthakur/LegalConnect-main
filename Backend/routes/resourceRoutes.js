import express from "express";
import {
  getResources,
  getResourceById,
  getResourceCategories,
  incrementView,
  incrementDownload,
  getResourceFile,
} from "../controllers/resourceController.js";

const router = express.Router();

// Resource routes
router.get("/", getResources);
router.get("/categories", getResourceCategories);
router.get("/:id", getResourceById);
router.put("/:id/view", incrementView);
router.put("/:id/download", incrementDownload);
router.get("/:id/file", getResourceFile);

export default router;
