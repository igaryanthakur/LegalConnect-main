import TopicModel from "../models/Topic.js";
import UserModel from "../models/User.js";
import { logger } from "../utils/logger.js";

// Helper to safely emit socket events (works in both environments)
const safeEmitSocketEvent = (event, data, room = null) => {
  try {
    // In production, socket events will be silently ignored
    if (process.env.NODE_ENV === "production") {
      return; // Skip socket events in production
    }

    if (global.communityNamespace) {
      if (room) {
        global.communityNamespace.to(room).emit(event, data);
        logger.debug(`Emitted ${event} to room ${room}`);
      } else {
        global.communityNamespace.emit(event, data);
        logger.debug(`Emitted ${event} to all clients`);
      }
    } else {
      logger.debug(
        `Socket event ${event} not emitted: namespace not available`,
      );
    }
  } catch (error) {
    logger.error(`Socket emit error: ${error.message}`);
  }
};

// Helper function to map replies with vote scores
const mapReply = (reply) => {
  if (!reply) return reply;
  const replies = Array.isArray(reply.replies)
    ? reply.replies.map(mapReply)
    : [];
  const voteScore =
    typeof reply.voteScore === "number"
      ? reply.voteScore
      : (reply.upvotes?.length || 0) - (reply.downvotes?.length || 0);

  return {
    ...reply,
    id: reply._id?.toString?.() || reply.id,
    voteScore,
    replies,
  };
};

// Helper function to map topics with vote scores
const mapTopic = (
  topic,
  { list = false, userId = null, savedTopics = [] } = {},
) => {
  if (!topic) return topic;
  const voteScore =
    typeof topic.voteScore === "number"
      ? topic.voteScore
      : (topic.upvotes?.length || 0) - (topic.downvotes?.length || 0);

  // Check if current user has reported this topic
  const hasReported =
    userId && Array.isArray(topic.reports)
      ? topic.reports.some(
          (reportUserId) => reportUserId.toString() === userId.toString(),
        )
      : false;

  // Check if current user has saved this topic
  const topicIdStr = topic._id?.toString() || topic.id;
  const isSaved = savedTopics.some(
    (savedId) => savedId.toString() === topicIdStr,
  );

  return {
    ...topic,
    id: topicIdStr,
    voteScore,
    reportCount: Array.isArray(topic.reports) ? topic.reports.length : 0,
    hasReported,
    isSaved,
    replies: list
      ? Array.isArray(topic.replies)
        ? topic.replies.length
        : 0
      : Array.isArray(topic.replies)
        ? topic.replies.map(mapReply)
        : [],
  };
};

export const getTopics = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      filter.$or = [{ title: regex }, { content: regex }, { category: regex }];
    }

    const topics = await TopicModel.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name profileImage createdAt")
      .lean();

    const listData = topics.map((topic) => mapTopic(topic, { list: true }));

    res.json({
      success: true,
      count: listData.length,
      data: listData,
    });
  } catch (error) {
    logger.error("Get topics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving topics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = [
      {
        name: "Housing & Tenant Issues",
        icon: "fa-home",
        topics: 523,
        posts: 2100,
      },
      {
        name: "Family Law",
        icon: "fa-user-friends",
        topics: 412,
        posts: 1800,
      },
      {
        name: "Employment Law",
        icon: "fa-briefcase",
        topics: 385,
        posts: 1500,
      },
      {
        name: "Small Claims",
        icon: "fa-gavel",
        topics: 247,
        posts: 982,
      },
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving categories",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get topic by ID
 * @route   GET /api/community/topics/:id
 * @access  Public
 */
export const getTopicById = async (req, res) => {
  try {
    const userId = req.user?._id; // Optional auth

    // Fetch topic and increment views in one operation
    const topic = await TopicModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true },
    )
      .populate("user", "name profileImage createdAt")
      .populate({
        path: "replies",
        populate: {
          path: "user",
          select: "name profileImage",
        },
      });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Get user's saved topics if authenticated
    let savedTopics = [];
    if (userId) {
      const user = await UserModel.findById(userId).select("savedTopics");
      savedTopics = user?.savedTopics || [];
    }

    const mappedTopic = mapTopic(topic.toObject(), {
      list: false,
      userId,
      savedTopics,
    });

    res.json({
      success: true,
      data: mappedTopic,
    });
  } catch (error) {
    logger.error("Get topic by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving topic",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Create a new topic
 * @route   POST /api/community/topics
 * @access  Private
 */
export const createTopic = async (req, res) => {
  try {
    const { title, category, content, anonymous } = req.body;

    // Validate required fields
    if (!title || !category || !content) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, category, content",
      });
    }

    // Create a new topic document
    const newTopic = new TopicModel({
      title,
      category,
      content,
      anonymous: anonymous || false,
      user: req.user?._id,
      replies: [],
      views: 0,
      upvotes: [],
      downvotes: [],
      isPinned: false,
      createdAt: new Date(),
    });

    // Save to database
    const savedTopic = await newTopic.save();

    // Populate user data
    await savedTopic.populate("user", "name profileImage createdAt");

    // Get user's saved topics for isSaved field
    const userId = req.user._id;
    const user = await UserModel.findById(userId).select("savedTopics");
    const savedTopics = user?.savedTopics || [];

    const mappedTopic = mapTopic(savedTopic.toObject(), {
      list: false,
      userId,
      savedTopics,
    });

    // Emit WebSocket event for new topic (safely)
    safeEmitSocketEvent("new-topic", mappedTopic);

    res.status(201).json({
      success: true,
      data: mappedTopic,
    });
  } catch (error) {
    logger.error("Create topic error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating topic",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Add reply to topic
 * @route   POST /api/community/topics/:id/replies
 * @access  Private
 */
export const addReply = async (req, res) => {
  try {
    const topicId = req.params.id;
    const { content, parentId, anonymous } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    // Find the topic in database
    const topic = await TopicModel.findById(topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Create new reply object
    const newReply = {
      user: req.user?._id,
      content,
      anonymous: anonymous || false,
      upvotes: [],
      downvotes: [],
      voteScore: 0,
      replies: [],
      createdAt: new Date(),
    };

    // If parentId is provided, add as nested reply
    if (parentId) {
      // Find and update the parent reply with nested reply
      const parentFound = topic.replies.some((reply) => {
        if (reply._id.toString() === parentId) {
          reply.replies.push(newReply);
          return true;
        }
        // Could implement recursive search for deeply nested replies here if needed
        return false;
      });

      if (!parentFound) {
        return res.status(404).json({
          success: false,
          message: "Parent reply not found",
        });
      }
    } else {
      // Add as top-level reply
      topic.replies.push(newReply);
    }

    // Save the updated topic
    await topic.save();

    // Populate and re-fetch to get proper user data
    await topic.populate([
      {
        path: "replies.user",
        select: "name profileImage",
      },
      {
        path: "replies.replies.user",
        select: "name profileImage",
      },
    ]);

    // Get the newly added reply for response
    const addedReply = parentId
      ? topic.replies
          .find((r) => r._id.toString() === parentId)
          ?.replies.find((nr) => nr._id.toString() === newReply._id?.toString())
      : topic.replies[topic.replies.length - 1];

    const mappedReply = addedReply
      ? mapReply(addedReply)
      : {
          id: "unknown",
          content,
          user: { name: "User", profileImage: "/lawyer.png" },
          voteScore: 0,
          createdAt: new Date().toISOString(),
          replies: [],
        };

    // Emit WebSocket event
    safeEmitSocketEvent(
      "new-reply",
      {
        topicId,
        reply: mappedReply,
        parentId,
      },
      `topic-${topicId}`,
    );

    res.status(201).json({
      success: true,
      data: mappedReply,
    });
  } catch (error) {
    logger.error("Add reply error:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding reply",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Upvote a topic
 * @route   PUT /api/community/topics/:id/upvote
 * @access  Private
 */
export const upvoteTopic = async (req, res) => {
  try {
    const topicId = req.params.id;
    const userId = req.user.id;

    const topic = await TopicModel.findById(topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Check if user already upvoted
    const alreadyUpvoted = topic.upvotes.some(
      (vote) => vote.user.toString() === userId,
    );

    // Check if user already downvoted
    const alreadyDownvoted = topic.downvotes.some(
      (vote) => vote.user.toString() === userId,
    );

    if (alreadyUpvoted) {
      // Remove upvote (toggle off)
      topic.upvotes = topic.upvotes.filter(
        (vote) => vote.user.toString() !== userId,
      );
    } else {
      // Remove downvote if exists
      if (alreadyDownvoted) {
        topic.downvotes = topic.downvotes.filter(
          (vote) => vote.user.toString() !== userId,
        );
      }
      // Add upvote
      topic.upvotes.push({ user: userId });
    }

    // Recalculate vote score
    topic.voteScore = topic.upvotes.length - topic.downvotes.length;
    await topic.save();

    // Emit WebSocket event for topic vote update (safely)
    safeEmitSocketEvent("topic-vote-update", {
      topicId: topic._id.toString(),
      voteScore: topic.voteScore,
    });

    res.json({
      success: true,
      data: {
        message: alreadyUpvoted ? "Upvote removed" : "Upvote registered",
        voteScore: topic.voteScore,
      },
    });
  } catch (error) {
    logger.error("Upvote topic error:", error);
    res.status(500).json({
      success: false,
      message: "Server error upvoting topic",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Downvote a topic
 * @route   PUT /api/community/topics/:id/downvote
 * @access  Private
 */
export const downvoteTopic = async (req, res) => {
  try {
    const topicId = req.params.id;
    const userId = req.user.id;

    const topic = await TopicModel.findById(topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Check if user already downvoted
    const alreadyDownvoted = topic.downvotes.some(
      (vote) => vote.user.toString() === userId,
    );

    // Check if user already upvoted
    const alreadyUpvoted = topic.upvotes.some(
      (vote) => vote.user.toString() === userId,
    );

    if (alreadyDownvoted) {
      // Remove downvote (toggle off)
      topic.downvotes = topic.downvotes.filter(
        (vote) => vote.user.toString() !== userId,
      );
    } else {
      // Remove upvote if exists
      if (alreadyUpvoted) {
        topic.upvotes = topic.upvotes.filter(
          (vote) => vote.user.toString() !== userId,
        );
      }
      // Add downvote
      topic.downvotes.push({ user: userId });
    }

    // Recalculate vote score
    topic.voteScore = topic.upvotes.length - topic.downvotes.length;
    await topic.save();

    // Emit WebSocket event for topic vote update (safely)
    safeEmitSocketEvent("topic-vote-update", {
      topicId: topic._id.toString(),
      voteScore: topic.voteScore,
    });

    res.json({
      success: true,
      data: {
        message: alreadyDownvoted ? "Downvote removed" : "Downvote registered",
        voteScore: topic.voteScore,
      },
    });
  } catch (error) {
    logger.error("Downvote topic error:", error);
    res.status(500).json({
      success: false,
      message: "Server error downvoting topic",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Upvote a reply
 * @route   PUT /api/community/topics/:id/replies/:replyId/upvote
 * @access  Private
 */
export const upvoteReply = async (req, res) => {
  try {
    const topicId = req.params.id;
    const replyId = req.params.replyId;
    const userId = req.user.id;

    const topic = await TopicModel.findById(topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Find the reply and toggle vote
    let replyFound = false;
    let voteScore = 0;

    const findReplyAndToggleUpvote = (commentsList) => {
      for (let comment of commentsList) {
        if (comment._id.toString() === replyId) {
          // Check if user already upvoted
          const alreadyUpvoted = comment.upvotes.some(
            (vote) => vote.user.toString() === userId,
          );
          const alreadyDownvoted = comment.downvotes.some(
            (vote) => vote.user.toString() === userId,
          );

          if (alreadyUpvoted) {
            // Remove upvote
            comment.upvotes = comment.upvotes.filter(
              (vote) => vote.user.toString() !== userId,
            );
          } else {
            // Remove downvote if exists
            if (alreadyDownvoted) {
              comment.downvotes = comment.downvotes.filter(
                (vote) => vote.user.toString() !== userId,
              );
            }
            // Add upvote
            comment.upvotes.push({ user: userId });
          }

          comment.voteScore = comment.upvotes.length - comment.downvotes.length;
          voteScore = comment.voteScore;
          return true;
        }

        // Check nested replies
        if (comment.replies && comment.replies.length > 0) {
          if (findReplyAndToggleUpvote(comment.replies)) {
            return true;
          }
        }
      }
      return false;
    };

    if (topic.replies && topic.replies.length > 0) {
      replyFound = findReplyAndToggleUpvote(topic.replies);
    }

    if (!replyFound) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    await topic.save();

    // Emit WebSocket event for reply vote update (safely)
    safeEmitSocketEvent(
      "reply-vote-update",
      {
        topicId: topicId.toString(),
        replyId,
        voteScore,
      },
      `topic-${topicId}`,
    );

    res.json({
      success: true,
      data: {
        message: "Vote registered",
        voteScore,
      },
    });
  } catch (error) {
    logger.error("Upvote reply error:", error);
    res.status(500).json({
      success: false,
      message: "Server error upvoting reply",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Downvote a reply
 * @route   PUT /api/community/topics/:id/replies/:replyId/downvote
 * @access  Private
 */
export const downvoteReply = async (req, res) => {
  try {
    const topicId = req.params.id;
    const replyId = req.params.replyId;
    const userId = req.user.id;

    const topic = await TopicModel.findById(topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Find the reply and toggle vote
    let replyFound = false;
    let voteScore = 0;

    const findReplyAndToggleDownvote = (commentsList) => {
      for (let comment of commentsList) {
        if (comment._id.toString() === replyId) {
          // Check if user already downvoted
          const alreadyDownvoted = comment.downvotes.some(
            (vote) => vote.user.toString() === userId,
          );
          const alreadyUpvoted = comment.upvotes.some(
            (vote) => vote.user.toString() === userId,
          );

          if (alreadyDownvoted) {
            // Remove downvote
            comment.downvotes = comment.downvotes.filter(
              (vote) => vote.user.toString() !== userId,
            );
          } else {
            // Remove upvote if exists
            if (alreadyUpvoted) {
              comment.upvotes = comment.upvotes.filter(
                (vote) => vote.user.toString() !== userId,
              );
            }
            // Add downvote
            comment.downvotes.push({ user: userId });
          }

          comment.voteScore = comment.upvotes.length - comment.downvotes.length;
          voteScore = comment.voteScore;
          return true;
        }

        // Check nested replies
        if (comment.replies && comment.replies.length > 0) {
          if (findReplyAndToggleDownvote(comment.replies)) {
            return true;
          }
        }
      }
      return false;
    };

    if (topic.replies && topic.replies.length > 0) {
      replyFound = findReplyAndToggleDownvote(topic.replies);
    }

    if (!replyFound) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    await topic.save();

    // Emit WebSocket event for reply vote update (safely)
    safeEmitSocketEvent(
      "reply-vote-update",
      {
        topicId: topicId.toString(),
        replyId,
        voteScore,
      },
      `topic-${topicId}`,
    );

    res.json({
      success: true,
      data: {
        message: "Vote registered",
        voteScore,
      },
    });
  } catch (error) {
    logger.error("Downvote reply error:", error);
    res.status(500).json({
      success: false,
      message: "Server error downvoting reply",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Save/bookmark a topic
 * @route   POST /api/community/topics/:id/save
 * @access  Private
 */
export const saveTopic = async (req, res) => {
  try {
    const topicId = req.params.id;
    const userId = req.user._id;

    // Find the user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if topic exists
    const topic = await TopicModel.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Check if already saved
    if (user.savedTopics.includes(topicId)) {
      return res.status(400).json({
        success: false,
        message: "Topic already saved",
      });
    }

    // Add to saved topics
    user.savedTopics.push(topicId);
    await user.save();

    logger.info(`User ${userId} saved topic ${topicId}`);

    res.json({
      success: true,
      message: "Topic saved successfully",
    });
  } catch (error) {
    logger.error("Save topic error:", error);
    res.status(500).json({
      success: false,
      message: "Server error saving topic",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Unsave/unbookmark a topic
 * @route   DELETE /api/community/topics/:id/save
 * @access  Private
 */
export const unsaveTopic = async (req, res) => {
  try {
    const topicId = req.params.id;
    const userId = req.user._id;

    // Find the user and remove topic from savedTopics
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove from saved topics
    user.savedTopics = user.savedTopics.filter(
      (id) => id.toString() !== topicId,
    );
    await user.save();

    logger.info(`User ${userId} unsaved topic ${topicId}`);

    res.json({
      success: true,
      message: "Topic unsaved successfully",
    });
  } catch (error) {
    logger.error("Unsave topic error:", error);
    res.status(500).json({
      success: false,
      message: "Server error unsaving topic",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get user's saved topics
 * @route   GET /api/community/saved
 * @access  Private
 */
export const getSavedTopics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find user and populate saved topics
    const user = await UserModel.findById(userId).populate({
      path: "savedTopics",
      populate: {
        path: "user",
        select: "name profileImage",
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Map topics with proper formatting
    const savedTopicIds = user.savedTopics.map((t) => t._id);
    const topics = user.savedTopics
      .filter((topic) => topic) // Filter out null/deleted topics
      .map((topic) =>
        mapTopic(topic.toObject ? topic.toObject() : topic, {
          list: true,
          userId,
          savedTopics: savedTopicIds,
        }),
      );

    res.json({
      success: true,
      count: topics.length,
      data: topics,
    });
  } catch (error) {
    logger.error("Get saved topics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving saved topics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get user's posted topics
 * @route   GET /api/community/my-topics
 * @access  Private
 */
export const getUserPostedTopics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find topics created by the user
    const topics = await TopicModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "name profileImage")
      .lean();

    // Get user's saved topics for isSaved field
    const user = await UserModel.findById(userId).select("savedTopics");
    const savedTopics = user?.savedTopics || [];

    // Map topics with proper formatting
    const mappedTopics = topics.map((topic) =>
      mapTopic(topic, {
        list: true,
        userId,
        savedTopics,
      }),
    );

    res.json({
      success: true,
      count: mappedTopics.length,
      data: mappedTopics,
    });
  } catch (error) {
    logger.error("Get user posted topics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving posted topics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get topics user has commented on
 * @route   GET /api/community/my-comments
 * @access  Private
 */
export const getUserCommentedTopics = async (req, res) => {
  try {
    const userId = req.user._id;
    const userIdStr = userId.toString();

    // Find all topics and filter those where user has replied
    const allTopics = await TopicModel.find()
      .populate("user", "name profileImage")
      .lean();

    // Helper function to check if user replied to this topic or any nested reply
    const hasUserReplied = (replies) => {
      if (!Array.isArray(replies)) return false;

      for (const reply of replies) {
        if (reply.user && reply.user.toString() === userIdStr) {
          return true;
        }
        if (hasUserReplied(reply.replies)) {
          return true;
        }
      }
      return false;
    };

    // Filter topics where user has commented
    const commentedTopics = allTopics.filter((topic) =>
      hasUserReplied(topic.replies),
    );

    // Sort by most recent activity
    commentedTopics.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    // Get user's saved topics for isSaved field
    const user = await UserModel.findById(userId).select("savedTopics");
    const savedTopics = user?.savedTopics || [];

    // Map topics with proper formatting
    const mappedTopics = commentedTopics.map((topic) =>
      mapTopic(topic, {
        list: true,
        userId,
        savedTopics,
      }),
    );

    res.json({
      success: true,
      count: mappedTopics.length,
      data: mappedTopics,
    });
  } catch (error) {
    logger.error("Get user commented topics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving commented topics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Report a topic
 * @route   POST /api/community/topics/:id/report
 * @access  Private
 */
export const reportTopic = async (req, res) => {
  try {
    const topicId = req.params.id;
    const userId = req.user._id;

    // Find topic
    const topic = await TopicModel.findById(topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Check if user already reported
    const alreadyReported = topic.reports.some(
      (reportedUserId) => reportedUserId.toString() === userId.toString(),
    );

    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this topic",
      });
    }

    // Add user to reports
    topic.reports.push(userId);
    await topic.save();

    logger.info(
      `User ${userId} reported topic ${topicId}. Total reports: ${topic.reports.length}`,
    );

    res.json({
      success: true,
      reportCount: topic.reports.length,
      message: "Topic reported successfully",
    });
  } catch (error) {
    logger.error("Report topic error:", error);
    res.status(500).json({
      success: false,
      message: "Server error reporting topic",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Report a reply (increment counter)
 * @route   POST /api/community/topics/:id/replies/:replyId/report
 * @access  Private
 */
export const reportReply = async (req, res) => {
  try {
    const { id: topicId, replyId } = req.params;

    // Find topic and update reply report count
    const topic = await TopicModel.findByIdAndUpdate(
      topicId,
      { $inc: { "replies.$[elem].reports": 1 } },
      {
        new: true,
        arrayFilters: [{ "elem._id": replyId }],
      },
    );

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Find the updated reply to get the report count
    const reply = topic.replies.find((r) => r._id.toString() === replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    logger.info(
      `Reply ${replyId} in topic ${topicId} reported. Total reports: ${reply.reports}`,
    );

    res.json({
      success: true,
      reportCount: reply.reports,
      message: "Reply reported successfully",
    });
  } catch (error) {
    logger.error("Report reply error:", error);
    res.status(500).json({
      success: false,
      message: "Server error reporting reply",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
