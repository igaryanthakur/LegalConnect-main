import mongoose from "mongoose";
import dotenv from "dotenv";
import UserModel from "../models/User.js";
import TopicModel from "../models/Topic.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/legalconnect";

// Reply templates for different categories
const replyTemplates = {
  advice: [
    "I went through something similar last year. You should definitely consult a lawyer who specializes in this area. Don't wait too long.",
    "Based on my experience, you have a strong case. Document everything - emails, messages, receipts, everything. This will help your case significantly.",
    "I'd recommend filing a formal complaint first. Keep copies of all correspondence. If they don't respond in 15 days, you can escalate legally.",
    "Contact your local legal aid office. They often provide free consultations for such cases. Don't try to handle this alone.",
    "Take action immediately. The longer you wait, the harder it becomes to prove your case. Time is crucial in legal matters.",
  ],
  sympathy: [
    "I'm so sorry you're going through this. Stay strong and don't give up. The legal system can be slow but justice will prevail.",
    "This must be very stressful for you. Hang in there. Many people have faced similar situations and won their cases.",
    "I can understand how frustrating this must be. Keep fighting for your rights. You deserve justice.",
    "That sounds really difficult. Make sure you're taking care of yourself during this process. Legal battles can be emotionally draining.",
  ],
  information: [
    "According to the law, you have 60 days from the date of incident to file a complaint. Make sure you're within this timeframe.",
    "The process usually takes 3-6 months depending on the complexity of the case. Be patient but stay persistent.",
    "You'll need to gather these documents: identity proof, address proof, all relevant communications, and any evidence you have.",
    "The first step is to send a legal notice through a lawyer. This often resolves issues without going to court.",
    "Consumer forums can handle cases up to ₹1 crore. For amounts above that, you'll need to file in district court.",
  ],
  personal_experience: [
    "I had almost the exact same issue 6 months ago. I hired a lawyer and we settled out of court. Saved a lot of time and money.",
    "When this happened to me, I filed a police complaint first, then approached a lawyer. Having the FIR helped strengthen my case.",
    "I fought a similar case for 8 months. Finally won with full compensation plus legal costs. Don't give up!",
    "My experience was slightly different but I learned that having all documents organized from day 1 makes a huge difference.",
    "I went through this battle for a year. In retrospect, I should have acted faster. Time is really important in these matters.",
  ],
  questions: [
    "Have you consulted a lawyer yet? That should be your first step. They can guide you better than online advice.",
    "Do you have any written evidence? Emails, messages, contracts? Written proof is crucial for any legal action.",
    "Have you tried mediation or arbitration? Sometimes these alternative dispute resolution methods work faster than courts.",
    "What did the lawyer say when you consulted them? If you haven't consulted one yet, I'd highly recommend doing so.",
    "Have you checked if there's a consumer forum or grievance cell for this specific issue? They might be able to help faster.",
  ],
  warnings: [
    "Be careful about missing any legal deadlines. Limitation periods are strict and once expired, you lose your right to sue.",
    "Don't sign anything without a lawyer reviewing it first. Sometimes settlement offers are designed to waive your other rights.",
    "Watch out for fake lawyers or touts near courts. Always verify credentials before hiring anyone.",
    "Don't discuss your case details publicly until it's resolved. It might affect your legal position.",
    "Be aware that legal proceedings can be expensive. Make sure you understand all costs upfront before proceeding.",
  ],
  support: [
    "Stay strong! Many of us here have fought similar battles. Feel free to ask any questions.",
    "You're doing the right thing by seeking help. Knowledge is power in legal matters.",
    "The community here is very supportive. Keep us updated on your progress. We're rooting for you!",
    "Don't hesitate to ask more questions. Better to be fully informed before taking legal action.",
    "Wishing you all the best. Hope you get a favorable resolution soon. Stay positive!",
  ],
};

// Helper function to get random replies for a topic
function getRandomReplies(count) {
  const categories = Object.keys(replyTemplates);
  const replies = [];

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const templates = replyTemplates[category];
    const content = templates[Math.floor(Math.random() * templates.length)];
    replies.push(content);
  }

  return replies;
}

async function seedReplies() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Fetch all topics
    const topics = await TopicModel.find();
    if (topics.length === 0) {
      console.log("❌ No topics found. Please run seedTopics.js first.");
      process.exit(1);
    }

    // Fetch all users
    const users = await UserModel.find();
    if (users.length === 0) {
      console.log("❌ No users found. Please run seedDemoUsers.js first.");
      process.exit(1);
    }

    console.log(`Found ${topics.length} topics to add replies to`);

    let totalReplies = 0;
    const topicReplyStats = [];

    for (const topic of topics) {
      // Random number of replies (2-12 per topic)
      const replyCount = Math.floor(Math.random() * 11) + 2;
      const replyContents = getRandomReplies(replyCount);

      const replies = [];

      for (let i = 0; i < replyCount; i++) {
        const author = users[Math.floor(Math.random() * users.length)];

        // Random vote counts for each reply
        const upvoteCount = Math.floor(Math.random() * 8);
        const downvoteCount = Math.floor(Math.random() * 3);

        const upvoters = [];
        const downvoters = [];

        // Generate random voters for the reply
        for (let j = 0; j < upvoteCount; j++) {
          const voter = users[Math.floor(Math.random() * users.length)];
          if (!upvoters.find((v) => v.user.equals(voter._id))) {
            upvoters.push({ user: voter._id });
          }
        }

        for (let j = 0; j < downvoteCount; j++) {
          const voter = users[Math.floor(Math.random() * users.length)];
          if (
            !downvoters.find((v) => v.user.equals(voter._id)) &&
            !upvoters.find((v) => v.user.equals(voter._id))
          ) {
            downvoters.push({ user: voter._id });
          }
        }

        // Reply created sometime between topic creation and now
        const topicCreatedTime = new Date(topic.createdAt).getTime();
        const now = Date.now();
        const replyTime =
          topicCreatedTime + Math.random() * (now - topicCreatedTime);
        const replyCreatedAt = new Date(replyTime);

        replies.push({
          user: author._id,
          content: replyContents[i],
          anonymous: Math.random() > 0.85, // 15% anonymous replies
          upvotes: upvoters,
          downvotes: downvoters,
          voteScore: upvoters.length - downvoters.length,
          createdAt: replyCreatedAt,
          updatedAt: replyCreatedAt,
          replies: [], // No nested replies for simplicity
        });
      }

      // Update the topic with replies
      try {
        topic.replies = replies;
        await topic.save();

        topicReplyStats.push({
          title: topic.title.substring(0, 60),
          category: topic.category,
          replyCount: replies.length,
        });

        totalReplies += replies.length;
      } catch (error) {
        console.error(
          `Error adding replies to topic "${topic.title}":`,
          error.message,
        );
      }
    }

    console.log(`\n✓ Added ${totalReplies} replies successfully!`);
    console.log(
      `✓ Average ${(totalReplies / topics.length).toFixed(1)} replies per topic`,
    );
    console.log("\nTopic Reply Distribution:");
    console.log("=".repeat(60));

    // Show stats
    topicReplyStats.slice(0, 10).forEach((stat, index) => {
      console.log(`\n[${index + 1}] ${stat.title}...`);
      console.log(`    Category: ${stat.category}`);
      console.log(`    Replies: ${stat.replyCount} 💬`);
    });

    console.log("\n" + "=".repeat(60));
    console.log(
      `Total: ${totalReplies} replies across ${topics.length} topics`,
    );
    console.log("Community forums are now fully populated!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding replies:", error);
    process.exit(1);
  }
}

seedReplies();
