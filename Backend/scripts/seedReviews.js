import mongoose from "mongoose";
import dotenv from "dotenv";
import UserModel from "../models/User.js";
import LawyerModel from "../models/Lawyer.js";
import ConsultationModel from "../models/Consultation.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/legalconnect";

// Review templates with varied ratings and comments
const reviewTemplates = [
  {
    rating: 5,
    comments: [
      "Excellent service! Very knowledgeable and professional. Helped me understand my legal options clearly.",
      "Outstanding lawyer! Resolved my case efficiently and kept me informed throughout the process.",
      "Highly recommend! Very patient in explaining complex legal matters in simple terms.",
      "Exceptional legal assistance. Professional, thorough, and genuinely cared about my case.",
      "Best consultation I've had. Very responsive and provided practical solutions to my problem.",
      "Amazing experience! Got my issue resolved quickly. Very professional and understanding.",
      "Top-notch service! Clear communication and expert advice. Couldn't ask for better help.",
      "Brilliant lawyer! Made the entire legal process stress-free and straightforward.",
    ],
  },
  {
    rating: 4,
    comments: [
      "Very good experience. Professional and helpful. Would recommend to others.",
      "Good consultation. Provided useful advice though took a bit longer than expected.",
      "Knowledgeable lawyer. Helped me navigate through my legal issues effectively.",
      "Solid advice and professional service. Mostly satisfied with the outcome.",
      "Good experience overall. Clear explanations and reasonable fees.",
      "Professional service. Got the help I needed, though communication could be faster.",
      "Helpful consultation. Lawyer was experienced and gave practical guidance.",
    ],
  },
  {
    rating: 3,
    comments: [
      "Average experience. Got basic advice but expected more detailed guidance.",
      "Decent consultation. Lawyer was knowledgeable but rushed through some points.",
      "Okay service. Helped with my issue but felt it could have been more thorough.",
      "Fair consultation. Got some useful information but not all my questions were answered.",
      "Satisfactory service. Professional but lacked personalized attention to my case.",
    ],
  },
  {
    rating: 2,
    comments: [
      "Below expectations. Consultation felt rushed and didn't get clear answers.",
      "Not very satisfied. Lawyer seemed distracted and didn't fully understand my situation.",
      "Disappointing experience. Expected more detailed advice for the consultation fee.",
      "Service was lacking. Communication was poor and follow-up was delayed.",
    ],
  },
  {
    rating: 1,
    comments: [
      "Very poor experience. Lawyer was unprepared and provided incorrect information.",
      "Waste of time and money. No proper guidance or resolution to my problem.",
      "Extremely disappointed. Unprofessional behavior and inadequate legal advice.",
    ],
  },
];

// Helper to get random review based on weighted distribution (more higher ratings)
function getRandomReview() {
  // Weighted distribution: 50% 5-star, 30% 4-star, 15% 3-star, 4% 2-star, 1% 1-star
  const rand = Math.random() * 100;
  let ratingIndex;

  if (rand < 50) {
    ratingIndex = 0; // 5 stars
  } else if (rand < 80) {
    ratingIndex = 1; // 4 stars
  } else if (rand < 95) {
    ratingIndex = 2; // 3 stars
  } else if (rand < 99) {
    ratingIndex = 3; // 2 stars
  } else {
    ratingIndex = 4; // 1 star
  }

  const template = reviewTemplates[ratingIndex];
  const comment =
    template.comments[Math.floor(Math.random() * template.comments.length)];

  return {
    rating: template.rating,
    comment: comment,
  };
}

async function seedReviews() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all completed consultations
    const completedConsultations = await ConsultationModel.find({
      status: "completed",
    })
      .populate("lawyer")
      .populate("client");

    if (completedConsultations.length === 0) {
      console.log(
        "❌ No completed consultations found. Please run seedConsultations.js first.",
      );
      process.exit(1);
    }

    console.log(
      `Found ${completedConsultations.length} completed consultations`,
    );

    // Clear existing reviews from all lawyers
    await LawyerModel.updateMany({}, { $set: { reviews: [] } });
    console.log("Cleared existing reviews");

    let reviewCount = 0;
    const lawyerReviewCounts = {};

    for (const consultation of completedConsultations) {
      try {
        const lawyer = await LawyerModel.findById(consultation.lawyer._id);
        if (!lawyer) {
          console.log(`Lawyer not found for consultation ${consultation._id}`);
          continue;
        }

        // Generate random review
        const review = getRandomReview();

        // Add review to lawyer's reviews array
        lawyer.reviews.push({
          user: consultation.client._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: new Date(
            consultation.scheduledDateTime.getTime() + 24 * 60 * 60 * 1000, // Review added 1 day after consultation
          ),
        });

        await lawyer.save(); // This will trigger the pre-save hook to calculate averageRating

        reviewCount++;
        lawyerReviewCounts[lawyer.user.toString()] =
          (lawyerReviewCounts[lawyer.user.toString()] || 0) + 1;
      } catch (error) {
        console.error(
          `Error adding review for consultation ${consultation._id}:`,
          error.message,
        );
      }
    }

    // Fetch updated lawyers with their average ratings
    const lawyersWithReviews = await LawyerModel.find({
      "reviews.0": { $exists: true },
    }).populate("user");

    console.log(`\n✓ Added ${reviewCount} reviews successfully!`);
    console.log("\nLawyer Review Summary:");
    console.log("=".repeat(60));

    lawyersWithReviews.forEach((lawyer) => {
      const avgRating = lawyer.averageRating.toFixed(2);
      const stars = "⭐".repeat(Math.round(lawyer.averageRating));
      console.log(`\n${lawyer.user.name}`);
      console.log(`  Reviews: ${lawyer.reviews.length}`);
      console.log(`  Average Rating: ${avgRating} ${stars}`);
      console.log(`  Consultation Fee: ₹${lawyer.consultationFee}`);
    });

    // Rating distribution
    console.log("\n" + "=".repeat(60));
    console.log("Rating Distribution:");
    const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    lawyersWithReviews.forEach((lawyer) => {
      lawyer.reviews.forEach((review) => {
        ratingDist[review.rating]++;
      });
    });

    Object.keys(ratingDist)
      .sort((a, b) => b - a)
      .forEach((rating) => {
        const count = ratingDist[rating];
        const percentage = ((count / reviewCount) * 100).toFixed(1);
        const bar = "█".repeat(Math.round(percentage / 2));
        console.log(
          `${rating} ⭐: ${count.toString().padStart(2)} (${percentage}%) ${bar}`,
        );
      });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding reviews:", error);
    process.exit(1);
  }
}

seedReviews();
