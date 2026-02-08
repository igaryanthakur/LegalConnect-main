import mongoose from "mongoose";
import dotenv from "dotenv";
import UserModel from "../models/User.js";
import TopicModel from "../models/Topic.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/legalconnect";

// Topic templates with realistic legal discussion scenarios
const topicTemplates = [
  {
    title:
      "Landlord trying to evict without proper notice - what are my rights?",
    content: `My landlord just gave me a verbal notice to vacate the apartment within 15 days. I've been living here for 2 years and always paid rent on time. He says he needs the apartment for his son.

I haven't received any written notice and I believe 15 days is too short. What are my legal rights as a tenant? Can he forcefully evict me? Do I need to find a lawyer?

Any advice would be greatly appreciated as I'm really stressed about this situation.`,
    category: "Housing & Tenant Issues",
    anonymous: false,
  },
  {
    title: "Employer terminated me during maternity leave - is this legal?",
    content: `I work at a private company and was on maternity leave for the past 3 months. Last week I received an email saying my position has been "eliminated" due to restructuring.

This seems very suspicious to me as I was performing well before my pregnancy. My colleagues told me they hired someone else for my role a month ago.

Can a company fire someone during maternity leave? What legal options do I have? Should I file a complaint somewhere?`,
    category: "Employment Law",
    anonymous: false,
  },
  {
    title: "Car accident - insurance company denying my claim unreasonably",
    content: `I was rear-ended at a traffic signal 2 months ago. The other driver admitted fault at the scene and the police report clearly states they were at fault.

Now their insurance company is denying my claim saying there's "insufficient evidence" of their client's fault. My car repair costs are ₹85,000 and they're offering only ₹20,000.

What should I do? Can I take legal action against the insurance company? How do I proceed with this?`,
    category: "Consumer Protection",
    anonymous: false,
  },
  {
    title: "Divorce proceedings - confused about custody and alimony",
    content: `I'm going through a divorce after 8 years of marriage. We have a 5-year-old daughter. My husband and I both want custody but can't agree on arrangements.

I stopped working 6 years ago to take care of our child. Now I'm worried about financial support and custody. What factors do courts consider for child custody? Am I entitled to alimony since I gave up my career?

Any insights from people who've been through similar situations would be really helpful.`,
    category: "Family Law",
    anonymous: true,
  },
  {
    title:
      "Online seller refusing refund for defective product - consumer rights?",
    content: `I bought a laptop worth ₹45,000 from an online marketplace. It arrived with a cracked screen and won't power on. I immediately contacted the seller within 24 hours with photos and videos.

The seller is now saying it's "transit damage" and not their responsibility. The marketplace is not responding to my complaints. I paid through credit card.

Can I file a consumer complaint? What's the process? Should I try chargebacks with my credit card company?`,
    category: "Consumer Protection",
    anonymous: false,
  },
  {
    title: "Neighbor's illegal construction causing cracks in my wall",
    content: `My neighbor started construction work 3 months ago without proper permissions. They're building an additional floor and excavating near the property boundary.

Now I'm noticing cracks appearing in my walls and the structure seems unsafe. I've complained to them multiple times but they're not listening.

What legal steps can I take? Should I contact the municipal corporation? Can I get a court order to stop the construction?`,
    category: "Housing & Tenant Issues",
    anonymous: false,
  },
  {
    title: "Traffic challan for an offense I didn't commit - how to contest?",
    content: `I received a traffic challan for overspeeding on a highway. The problem is my car was parked at home that entire day - I have CCTV footage proving this.

The challan shows a photo but the license plate is partially obscured and looks like it might be a different car. The fine is ₹5,000.

How do I contest this? What's the procedure? Do I need to go to court or is there an online process?`,
    category: "Traffic & Driving",
    anonymous: false,
  },
  {
    title: "Visa application rejected - can I appeal the decision?",
    content: `My work visa application was rejected after 4 months of processing. I had a job offer from a company abroad and they required me to start in 2 months.

The rejection letter doesn't give clear reasons - just says "does not meet requirements." I believe I submitted all required documents correctly.

Can I appeal this decision? What are my options? Should I reapply or is there a formal appeals process?`,
    category: "Immigration",
    anonymous: false,
  },
  {
    title: "Employer not paying overtime wages - what can I do?",
    content: `I work 60+ hours per week but my employer only pays for 40 hours. They say overtime is "part of the job" and "everyone does it."

I've been tracking my hours for 6 months with time logs and emails showing late-night work. My coworkers face the same issue but are afraid to speak up.

What are my legal options? Can I file a labor complaint? Will I lose my job if I take legal action?`,
    category: "Employment Law",
    anonymous: true,
  },
  {
    title: "Credit card fraud - bank not reversing unauthorized transactions",
    content: `Someone made ₹1,20,000 worth of transactions on my credit card while it was in my possession. I noticed these charges immediately and reported to the bank within 3 hours.

Bank is saying I need to file an FIR first and "prove" I didn't make these transactions. This seems unreasonable as the charges were made in different cities where I wasn't present.

What are my rights as a credit card holder? Can the bank refuse to reverse fraudulent charges?`,
    category: "Consumer Protection",
    anonymous: false,
  },
  {
    title: "Property inheritance dispute with siblings - need advice",
    content: `My father passed away 2 years ago without a will. He owned a house and some agricultural land. I have 2 siblings and we can't agree on how to divide the property.

One sibling wants to sell everything and split the money. Another wants to keep the house. I want to keep the agricultural land as I'm the one who's been managing it.

What happens when there's no will? How is property divided among children? Should we go to court or try mediation?`,
    category: "Family Law",
    anonymous: true,
  },
  {
    title: "Builder delayed possession for 3 years - can I get compensation?",
    content: `I booked an apartment in 2021 with possession promised in 2022. It's now 2026 and the building is still not complete. I've paid 85% of the amount (₹45 lakhs).

Builder keeps giving excuses about "approvals" and "unforeseen delays." Meanwhile I'm paying both rent at my current place and EMIs for the home loan.

Can I sue for compensation? What are my legal remedies? Has anyone successfully gotten compensation from builders?`,
    category: "Housing & Tenant Issues",
    anonymous: false,
  },
  {
    title: "Domestic violence - how to get protection order urgently?",
    content: `I'm facing physical and verbal abuse from my spouse regularly. The situation has become dangerous and I fear for my safety and my children's safety.

I want to know how to get a protection order urgently. What's the process? Do I need a lawyer? How long does it take?

I don't have much financial resources. Are there free legal aid services available for such cases?`,
    category: "Family Law",
    anonymous: true,
  },
  {
    title: "Wrongful termination - fired for raising safety concerns",
    content: `I was terminated last week after reporting safety violations at my workplace to management. They cited "performance issues" but I have consistently good performance reviews.

Before my termination, I had raised concerns about unsafe working conditions that could cause accidents. Other employees can confirm this.

Is this wrongful termination? Can I sue my employer? What evidence do I need? How do whistleblower protections work?`,
    category: "Employment Law",
    anonymous: false,
  },
  {
    title: "Medical negligence - doctor's mistake caused permanent damage",
    content: `I underwent a routine surgery last year. Due to the doctor's negligence during the procedure, I now have permanent nerve damage in my leg.

Another doctor I consulted confirmed this was due to surgical error. My medical expenses are mounting and I can't work properly anymore.

How do I file a medical negligence case? What compensation can I claim? What's the process and how long does it typically take?`,
    category: "Other",
    anonymous: false,
  },
  {
    title: "Cheque bounce case - what are my options as creditor?",
    content: `I lent ₹5 lakhs to a business partner who gave me post-dated cheques as security. When I deposited the cheque, it bounced due to "insufficient funds."

I sent a legal notice within 30 days as required. They haven't responded and are now avoiding my calls.

What's the next step? How do I file a cheque bounce case? What's the punishment for cheque dishonor? Can I recover my money?`,
    category: "Other",
    anonymous: false,
  },
  {
    title: "Age discrimination at workplace - passed over for promotion",
    content: `I'm 52 years old and have been with my company for 15 years. Last month, they promoted a 28-year-old colleague who joined just 2 years ago to the position I was promised.

My manager made several age-related comments like "we need fresh blood" and "digital natives." I have better qualifications and experience.

Is this age discrimination? Can I take legal action? What evidence would I need to prove this?`,
    category: "Employment Law",
    anonymous: true,
  },
  {
    title: "Defamation on social media - someone posting false information",
    content: `A former business associate is posting false and damaging information about me on social media. They're claiming I "cheated" them and "stole" money, which is completely false.

These posts are damaging my reputation and affecting my business. Potential clients have backed out after seeing these posts.

Can I file a defamation case? What about cybercrime? How do I get these posts removed? Should I send a legal notice first?`,
    category: "Other",
    anonymous: false,
  },
  {
    title: "Hit-and-run accident victim - driver fled the scene",
    content: `I was hit by a car while crossing the road. The driver didn't stop and fled the scene. Fortunately, bystanders noted down the vehicle number.

I have injuries requiring treatment and lost wages due to missing work. I filed an FIR immediately with the police.

What are my rights as a hit-and-run victim? Can I claim compensation? How do I proceed legally against the driver? What about insurance coverage?`,
    category: "Traffic & Driving",
    anonymous: false,
  },
  {
    title: "Adoption process - what documents and steps are required?",
    content: `My spouse and I want to adopt a child. We're learning about the legal process and requirements but it seems very complex.

What documents are needed? How long does the adoption process take? Are there age restrictions? What are the legal procedures we need to follow?

Any advice from people who've successfully completed adoption would be really valuable.`,
    category: "Family Law",
    anonymous: false,
  },
];

async function seedTopics() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Fetch all users (both regular users and lawyers)
    const users = await UserModel.find();
    if (users.length === 0) {
      console.log("❌ No users found. Please run seedDemoUsers.js first.");
      process.exit(1);
    }

    // Clear existing topics
    await TopicModel.deleteMany({});
    console.log("Cleared existing topics");

    const createdTopics = [];

    for (let i = 0; i < topicTemplates.length; i++) {
      const template = topicTemplates[i];
      const author = users[i % users.length];

      // Random initial views (0-50)
      const views = Math.floor(Math.random() * 51);

      // Random votes (simulate community engagement)
      const upvoteCount = Math.floor(Math.random() * 15);
      const downvoteCount = Math.floor(Math.random() * 5);

      // Generate random upvoters and downvoters
      const upvoters = [];
      const downvoters = [];

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

      // Create topic with some randomized past dates
      const daysAgo = Math.floor(Math.random() * 60); // 0-60 days ago
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      try {
        const topic = await TopicModel.create({
          title: template.title,
          content: template.content,
          user: author._id,
          anonymous: template.anonymous,
          category: template.category,
          views: views,
          upvotes: upvoters,
          downvotes: downvoters,
          voteScore: upvoters.length - downvoters.length,
          createdAt: createdAt,
          updatedAt: createdAt,
          replies: [], // Will be populated by seedReplies.js
        });

        createdTopics.push({
          id: topic._id,
          title: topic.title,
          author: author.name,
          category: topic.category,
          views: topic.views,
          voteScore: topic.voteScore,
          replies: 0,
        });
      } catch (error) {
        console.error(
          `Error creating topic "${template.title}":`,
          error.message,
        );
      }
    }

    console.log(`\n✓ Seeded ${createdTopics.length} topics successfully!`);
    console.log("\nTopic Summary by Category:");
    console.log("=".repeat(60));

    // Group by category
    const categoryGroups = createdTopics.reduce((acc, topic) => {
      if (!acc[topic.category]) acc[topic.category] = [];
      acc[topic.category].push(topic);
      return acc;
    }, {});

    Object.keys(categoryGroups).forEach((category) => {
      const topics = categoryGroups[category];
      console.log(`\n${category}: ${topics.length} topics`);
      topics.slice(0, 2).forEach((topic) => {
        console.log(`  - "${topic.title.substring(0, 60)}..."`);
        console.log(
          `    👤 ${topic.author} | 👁 ${topic.views} views | 📊 ${topic.voteScore} votes`,
        );
      });
    });

    console.log("\n" + "=".repeat(60));
    console.log(`Total: ${createdTopics.length} community discussions created`);
    console.log("Next: Run seedReplies.js to add comments to these topics");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding topics:", error);
    process.exit(1);
  }
}

seedTopics();
