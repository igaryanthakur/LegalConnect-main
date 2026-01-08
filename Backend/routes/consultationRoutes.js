import express from "express";
import {
  updateConsultationStatus,
  rescheduleConsultation,
} from "../controllers/consultationController.js";
import { protect } from "../config/auth.js";

const router = express.Router();

// Consultation routes
router.put("/:id", protect, updateConsultationStatus);
router.put("/:id/reschedule", protect, rescheduleConsultation);

export default router;
