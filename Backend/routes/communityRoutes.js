import express from "express";
import {
  getTopics,
  getTopicById,
  createTopic,
  addReply,
  upvoteTopic,
  downvoteTopic,
  upvoteReply,
  downvoteReply,
  getCategories,
} from "../controllers/communityController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/topics", getTopics);
router.get("/topics/:id", getTopicById);
router.get("/categories", getCategories);

// Protected routes that require authentication
router.post("/topics", authenticate, createTopic);
router.post("/topics/:id/replies", authenticate, addReply);
router.put("/topics/:id/upvote", authenticate, upvoteTopic);
router.put("/topics/:id/downvote", authenticate, downvoteTopic);
router.put("/topics/:id/replies/:replyId/upvote", authenticate, upvoteReply);
router.put(
  "/topics/:id/replies/:replyId/downvote",
  authenticate,
  downvoteReply
);

export default router;
