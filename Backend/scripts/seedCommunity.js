/**
 * Seed script: adds 10 demo community topics with comments.
 * Run from Backend folder: node scripts/seedCommunity.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import TopicModel from "../models/Topic.js";
import UserModel from "../models/User.js";

dotenv.config();

const TEST_PASSWORD = "test1234";

function reply(content, userId, anonymous = false, nested = []) {
  return {
    user: userId,
    content,
    anonymous,
    upvotes: [],
    downvotes: [],
    voteScore: 0,
    replies: nested,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function getOrCreateUser({ name, email }) {
  let user = await UserModel.findOne({ email });
  if (!user) {
    user = await UserModel.create({
      name,
      email,
      password: TEST_PASSWORD,
      role: "user",
      mobile: "+91 9000000000",
    });
  }
  return user;
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set in Backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: "legalconnect" });
  console.log("Connected to MongoDB (legalconnect).");

  // Demo users used as topic authors + commenters
  const demoUsers = await Promise.all([
    getOrCreateUser({ name: "Aarav Mehta", email: "aarav@legalconnect.test" }),
    getOrCreateUser({ name: "Isha Patel", email: "isha@legalconnect.test" }),
    getOrCreateUser({ name: "Kabir Singh", email: "kabir@legalconnect.test" }),
    getOrCreateUser({ name: "Naina Roy", email: "naina@legalconnect.test" }),
    getOrCreateUser({ name: "Rohan Gupta", email: "rohan@legalconnect.test" }),
  ]);

  const [u1, u2, u3, u4, u5] = demoUsers;

  const topics = [
    {
      title: "My landlord is refusing to return my security deposit. What can I do?",
      category: "Housing & Tenant Issues",
      content:
        "I moved out 3 weeks ago and my landlord is ignoring messages about the security deposit. The apartment was left clean and I have photos. What steps should I take?",
      user: u1._id,
      anonymous: false,
      replies: [
        reply(
          "Send a written demand notice (email + registered post) with a deadline and mention you have move-out photos.",
          u2._id
        ),
        reply(
          "Check your local rules—many places require return within 14–30 days or they owe penalties.",
          u3._id,
          true
        ),
      ],
    },
    {
      title: "Employer not paying overtime. How should I document this?",
      category: "Employment Law",
      content:
        "I work 50+ hours/week but my payslips show only 40 hours. I have WhatsApp messages assigning extra work. What evidence is best?",
      user: u2._id,
      anonymous: false,
      replies: [
        reply(
          "Keep a daily timesheet, save messages, and preserve any punch-in records or emails.",
          u4._id
        ),
        reply(
          "If coworkers also have the issue, written statements can help. Don’t delete chats—export them.",
          u5._id
        ),
      ],
    },
    {
      title: "Traffic challan issued incorrectly—how to dispute?",
      category: "Traffic & Driving",
      content:
        "I received an e-challan for a red light violation but I was not in that area. The vehicle number looks similar to mine. What should I do?",
      user: u3._id,
      anonymous: true,
      replies: [
        reply(
          "File an online grievance with the traffic portal and attach your vehicle RC and any GPS/location proof.",
          u1._id
        ),
        reply(
          "Also check if the photo evidence shows the plate clearly; request correction if it’s misread.",
          u2._id
        ),
      ],
    },
    {
      title: "Consumer complaint for a defective product—refund denied",
      category: "Consumer Protection",
      content:
        "Bought a laptop that keeps crashing. Service center says 'no issue found' but it happens daily. Store denied refund. Next steps?",
      user: u4._id,
      anonymous: false,
      replies: [
        reply(
          "Record a short video of the issue + keep service job sheets. Send a formal complaint email to brand + store.",
          u5._id
        ),
        reply(
          "If unresolved, consider filing in consumer forum with invoices and service reports.",
          u2._id
        ),
      ],
    },
    {
      title: "Small claims: How to recover money from a friend who won’t repay?",
      category: "Small Claims",
      content:
        "I lent ₹25,000 via UPI and have chat messages confirming it’s a loan. They keep delaying. Is small claims viable?",
      user: u5._id,
      anonymous: false,
      replies: [
        reply(
          "UPI proof + chats are useful. Send a legal notice first; many cases settle after that.",
          u3._id
        ),
        reply(
          "Check your local court’s small causes jurisdiction and filing procedure—keep everything chronological.",
          u1._id
        ),
      ],
    },
    {
      title: "Immigration: missed document upload deadline—options?",
      category: "Immigration",
      content:
        "I missed a portal upload deadline by 2 days due to a medical emergency. Is there a way to request reconsideration?",
      user: u1._id,
      anonymous: true,
      replies: [
        reply(
          "Submit a request with medical proof and ask for condonation/extension—many portals have a grievance option.",
          u4._id
        ),
      ],
    },
    {
      title: "Family law: how is child custody decided?",
      category: "Family Law",
      content:
        "What factors do courts consider for custody? I’m worried about relocating due to job changes.",
      user: u2._id,
      anonymous: false,
      replies: [
        reply(
          "Typically the child’s best interest is the core factor—stability, schooling, caregiving history, etc.",
          u3._id
        ),
        reply(
          "Relocation often requires permission or a modified parenting plan. Consult a family lawyer in your jurisdiction.",
          u5._id
        ),
      ],
    },
    {
      title: "Other: how to draft a simple rental agreement?",
      category: "Other",
      content:
        "I’m renting a room in a shared apartment. What clauses should be included to avoid disputes?",
      user: u3._id,
      anonymous: false,
      replies: [
        reply(
          "Include rent amount, deposit, notice period, utilities split, guest policy, and inventory list.",
          u1._id,
          false,
          [
            reply("Also add maintenance responsibilities and what happens if someone leaves early.", u2._id),
          ]
        ),
      ],
    },
    {
      title: "Housing: neighbor noise issues—legal remedies?",
      category: "Housing & Tenant Issues",
      content:
        "Neighbor plays loud music late night. Complained to building management but no change. What legal options exist?",
      user: u4._id,
      anonymous: false,
      replies: [
        reply(
          "Start with written complaints to management. If it persists, you can call local authorities for noise violations.",
          u5._id
        ),
      ],
    },
    {
      title: "Employment: termination without notice—what are my rights?",
      category: "Employment Law",
      content:
        "I was terminated immediately without notice or severance. Offer letter mentions a notice period. What should I do?",
      user: u5._id,
      anonymous: true,
      replies: [
        reply(
          "Check your employment contract and applicable labor laws. Ask HR in writing for the termination reason and final settlement.",
          u2._id
        ),
        reply(
          "If they violated the notice clause, you may claim notice pay. Keep all emails and letters.",
          u1._id
        ),
      ],
    },
  ];

  const created = [];
  for (const t of topics) {
    const exists = await TopicModel.findOne({ title: t.title });
    if (exists) {
      console.log(`Topic already exists, skipping: ${t.title}`);
      continue;
    }
    const doc = await TopicModel.create({
      title: t.title,
      category: t.category,
      content: t.content,
      anonymous: t.anonymous,
      user: t.user,
      replies: t.replies,
      views: Math.floor(Math.random() * 500),
    });
    created.push(doc);
    console.log(`Created topic: ${t.title}`);
  }

  console.log(`\nDone. Created ${created.length} topics.`);
  console.log("Demo user password for all created users:", TEST_PASSWORD);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

