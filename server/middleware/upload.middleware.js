const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use memory storage — works in Vercel serverless and all environments
const storage = multer.memoryStorage();

// Accept all files unconditionally — security is enforced by validateFileSignatures
// which inspects actual binary magic bytes (not MIME strings that iOS/Android fabricate).
// iOS Safari sends PDFs as 'application/octet-stream'; Android Chrome does the same for docx.
const fileFilter = (req, file, cb) => {
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
    files: 25, // max 25 files per request
  },
});

module.exports = upload;
