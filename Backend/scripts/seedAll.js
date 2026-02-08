import mongoose from "mongoose";
import dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";

dotenv.config();

const execAsync = promisify(exec);

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/legalconnect";

async function runScript(scriptName) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running ${scriptName}...`);
  console.log("=".repeat(60));

  try {
    const { stdout, stderr } = await execAsync(`node scripts/${scriptName}`);
    console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`Error running ${scriptName}:`, error.message);
    return false;
  }
}

async function seedAll() {
  console.log("\n" + "=".repeat(60));
  console.log("LEGALCONNECT - Complete Database Seeding");
  console.log("=".repeat(60));

  try {
    // Test MongoDB connection
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");
    await mongoose.connection.close();

    // Run seed scripts in sequence
    const scripts = [
      "seedDemoLawyers.js",
      "seedDemoUsers.js",
      "seedConsultations.js",
      "seedReviews.js",
      "seedTopics.js",
      "seedReplies.js",
    ];

    for (const script of scripts) {
      const success = await runScript(script);
      if (!success) {
        console.log(`\n❌ Failed to complete seeding at ${script}`);
        process.exit(1);
      }
      // Wait a bit between scripts
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL SEEDING COMPLETED SUCCESSFULLY");
    console.log("=".repeat(60));
    console.log("\nDatabase now contains:");
    console.log("  • 10 Demo Lawyers (with consultation fees & availability)");
    console.log("  • 10 Demo Users (clients with complete profiles)");
    console.log(
      "  • 25 Consultations (mixed statuses: pending, accepted, paid, unpaid, completed, rejected)",
    );
    console.log(
      "  • Reviews for all completed consultations (realistic ratings & comments)",
    );
    console.log("  • 20 Community Topics (realistic legal discussion threads)");
    console.log("  • 100+ Replies (helpful comments on community topics)");
    console.log("\nYou can now:");
    console.log("  • Test lawyer search and filtering");
    console.log("  • View consultation management");
    console.log("  • Test payment flows");
    console.log("  • Explore user/lawyer dashboards");
    console.log("  • See lawyer ratings and reviews");
    console.log("  • Browse active community discussions");
    console.log("  • Post and reply in forums");
    console.log();

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

seedAll();
