import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a title"],
    trim: true,
    maxlength: [100, "Title cannot be more than 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
  },
  type: {
    type: String,
    enum: ["Guide", "Template", "Video", "Article"],
    required: [true, "Please specify resource type"],
  },
  category: {
    type: String,
    enum: [
      "Housing & Tenant Rights",
      "Family Law",
      "Employment Law",
      "Consumer Rights",
      "Immigration",
      "Traffic & Driving",
      "Criminal Defense",
      "Civil Rights",
      "Other",
    ],
    required: [true, "Please specify category"],
  },
  file: {
    type: String,
    required: false,
  },
  videoUrl: {
    type: String,
    required: false,
  },
  content: {
    type: String,
    required: false,
  },
  thumbnail: {
    type: String,
    required: false,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
  downloads: {
    type: Number,
    default: 0,
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for search
resourceSchema.index({
  title: "text",
  description: "text",
  tags: "text",
  category: "text",
  content: "text",
});

const ResourceModel = mongoose.model("Resource", resourceSchema);

export default ResourceModel;
