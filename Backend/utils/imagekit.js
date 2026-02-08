import ImageKit from "imagekit";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isImageKitConfigured =
  process.env.IMAGEKIT_PUBLIC_KEY &&
  process.env.IMAGEKIT_PRIVATE_KEY &&
  process.env.IMAGEKIT_URL_ENDPOINT;

const useLocalStorage =
  process.env.USE_LOCAL_STORAGE === "true" || !isImageKitConfigured;

const isVercel = process.env.VERCEL === "1";

// On Vercel, use /tmp (only writable dir); otherwise use project-relative paths
const uploadsDir = isVercel
  ? path.join("/tmp", "legalconnect-uploads")
  : path.join(__dirname, "..", "uploads");
const tempDir = path.join(uploadsDir, "temp");
const profileUploadsDir = path.join(uploadsDir, "profiles");

function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    // On serverless (e.g. Vercel), project filesystem is read-only; only /tmp is writable.
    // Don't throw at module load or we get FUNCTION_INVOCATION_FAILED.
    if (!isVercel) throw err;
  }
}

// Create dirs at load time. On Vercel we use /tmp (writable); elsewhere use project path.
ensureDir(uploadsDir);
ensureDir(tempDir);
ensureDir(profileUploadsDir);

let imagekit = null;
if (isImageKitConfigured && !useLocalStorage) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, useLocalStorage ? profileUploadsDir : tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "upload-" + uniqueSuffix + ext);
  },
});

export const uploadProfile = multer({
  storage,
  limits: { fileSize: 2_000_000 }, // 2MB
}).single("profileImage");

export const processUpload = async (req, res, next) => {
  if (!req.file) return next();

  try {
    if (useLocalStorage) {
      // Normalize path for windows and expose URL
      const normalizedPath = req.file.path.replace(/\\/g, "/");
      const uploadsIndex = normalizedPath.indexOf("/uploads");
      const relativePath =
        uploadsIndex >= 0
          ? normalizedPath.substring(uploadsIndex)
          : `/uploads/profiles/${path.basename(normalizedPath)}`;

      const baseUrl =
        process.env.NODE_ENV === "production"
          ? "https://legalconnect.org"
          : `http://localhost:${process.env.PORT || 5000}`;

      req.file.secure_url = `${baseUrl}${relativePath}`;
      req.file.path = relativePath;
      return next();
    }

    if (!imagekit) throw new Error("ImageKit is not initialized");
    const fileData = fs.readFileSync(req.file.path);

    const uploadResult = await imagekit.upload({
      file: fileData,
      fileName: req.file.filename,
      folder: "/legalconnect/profiles",
      useUniqueFileName: true,
    });

    // remove temp file
    try {
      fs.unlinkSync(req.file.path);
    } catch (_) {
      // ignore
    }

    req.file.secure_url = uploadResult.url;
    req.file.path = uploadResult.url;
    req.file.fileId = uploadResult.fileId;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error processing uploaded file: " + error.message,
    });
  }
};

// Used by some controllers (even if not currently called)
export const uploadToImageKit = async (filePath, options = {}) => {
  if (!imagekit) {
    throw new Error(
      "ImageKit is not configured (set USE_LOCAL_STORAGE=false and ImageKit keys).",
    );
  }
  const fileData = fs.readFileSync(filePath);
  const fileName = options.fileName || path.basename(filePath);
  return await imagekit.upload({
    file: fileData,
    fileName,
    folder: options.folder || "/legalconnect/uploads",
  });
};

// Upload file from buffer (for FormData/multipart file uploads)
export const uploadFile = async (fileBuffer, fileName, fileType = "pdf") => {
  if (useLocalStorage) {
    // For local storage, save to temp directory
    const tempPath = path.join(tempDir, fileName);
    fs.writeFileSync(tempPath, fileBuffer);
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://legalconnect.org"
        : `http://localhost:${process.env.PORT || 5000}`;
    return {
      url: `${baseUrl}/uploads/temp/${path.basename(tempPath)}`,
      fileId: null,
    };
  }

  if (!imagekit) {
    throw new Error(
      "ImageKit is not configured. Please set ImageKit credentials or enable USE_LOCAL_STORAGE.",
    );
  }

  try {
    const uploadResult = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: "/legalconnect/resources",
      useUniqueFileName: true,
    });

    return {
      url: uploadResult.url,
      fileId: uploadResult.fileId,
    };
  } catch (error) {
    throw new Error(`Failed to upload file to ImageKit: ${error.message}`);
  }
};

// Delete file from ImageKit or local storage
export const deleteFile = async (fileUrl) => {
  if (!fileUrl) return; // No file to delete

  try {
    // Handle local files
    if (fileUrl.includes("localhost") || fileUrl.includes("/uploads/")) {
      const filePath = fileUrl.split("/uploads/")[1];
      if (filePath) {
        const localPath = path.join(uploadsDir, filePath);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
      return;
    }

    // Handle ImageKit files
    if (fileUrl.includes("imagekit.io")) {
      if (!imagekit) {
        console.warn(
          "ImageKit not configured, cannot delete remote file:",
          fileUrl,
        );
        return;
      }

      // Extract file path from ImageKit URL
      // URL format: https://ik.imagekit.io/[urlEndpoint]/[filePath]
      const urlParts = fileUrl.split("imagekit.io/");
      if (urlParts.length > 1) {
        const filePathWithParams = urlParts[1];
        // Remove query parameters if any
        const filePath = filePathWithParams.split("?")[0];

        try {
          await imagekit.deleteFile(filePath);
        } catch (error) {
          console.warn("Failed to delete ImageKit file:", error.message);
          // Don't throw, just log warning
        }
      }
    }
  } catch (error) {
    console.error("Error deleting file:", error.message);
    // Don't throw, just log the error
  }
};

export default imagekit;
