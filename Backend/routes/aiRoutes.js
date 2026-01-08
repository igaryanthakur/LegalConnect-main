import express from "express";
import { askLegalQuestion, getLegalFAQs } from "../controllers/aiController.js";

const router = express.Router();

// Routes
router.post("/ask", askLegalQuestion);
router.get("/faq", getLegalFAQs);

export default router;
