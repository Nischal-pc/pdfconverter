require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { cleanupOldFiles } = require('./utils/cleanup');

const authRoutes = require('./routes/auth.routes');
const pdfRoutes = require('./routes/pdf.routes');
const convertRoutes = require('./routes/convert.routes');
const aiRoutes = require('./routes/ai.routes');
const historyRoutes = require('./routes/history.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];
    if (allowed.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(null, process.env.CLIENT_URL || 'http://localhost:3000');
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

const MIME_MAP = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.zip': 'application/zip',
};

// Direct Force Download route (pure binary stream with exact byte length)
app.get('/api/download/:filename', (req, res) => {
  const rawName = req.params.filename;
  const safeName = path.basename(rawName);
  const filePath = path.join(uploadsDir, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or has expired.' });
  }

  const stat = fs.statSync(filePath);
  const realExt = path.extname(safeName).toLowerCase() || '.pdf';
  let customName = (req.query.name || safeName).trim();

  // Ensure customName preserves the true extension of the underlying file
  if (!customName.toLowerCase().endsWith(realExt)) {
    customName = `${customName.replace(/\.[^/.]+$/, '')}${realExt}`;
  }

  // Sanitize filename for Windows filesystem (remove illegal chars: \ / : * ? " < > |)
  const safeWindowsName = customName.replace(/[\\/:*?"<>|]/g, '_');
  const contentType = MIME_MAP[realExt] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="${safeWindowsName}"`,
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length',
    'Cache-Control': 'no-cache',
  });

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Scheduled cleanup: delete files older than 1 hour
cron.schedule('0 * * * *', () => {
  cleanupOldFiles(uploadsDir, 60);
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connected to MongoDB');
    } else {
      console.log('⚠️  No MONGO_URI set. File history and auth disabled.');
    }
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 PDF Tools Server running on http://localhost:${PORT}`);
  });
};

startServer();
