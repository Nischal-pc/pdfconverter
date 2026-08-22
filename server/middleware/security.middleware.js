const rateLimit = require('express-rate-limit');

// 1. Auth Rate Limiter — 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Global Document Processing Limiter — 150 operations per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 150,
  message: {
    error: 'High request volume detected. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 3. Cross-Platform Magic Byte & File Signature Inspector
 * Validates binary file headers across iOS (Safari/Chrome), macOS, Android, and Windows.
 */
const MAGIC_SIGNATURES = {
  // ISO 32000-1 allows %PDF to appear anywhere within the first 1024 bytes (handles Mac/iOS BOM & comments)
  pdf: (buf) => {
    if (buf.length < 4) return false;
    const header = buf.slice(0, Math.min(buf.length, 1024)).toString('binary');
    return header.includes('%PDF');
  },
  png: (buf) => buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47,
  jpg: (buf) => buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF,
  webp: (buf) => buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP',
  zip: (buf) => buf.length >= 4 && (
    (buf[0] === 0x50 && buf[1] === 0x4B) || // PK zip (.docx, .xlsx, .pptx)
    (buf[0] === 0xD0 && buf[1] === 0xCF && buf[2] === 0x11 && buf[3] === 0xE0) // OLE Compound Document (.doc, .xls, .ppt)
  ),
  gif: (buf) => buf.length >= 3 && buf.toString('ascii', 0, 3) === 'GIF',
};

const validateFileSignatures = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files || files.length === 0) return next();

  for (const file of files) {
    if (!file.buffer || file.buffer.length < 4) continue;

    const ext = (file.originalname || '').split('.').pop().toLowerCase();

    // Plain text formats (no binary signature required)
    if (['txt', 'md', 'markdown', 'csv', 'html', 'json'].includes(ext)) {
      continue;
    }

    // Check specific known binary formats
    if (ext === 'pdf' && !MAGIC_SIGNATURES.pdf(file.buffer)) {
      return res.status(400).json({ error: `Invalid file format: '${file.originalname}' does not appear to be a valid PDF document.` });
    }
    if ((ext === 'jpg' || ext === 'jpeg') && !MAGIC_SIGNATURES.jpg(file.buffer)) {
      return res.status(400).json({ error: `Invalid file format: '${file.originalname}' does not appear to be a valid JPEG image.` });
    }
    if (ext === 'png' && !MAGIC_SIGNATURES.png(file.buffer)) {
      return res.status(400).json({ error: `Invalid file format: '${file.originalname}' does not appear to be a valid PNG image.` });
    }
    if (ext === 'webp' && !MAGIC_SIGNATURES.webp(file.buffer)) {
      return res.status(400).json({ error: `Invalid file format: '${file.originalname}' does not appear to be a valid WebP image.` });
    }
    if (['docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt'].includes(ext) && !MAGIC_SIGNATURES.zip(file.buffer)) {
      return res.status(400).json({ error: `Invalid file format: '${file.originalname}' does not appear to be a valid Office document.` });
    }
  }

  next();
};

module.exports = {
  authLimiter,
  apiLimiter,
  validateFileSignatures,
};
