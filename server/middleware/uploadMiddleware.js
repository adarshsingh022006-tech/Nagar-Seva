// middleware/uploadMiddleware.js
// Handles photo & voice audio note uploads.
// Files are saved to server/uploads and served statically at /uploads/<filename>.

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || (file.mimetype.includes("audio") ? ".webm" : ".jpg");
    cb(null, `${unique}${ext}`);
  },
});

const allowedTypes = /jpeg|jpg|png|webp|gif|webm|mp3|wav|ogg|m4a|aac|octet-stream/;
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const extOk = ext ? allowedTypes.test(ext) : true;
  const mimeOk = file.mimetype.startsWith("image/") || file.mimetype.startsWith("audio/") || allowedTypes.test(file.mimetype);
  if (extOk || mimeOk) return cb(null, true);
  cb(new Error("Only image files (jpg, png, webp) and audio recordings (webm, mp3, wav, m4a) are allowed"));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// Middleware for complaint filing (photo + optional voice note)
const complaintUpload = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "audio", maxCount: 1 },
]);

module.exports = {
  upload,
  complaintUpload,
};

