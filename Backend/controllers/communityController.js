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
        `Socket event ${event} not emitted: namespace not available`
      );
    }
  } catch (error) {
    logger.error(`Socket emit error (${event}):`, error);
  }
};

function toIdString(id) {
  return id ? id.toString() : null;
}

function normalizeProfileImage(profileImage) {
  if (!profileImage || profileImage === "default-profile.png") return "/lawyer.png";
  return profileImage;
}

function countRepliesRecursive(replies) {
  if (!Array.isArray(replies)) return 0;
  return replies.reduce(
    (sum, r) => sum + 1 + countRepliesRecursive(r.replies),
    0
  );
}

function collectReplyUserIds(replies, out = new Set()) {
  if (!Array.isArray(replies)) return out;
  for (const r of replies) {
    if (r?.user) out.add(toIdString(r.user));
    if (r?.replies?.length) collectReplyUserIds(r.replies, out);
  }
  return out;
}

function findReplyById(replies, replyId) {
  if (!Array.isArray(replies)) return null;
  for (const r of replies) {
    if (toIdString(r._id) === replyId || r.id === replyId) return r;
    const found = findReplyById(r.replies, replyId);
    if (found) return found;
  }
  return null;
}

function formatReply(reply, userById) {
  const userId = toIdString(reply.user);
  const user = userById.get(userId);
  const anonymous = !!reply.anonymous;
  const upvotes = Array.isArray(reply.upvotes) ? reply.upvotes.length : 0;
  const downvotes = Array.isArray(reply.downvotes) ? reply.downvotes.length : 0;
  const voteScore =
    typeof reply.voteScore === "number" ? reply.voteScore : upvotes - downvotes;

  return {
    id: toIdString(reply._id) || reply.id,
    content: reply.content,
    anonymous,
    voteScore,
    createdAt: reply.createdAt,
    user: {
      name: anonymous ? "Anonymous" : user?.name || "Anonymous User",
      profileImage: anonymous
        ? "/lawyer.png"
        : normalizeProfileImage(user?.profileImage),
      createdAt: user?.createdAt,
    },
    replies: Array.isArray(reply.replies)
      ? reply.replies.map((r) => formatReply(r, userById))
      : [],
  };
}

/**
 * @desc    Get forum topics (with filters)
 * @route   GET /api/community/topics
 * @access  Public
 */
export const getTopics = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const topics = await TopicModel.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "name profileImage createdAt" });

    const data = topics.map((t) => ({
      id: toIdString(t._id),
      title: t.title,
      category: t.category,
      content: t.content,
      anonymous: !!t.anonymous,
      user: {
        name: t.anonymous ? "Anonymous" : t.user?.name || "Anonymous User",
        profileImage: t.anonymous
          ? "/lawyer.png"
          : normalizeProfileImage(t.user?.profileImage),
        createdAt: t.user?.createdAt,
      },
      replies: countRepliesRecursive(t.replies),
      views: t.views || 0,
      voteScore: typeof t.voteScore === "number" ? t.voteScore : 0,
      createdAt: t.createdAt,
    }));

    res.json({ success: true, count: data.length, data });
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
    const topic = await TopicModel.findById(req.params.id).populate({
      path: "user",
      select: "name profileImage createdAt",
    });
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    const userIds = collectReplyUserIds(topic.replies);
    if (topic.user) userIds.add(toIdString(topic.user._id));
    const users = await UserModel.find({ _id: { $in: Array.from(userIds) } }).select(
      "name profileImage createdAt"
    );
    const userById = new Map(users.map((u) => [toIdString(u._id), u]));

    const formatted = {
      id: toIdString(topic._id),
      title: topic.title,
      category: topic.category,
      content: topic.content,
      anonymous: !!topic.anonymous,
      user: {
        name: topic.anonymous ? "Anonymous" : topic.user?.name || "Anonymous User",
        profileImage: topic.anonymous
          ? "/lawyer.png"
          : normalizeProfileImage(topic.user?.profileImage),
        createdAt: topic.user?.createdAt,
      },
      replies: Array.isArray(topic.replies)
        ? topic.replies.map((r) => formatReply(r, userById))
        : [],
      views: topic.views || 0,
      voteScore: typeof topic.voteScore === "number" ? topic.voteScore : 0,
      createdAt: topic.createdAt,
    };

    res.json({
      success: true,
      data: formatted,
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
    const topic = await TopicModel.create({
      title,
      category,
      content,
      anonymous: !!anonymous,
      user: req.user.id,
      replies: [],
    });

    const populated = await TopicModel.findById(topic._id).populate({
      path: "user",
      select: "name profileImage createdAt",
    });

    const formatted = {
      id: toIdString(populated._id),
      title: populated.title,
      category: populated.category,
      content: populated.content,
      anonymous: !!populated.anonymous,
      user: {
        name: populated.anonymous ? "Anonymous" : populated.user?.name || "Anonymous User",
        profileImage: populated.anonymous
          ? "/lawyer.png"
          : normalizeProfileImage(populated.user?.profileImage),
        createdAt: populated.user?.createdAt,
      },
      replies: 0,
      views: populated.views || 0,
      voteScore: populated.voteScore || 0,
      createdAt: populated.createdAt,
    };

    safeEmitSocketEvent("new-topic", formatted);

    res.status(201).json({ success: true, data: formatted });
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
    const topic = await TopicModel.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    const newReply = {
      content,
      user: req.user.id,
      anonymous: !!anonymous,
      upvotes: [],
      downvotes: [],
      replies: [],
    };

    if (parentId) {
      const parent = findReplyById(topic.replies, parentId);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent comment not found",
        });
      }
      if (!parent.replies) parent.replies = [];
      parent.replies.push(newReply);
    } else {
      topic.replies.push(newReply);
    }

    topic.updatedAt = new Date();
    await topic.save();

    const savedReply = parentId
      ? findReplyById(topic.replies, parentId)?.replies?.slice(-1)?.[0]
      : topic.replies.slice(-1)[0];

    const user = await UserModel.findById(req.user.id).select(
      "name profileImage createdAt"
    );
    const userById = new Map([[toIdString(user._id), user]]);
    const formattedReply = formatReply(savedReply, userById);

    safeEmitSocketEvent(
      "new-reply",
      {
        topicId,
        reply: formattedReply,
        parentId,
      },
      `topic-${topicId}`
    );

    res.json({ success: true, data: formattedReply });
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
    const topic = await TopicModel.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }
    const userId = req.user.id;
    const hasUpvoted = topic.upvotes.some((u) => toIdString(u.user) === userId);
    const hasDownvoted = topic.downvotes.some(
      (u) => toIdString(u.user) === userId
    );
    if (hasUpvoted) {
      topic.upvotes = topic.upvotes.filter((u) => toIdString(u.user) !== userId);
    } else {
      topic.upvotes.push({ user: userId });
      if (hasDownvoted) {
        topic.downvotes = topic.downvotes.filter(
          (u) => toIdString(u.user) !== userId
        );
      }
    }
    topic.voteScore = topic.upvotes.length - topic.downvotes.length;
    await topic.save();

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
    const topic = await TopicModel.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }
    const userId = req.user.id;
    const hasDownvoted = topic.downvotes.some(
      (u) => toIdString(u.user) === userId
    );
    const hasUpvoted = topic.upvotes.some((u) => toIdString(u.user) === userId);
    if (hasDownvoted) {
      topic.downvotes = topic.downvotes.filter(
        (u) => toIdString(u.user) !== userId
      );
    } else {
      topic.downvotes.push({ user: userId });
      if (hasUpvoted) {
        topic.upvotes = topic.upvotes.filter((u) => toIdString(u.user) !== userId);
      }
    }
    topic.voteScore = topic.upvotes.length - topic.downvotes.length;
    await topic.save();

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
    const topic = await TopicModel.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }
    const reply = findReplyById(topic.replies, replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }
    const userId = req.user.id;
    const hasUpvoted = reply.upvotes?.some((u) => toIdString(u.user) === userId);
    const hasDownvoted = reply.downvotes?.some(
      (u) => toIdString(u.user) === userId
    );
    if (hasUpvoted) {
      reply.upvotes = reply.upvotes.filter((u) => toIdString(u.user) !== userId);
    } else {
      reply.upvotes = reply.upvotes || [];
      reply.upvotes.push({ user: userId });
      if (hasDownvoted) {
        reply.downvotes = reply.downvotes.filter(
          (u) => toIdString(u.user) !== userId
        );
      }
    }
    reply.voteScore = (reply.upvotes?.length || 0) - (reply.downvotes?.length || 0);
    await topic.save();
    const voteScore = reply.voteScore;

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
    const topic = await TopicModel.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }
    const reply = findReplyById(topic.replies, replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }
    const userId = req.user.id;
    const hasDownvoted = reply.downvotes?.some(
      (u) => toIdString(u.user) === userId
    );
    const hasUpvoted = reply.upvotes?.some((u) => toIdString(u.user) === userId);
    if (hasDownvoted) {
      reply.downvotes = reply.downvotes.filter(
        (u) => toIdString(u.user) !== userId
      );
    } else {
      reply.downvotes = reply.downvotes || [];
      reply.downvotes.push({ user: userId });
      if (hasUpvoted) {
        reply.upvotes = reply.upvotes.filter((u) => toIdString(u.user) !== userId);
      }
    }
    reply.voteScore = (reply.upvotes?.length || 0) - (reply.downvotes?.length || 0);
    await topic.save();
    const voteScore = reply.voteScore;

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
