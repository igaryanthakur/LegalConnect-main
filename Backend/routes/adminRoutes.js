import express from "express";
import multer from "multer";
import {
  getDashboardStats,
  getUsers,
  deleteUser,
  getTopics,
  deleteTopic,
  deleteReply,
  getLawyers,
  deleteLawyer,
  getResources,
  deleteResource,
  getConsultations,
  deleteConsultation,
} from "../controllers/adminController.js";
import { createResource } from "../controllers/resourceController.js";
import { protect } from "../config/auth.js";
import { admin } from "../config/auth.js";

// Configure multer for file uploads (memory storage for ImageKit)
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.use(protect, admin);

router.get("/dashboard", getDashboardStats);
router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.get("/topics", getTopics);
router.delete("/topics/:topicId/replies/:replyId", deleteReply);
router.delete("/topics/:id", deleteTopic);
router.get("/lawyers", getLawyers);
router.delete("/lawyers/:id", deleteLawyer);
router.get("/resources", getResources);
router.post("/resources", upload.single("file"), createResource);
router.delete("/resources/:id", deleteResource);
router.get("/consultations", getConsultations);
router.delete("/consultations/:id", deleteConsultation);

export default router;
