import ImageKit from "imagekit";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Get dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check ImageKit configuration
const isImageKitConfigured =
  process.env.IMAGEKIT_PUBLIC_KEY &&
  process.env.IMAGEKIT_PRIVATE_KEY &&
  process.env.IMAGEKIT_URL_ENDPOINT;

// Check if we should use local storage
const useLocalStorage =
  process.env.USE_LOCAL_STORAGE === "true" || !isImageKitConfigured;

if (!isImageKitConfigured) {
  console.warn(
    "⚠️ ImageKit credentials not found. Falling back to local storage."
  );
}

// Create uploads directory if it doesn't exist (for local storage fallback)
const uploadsDir = path.join(__dirname, "..", "uploads");
const profileUploadsDir = path.join(uploadsDir, "profiles");
const resourceUploadsDir = path.join(uploadsDir, "resources");

if (useLocalStorage) {
  console.log("Using local file storage for uploads");

  // Ensure directories exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  if (!fs.existsSync(profileUploadsDir)) {
    fs.mkdirSync(profileUploadsDir);
  }
  if (!fs.existsSync(resourceUploadsDir)) {
    fs.mkdirSync(resourceUploadsDir);
  }
}

// Initialize ImageKit instance only if configured
let imagekit = null;
if (isImageKitConfigured && !useLocalStorage) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
}

// Storage configuration for profile images
let profileStorage;
let resourceStorage;

if (useLocalStorage) {
  // Configure local storage for profile images
  profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, profileUploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "profile-" + uniqueSuffix + ext);
    },
  });

  // Configure local storage for resources
  resourceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, resourceUploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "resource-" + uniqueSuffix + ext);
    },
  });
} else {
  // For ImageKit, we'll still use multer disk storage temporarily
  // and then upload to ImageKit after multer processes the file
  profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(uploadsDir, "temp"));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "profile-" + uniqueSuffix + ext);
    },
  });

  resourceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(uploadsDir, "temp"));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "resource-" + uniqueSuffix + ext);
    },
  });

  // Create temp directory if it doesn't exist
  const tempDir = path.join(uploadsDir, "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
}

// Create upload middleware with file validation
export const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 2000000 }, // 2MB max size
  fileFilter: (req, file, cb) => {
    // Validate file mimetype and extension
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          `Only .jpeg, .jpg and .png files are allowed! Got ${file.mimetype}`
        )
      );
    }
  },
}).single("profileImage");

// Process upload either to local storage or ImageKit
export const processUpload = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    if (useLocalStorage) {
      // Handle Windows path separators
      const normalizedPath = req.file.path.replace(/\\/g, "/");

      // Extract the relative path segment after 'uploads'
      const uploadsIndex = normalizedPath.indexOf("/uploads");
      let relativePath;

      if (uploadsIndex >= 0) {
        relativePath = normalizedPath.substring(uploadsIndex);
      } else {
        // If 'uploads' not found in path, extract filename and assume uploads/profiles directory
        const filename = normalizedPath.split("/").pop();
        relativePath = `/uploads/profiles/${filename}`;
      }

      const baseUrl =
        process.env.NODE_ENV === "production"
          ? "https://legalconnect.org"
          : `http://localhost:${process.env.PORT || 5000}`;

      // Update the file object with the web-accessible path
      req.file.originalPath = req.file.path; // Save original for reference
      req.file.path = relativePath;
      req.file.secure_url = `${baseUrl}${relativePath}`;
    } else {

      // Verify the file exists
      if (!fs.existsSync(req.file.path)) {
        throw new Error(`File not found at path: ${req.file.path}`);
      }

      // Read the file with error handling
      let fileData;
      try {
        fileData = fs.readFileSync(req.file.path);
      } catch (readError) {
        throw new Error(`Failed to read file: ${readError.message}`);
      }

      if (!imagekit) {
        throw new Error("ImageKit is not initialized");
      }
      const uploadResult = await imagekit.upload({
        file: fileData,
        fileName: req.file.filename,
        folder: "/legalconnect/profiles",
        useUniqueFileName: true,
        tags: ["profile", "lawyer"],
      });

      // Delete the local temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.warn(
          `Warning: Could not delete temporary file: ${unlinkError.message}`
        );
      }

      // Update req.file object with ImageKit URL
      req.file.originalPath = req.file.path;
      req.file.path = uploadResult.url;
      req.file.secure_url = uploadResult.url;
      req.file.fileId = uploadResult.fileId;
    }

    next();
  } catch (error) {
    console.error("Error processing upload:", error);
    // Clean up file if needed
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Error deleting temporary file:", e);
      }
    }
    return res.status(500).json({
      success: false,
      message: "Error processing uploaded file: " + error.message,
    });
  }
};

export const uploadResource = multer({
  storage: resourceStorage,
  limits: { fileSize: 10000000 }, // 10MB max size
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Allowed types: .jpeg, .jpg, .png, .pdf, .doc, .docx"
        )
      );
    }
  },
}).single("file");

// Utility to upload directly to ImageKit (without multer)
export const uploadToImageKit = async (filePath, options = {}) => {
  try {
    if (!isImageKitConfigured || !imagekit) {
      throw new Error("ImageKit is not configured");
    }

    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const defaultOptions = {
      folder: "/legalconnect/uploads",
    };

    const uploadOptions = {
      ...defaultOptions,
      ...options,
      file: fileData,
      fileName: options.fileName || fileName,
    };

    const result = await imagekit.upload(uploadOptions);
    return result;
  } catch (error) {
    console.error("Direct ImageKit upload error:", error);
    throw error;
  }
};

// Generate ImageKit URL with transformations
export const getImageUrl = (imagePath, transformations = []) => {
  if (!imagePath) return null;

  // If it's already an ImageKit URL or we're using local storage, return as is
  if (
    useLocalStorage ||
    !imagekit ||
    !imagePath.includes(process.env.IMAGEKIT_URL_ENDPOINT)
  ) {
    return imagePath;
  }

  return imagekit.url({
    src: imagePath,
    transformation: transformations,
  });
};

export default imagekit;
