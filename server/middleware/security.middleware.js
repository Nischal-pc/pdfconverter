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
 * 3. Magic Byte & File Signature Inspector
 * Validates actual binary file headers instead of trusting user-supplied extensions.
 */
const MAGIC_SIGNATURES = {
  pdf: (buf) => buf.length >= 4 && buf.toString('ascii', 0, 4) === '%PDF',
  png: (buf) => buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47,
  jpg: (buf) => buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF,
  webp: (buf) => buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP',
  zip: (buf) => buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4B, // Also covers .docx, .xlsx, .pptx
  gif: (buf) => buf.length >= 3 && buf.toString('ascii', 0, 3) === 'GIF',
};

const validateFileSignatures = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files || files.length === 0) return next();

  for (const file of files) {
    if (!file.buffer || file.buffer.length < 4) continue;

    const ext = (file.originalname || '').split('.').pop().toLowerCase();

    // Check specific known formats
    if (ext === 'pdf' && !MAGIC_SIGNATURES.pdf(file.buffer)) {
      return res.status(400).json({ error: `Security check failed: '${file.originalname}' is not a valid PDF binary file.` });
    }
    if ((ext === 'jpg' || ext === 'jpeg') && !MAGIC_SIGNATURES.jpg(file.buffer)) {
      return res.status(400).json({ error: `Security check failed: '${file.originalname}' is not a valid JPEG image.` });
    }
    if (ext === 'png' && !MAGIC_SIGNATURES.png(file.buffer)) {
      return res.status(400).json({ error: `Security check failed: '${file.originalname}' is not a valid PNG image.` });
    }
    if (ext === 'webp' && !MAGIC_SIGNATURES.webp(file.buffer)) {
      return res.status(400).json({ error: `Security check failed: '${file.originalname}' is not a valid WebP image.` });
    }
    if (['docx', 'xlsx', 'pptx'].includes(ext) && !MAGIC_SIGNATURES.zip(file.buffer)) {
      return res.status(400).json({ error: `Security check failed: '${file.originalname}' is not a valid Office XML document.` });
    }
  }

  next();
};

module.exports = {
  authLimiter,
  apiLimiter,
  validateFileSignatures,
};
