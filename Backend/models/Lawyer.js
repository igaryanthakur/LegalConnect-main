import mongoose from "mongoose";

const lawyerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  profileImage: {
    type: String,
    default: "/lawyer.png",
  },
  practiceAreas: [
    {
      type: String,
      enum: [
        "Family Law",
        "Criminal Defense",
        "Immigration",
        "Housing & Tenants Rights",
        "Employment Law",
        "Civil Rights",
        "Consumer Protection",
        "Other",
      ],
      required: true,
    },
  ],
  serviceTypes: [
    {
      type: String,
      enum: ["Pro Bono", "Low Cost", "Sliding Scale", "Standard Rates"],
      required: true,
    },
  ],
  education: [
    {
      institution: String,
      degree: String,
      graduationYear: Number,
    },
  ],
  barNumber: {
    type: String,
    required: false,
  },
  languages: [
    {
      type: String,
      required: false,
    },
  ],
  officeAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  consultationFee: {
    type: Number,
    default: 0,
  },
  availability: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      startTime: String,
      endTime: String,
    },
  ],
  isVerified: {
    type: Boolean,
    default: false,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  averageRating: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate average rating when reviews are modified
lawyerSchema.pre("save", function (next) {
  if (this.reviews && this.reviews.length > 0) {
    this.averageRating =
      this.reviews.reduce((sum, review) => sum + review.rating, 0) /
      this.reviews.length;
  }
  next();
});

const LawyerModel = mongoose.model("Lawyer", lawyerSchema);

export default LawyerModel;
