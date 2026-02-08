import mongoose from "mongoose";
import ResourceModel from "../models/Resource.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/legalconnect";

const resources = [
  {
    title: "Tenant Rights Guide",
    description:
      "Comprehensive guide covering tenant rights, eviction procedures, and dispute resolution",
    type: "Guide",
    category: "Housing & Tenant Rights",
    content:
      "This guide covers tenant protections, security deposits, maintenance responsibilities, and eviction procedures.",
    file: "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/Tenants-Rights-Handbook.pdf",
    tags: ["housing", "tenant", "rights", "legal"],
  },
  {
    title: "Family Law Basics",
    description:
      "Understanding divorce, custody, alimony, and family law procedures",
    type: "Guide",
    category: "Family Law",
    content:
      "This guide explains the fundamentals of family law including divorce procedures, custody arrangements, and support calculations.",
    file: "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/Woman_Law.pdf",
    tags: ["family", "divorce", "custody", "law"],
  },
  {
    title: "Employment Rights Protection",
    description:
      "Know your rights as an employee - discrimination, wages, workplace safety",
    type: "Guide",
    category: "Employment Law",
    content:
      "Guide covering employee rights including minimum wage, overtime, discrimination, and workplace safety requirements.",
    file: "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/Labour_Law.pdf",
    tags: ["employment", "workers", "rights", "safety"],
  },
  {
    title: "Consumer Protection Act",
    description:
      "Understanding consumer rights and protections against fraudulent practices",
    type: "Article",
    category: "Consumer Rights",
    content:
      "Detailed article about consumer protection laws, warranty requirements, return policies, and fraud prevention.",
    file: "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/PRIVACY_LAW.pdf",
    tags: ["consumer", "protection", "warranty", "fraud"],
  },
  {
    title: "Criminal Defense Basics",
    description: "Understanding your rights if accused of a crime",
    type: "Guide",
    category: "Criminal Defense",
    content:
      "Guide on criminal rights, arrest procedures, bail, and basic defense strategies.",
    file: "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/Notice-of-Termination.pdf",
    tags: ["criminal", "defense", "rights", "arrest"],
  },
  {
    title: "Civil Rights Protection",
    description: "Overview of civil rights and anti-discrimination laws",
    type: "Guide",
    category: "Civil Rights",
    content:
      "Comprehensive guide on civil rights protections including discrimination, equal protection, and legal remedies.",
    file: "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/DISCRIMATION.pdf",
    tags: ["civil rights", "discrimination", "equality", "law"],
  },
  {
    title: "Traffic Violation Defense",
    description: "Understanding traffic laws and how to contest tickets",
    type: "Article",
    category: "Traffic & Driving",
    content:
      "Detailed information on traffic violations, penalties, and strategies for contesting traffic citations.",
    file: "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/RIGHT_EVICTION.pdf",
    tags: ["traffic", "driving", "violation", "ticket"],
  },
  {
    title: "Immigration Visa Types",
    description:
      "Overview of different visa categories and application requirements",
    type: "Article",
    category: "Immigration",
    content:
      "Detailed overview of various visa types including work visas, student visas, and family-sponsored immigration.",
    file: "https://ik.imagekit.io/igaryanthakur/legalconnect/resources/englishconstitution.pdf",
    tags: ["immigration", "visa", "legal status"],
  },
];

async function seedResources() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing resources
    await ResourceModel.deleteMany({});
    console.log("Cleared existing resources");

    // Insert new resources
    const created = await ResourceModel.insertMany(resources);
    console.log(`✓ Seeded ${created.length} resources successfully`);

    resources.forEach((resource, index) => {
      console.log(`  [${index + 1}] ${resource.title} (${resource.category})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding resources:", error);
    process.exit(1);
  }
}

seedResources();
