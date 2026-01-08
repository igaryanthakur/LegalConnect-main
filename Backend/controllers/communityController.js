import TopicModel from "../models/Topic.js";
import { logger } from "../utils/logger.js";

// Create an in-memory store for topics during development
const mockTopics = [
  {
    id: "1",
    title: "Landlord won't fix heating, what are my options?",
    category: "Housing & Tenant Issues",
    user: {
      name: "John Smith",
      profileImage: "/avatar1.jpg",
    },
    anonymous: false,
    replies: 15,
    views: 234,
    voteScore: 12,
    createdAt: "2023-10-25T14:32:00Z",
    content:
      "My apartment heating has been broken for two weeks now and temperatures are dropping. I've contacted my landlord multiple times but they keep saying they'll 'get to it'. What are my legal options?",
  },
  {
    id: "2",
    title: "How does child custody work with an out-of-state move?",
    category: "Family Law",
    user: {
      name: "Parent In Need",
      profileImage: "/avatar2.jpg",
    },
    anonymous: false,
    replies: 7,
    views: 128,
    voteScore: 8,
    createdAt: "2023-10-24T09:15:00Z",
    content:
      "I have joint custody of my children with my ex-spouse. I received a job offer in another state that would significantly improve our financial situation. How can I legally move with my children?",
  },
  {
    id: "3",
    title: "Employer not paying overtime, what documentation do I need?",
    category: "Employment Law",
    user: {
      name: "Worker Rights",
      profileImage: "/avatar3.jpg",
    },
    anonymous: false,
    replies: 21,
    views: 302,
    voteScore: 15,
    createdAt: "2023-10-20T16:45:00Z",
    content:
      "I've been working 50+ hours weekly for the past three months, but my employer hasn't paid any overtime. What kind of documentation should I gather to support my case?",
  },
  {
    id: "4",
    title: "Success story: Won my security deposit case in small claims!",
    category: "Small Claims",
    user: {
      name: "Victorious Renter",
      profileImage: "/avatar4.jpg",
    },
    anonymous: false,
    replies: 18,
    views: 253,
    voteScore: 6,
    createdAt: "2023-10-22T11:20:00Z",
    content:
      "Just wanted to share my success story of winning my security deposit case in small claims court. Happy to answer questions about the process!",
  },
];

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
        `Socket event ${event} not emitted: namespace not available`
      );
    }
  } catch (error) {
    logger.error(`Socket emit error (${event}):`, error);
  }
};

/**
 * @desc    Get forum topics (with filters)
 * @route   GET /api/community/topics
 * @access  Public
 */
export const getTopics = async (req, res) => {
  try {
    // Return the in-memory mock topics
    res.json({
      success: true,
      count: mockTopics.length,
      data: mockTopics,
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

/**
 * @desc    Get forum categories
 * @route   GET /api/community/categories
 * @access  Public
 */
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
    // Find the topic by ID in our mock data
    const topic = mockTopics.find((t) => t.id === req.params.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    res.json({
      success: true,
      data: topic,
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

    // Generate a new topic object
    const newTopic = {
      id: `${mockTopics.length + 1}${Date.now().toString().substr(-4)}`, // Generate a simple unique ID
      title,
      category,
      content,
      anonymous,
      user: {
        name: req.user ? req.user.name : "Anonymous User",
        profileImage: req.user?.profileImage || "/avatar-default.jpg",
      },
      replies: 0,
      views: 0,
      voteScore: 0,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    // Add to our mock data store
    mockTopics.unshift(newTopic); // Add to beginning of array so it appears first

    // Emit WebSocket event for new topic (safely)
    safeEmitSocketEvent("new-topic", newTopic);

    res.status(201).json({
      success: true,
      data: newTopic,
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

    // Find the topic in our mock data
    const topic = mockTopics.find((t) => t.id === topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Create new reply
    const newReply = {
      id: `reply-${Date.now()}`,
      content,
      user: {
        name: anonymous
          ? "Anonymous"
          : req.user
          ? req.user.name
          : "Anonymous User",
        profileImage: anonymous
          ? "/avatar-default.jpg"
          : req.user?.profileImage || "/avatar-default.jpg",
      },
      anonymous,
      voteScore: 0,
      createdAt: new Date().toISOString(),
      upvotes: [],
      downvotes: [],
      replies: [],
    };

    // If parentId is provided, it's a reply to another comment
    if (parentId) {
      // Find the parent comment to add this as a nested reply
      const findParentAndAddReply = (commentsList) => {
        for (let comment of commentsList) {
          if (comment.id === parentId) {
            if (!comment.replies) comment.replies = [];
            comment.replies.push(newReply);
            return true;
          }

          // Check nested replies
          if (comment.replies && comment.replies.length > 0) {
            if (findParentAndAddReply(comment.replies)) {
              return true;
            }
          }
        }
        return false;
      };

      const found = findParentAndAddReply(topic.replies || []);

      if (!found) {
        return res.status(404).json({
          success: false,
          message: "Parent comment not found",
        });
      }
    } else {
      // It's a top-level reply to the topic
      if (!topic.replies) topic.replies = [];
      topic.replies.push(newReply);
    }

    // Increment reply count
    topic.replies = topic.replies ? topic.replies.length : 1;

    // Emit WebSocket event for new reply (safely)
    safeEmitSocketEvent(
      "new-reply",
      {
        topicId,
        reply: newReply,
        parentId,
      },
      `topic-${topicId}`
    );

    res.json({
      success: true,
      data: newReply,
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

    // Find the topic in our mock data
    const topic = mockTopics.find((t) => t.id === topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Increment vote score
    topic.voteScore += 1;

    // Emit WebSocket event for topic vote update (safely)
    safeEmitSocketEvent("topic-vote-update", {
      topicId,
      voteScore: topic.voteScore,
    });

    res.json({
      success: true,
      data: {
        message: `Upvote for topic ID: ${req.params.id} registered`,
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

    // Find the topic in our mock data
    const topic = mockTopics.find((t) => t.id === topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Decrement vote score
    topic.voteScore -= 1;

    // Emit WebSocket event for topic vote update (safely)
    safeEmitSocketEvent("topic-vote-update", {
      topicId,
      voteScore: topic.voteScore,
    });

    res.json({
      success: true,
      data: {
        message: `Downvote for topic ID: ${req.params.id} registered`,
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

    // Find the topic
    const topic = mockTopics.find((t) => t.id === topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Find the reply and update its vote score
    let replyFound = false;
    let voteScore = 0;

    const findReplyAndUpvote = (commentsList) => {
      for (let comment of commentsList) {
        if (comment.id === replyId) {
          comment.voteScore = (comment.voteScore || 0) + 1;
          voteScore = comment.voteScore;
          return true;
        }

        // Check nested replies
        if (comment.replies && comment.replies.length > 0) {
          if (findReplyAndUpvote(comment.replies)) {
            return true;
          }
        }
      }
      return false;
    };

    if (topic.replies && topic.replies.length > 0) {
      replyFound = findReplyAndUpvote(topic.replies);
    }

    if (!replyFound) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    // Emit WebSocket event for reply vote update (safely)
    safeEmitSocketEvent(
      "reply-vote-update",
      {
        topicId,
        replyId,
        voteScore,
      },
      `topic-${topicId}`
    );

    res.json({
      success: true,
      data: {
        message: `Upvote for reply ID: ${replyId} in topic ID: ${topicId} registered`,
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

    // Find the topic
    const topic = mockTopics.find((t) => t.id === topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Find the reply and update its vote score
    let replyFound = false;
    let voteScore = 0;

    const findReplyAndDownvote = (commentsList) => {
      for (let comment of commentsList) {
        if (comment.id === replyId) {
          comment.voteScore = (comment.voteScore || 0) - 1;
          voteScore = comment.voteScore;
          return true;
        }

        // Check nested replies
        if (comment.replies && comment.replies.length > 0) {
          if (findReplyAndDownvote(comment.replies)) {
            return true;
          }
        }
      }
      return false;
    };

    if (topic.replies && topic.replies.length > 0) {
      replyFound = findReplyAndDownvote(topic.replies);
    }

    if (!replyFound) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    // Emit WebSocket event for reply vote update (safely)
    safeEmitSocketEvent(
      "reply-vote-update",
      {
        topicId,
        replyId,
        voteScore,
      },
      `topic-${topicId}`
    );

    res.json({
      success: true,
      data: {
        message: `Downvote for reply ID: ${replyId} in topic ID: ${topicId} registered`,
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
