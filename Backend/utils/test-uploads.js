import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");

console.log("Testing file server access for uploads:");
console.log("----------------------------------------");
console.log(`Uploads directory: ${uploadsDir}`);

// Check if uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  console.log("❌ Uploads directory does not exist");
  process.exit(1);
}

// Check if profiles directory exists
const profilesDir = path.join(uploadsDir, "profiles");
if (!fs.existsSync(profilesDir)) {
  console.log("❌ Profiles directory does not exist");
} else {
  console.log("✅ Profiles directory exists");

  // List files in profiles directory
  const files = fs.readdirSync(profilesDir);
  console.log(`Found ${files.length} files in profiles directory:`);

  files.forEach((file) => {
    const filePath = path.join(profilesDir, file);
    const stats = fs.statSync(filePath);
    console.log(`- ${file} (${Math.round(stats.size / 1024)} KB)`);
    console.log(`  URL: http://localhost:5000/uploads/profiles/${file}`);
  });
}

console.log(
  "\nTo access these files, make sure your server is running and the"
);
console.log("static file middleware is properly configured in server.js.");
console.log("\nTest access by opening one of the URLs above in your browser.");
