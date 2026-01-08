import ImageKit from "imagekit";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import http from "https";

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    http
      .get(url, (response) => {
        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`✅ Image downloaded to ${filepath}`);
          resolve(filepath);
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {}); // Delete the file if download failed
        console.error(`❌ Error downloading image: ${err.message}`);
        reject(err);
      });
  });
}

async function testImageKitConnection() {
  console.log("Testing ImageKit connection:");
  console.log("----------------------------------------");

  try {
    // List files to test connection
    const files = await imagekit.listFiles({
      limit: 1,
    });
    console.log("✅ ImageKit connection successful!");
    console.log(`Found ${files.length} files in your ImageKit account.`);

    // Try to upload a test image
    console.log("\nTesting image upload:");
    const testDir = path.join(__dirname, "..", "public");
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    const testImagePath = path.join(testDir, "test-image.jpg");

    // Download a placeholder image if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      console.log("Downloading a test image...");
      await downloadImage("https://via.placeholder.com/150", testImagePath);
    }

    console.log(`Attempting to upload: ${testImagePath}`);

    // Read file data
    const fileData = fs.readFileSync(testImagePath);

    const uploadResult = await imagekit.upload({
      file: fileData,
      fileName: `test-${Date.now()}.jpg`,
      folder: "/lawsphere/test",
    });

    console.log("✅ Upload successful!");
    console.log("Image URL:", uploadResult.url);
    console.log("File ID:", uploadResult.fileId);
    console.log("\nYour ImageKit configuration is working correctly.");

    // Test getting URL with transformations
    const transformedUrl = imagekit.url({
      src: uploadResult.url,
      transformation: [
        {
          height: 200,
          width: 200,
          crop: "at_max",
        },
      ],
    });

    console.log("\nTransformed URL example:", transformedUrl);
  } catch (error) {
    console.error("❌ ImageKit test failed:", error);
    console.error("\nPlease check your ImageKit credentials in the .env file:");
    console.error(`IMAGEKIT_URL_ENDPOINT=${process.env.IMAGEKIT_URL_ENDPOINT}`);
    console.error(`IMAGEKIT_PUBLIC_KEY=${process.env.IMAGEKIT_PUBLIC_KEY}`);
    console.error(
      `IMAGEKIT_PRIVATE_KEY=${
        process.env.IMAGEKIT_PRIVATE_KEY ? "****" : "not set"
      }`
    );
    console.error(
      "\nMake sure to sign up at https://imagekit.io/ and use your account credentials."
    );
  }
}

// Run the test
testImageKitConnection();
