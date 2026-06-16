import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG images are allowed"), false);
  }
};

function sanitizeFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
}

// S3 storage — used when AWS_BUCKET_NAME is configured (staging + production).
// Falls back to local disk for local development.
function buildStorage() {
  const bucket = process.env.AWS_BUCKET_NAME;

  if (bucket) {
    const s3 = new S3Client({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: process.env.AWS_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined, // falls back to IAM role if running on EC2/ECS
    });

    return multerS3({
      s3,
      bucket,
      key: (req, file, cb) => {
        const folder = process.env.S3_UPLOAD_PREFIX || "ecg-uploads";
        cb(null, `${folder}/${sanitizeFilename(file.originalname)}`);
      },
      contentType: multerS3.AUTO_CONTENT_TYPE,
    });
  }

  // Local disk fallback — Vercel /tmp is writable but ephemeral;
  // only acceptable for local dev. Set AWS_BUCKET_NAME for production.
  const uploadDir =
    process.env.NODE_ENV === "production"
      ? "/tmp/ecg-uploads"
      : path.join(__dirname, "../../uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, sanitizeFilename(file.originalname)),
  });
}

const upload = multer({
  storage: buildStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export default upload;
