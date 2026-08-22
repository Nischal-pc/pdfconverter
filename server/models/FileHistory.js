const mongoose = require('mongoose');

const fileHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow anonymous usage
  },
  sessionId: {
    type: String, // For anonymous users
  },
  toolId: {
    type: String,
  },
  toolLabel: {
    type: String,
  },
  toolName: {
    type: String,
    required: true,
  },
  downloadUrl: {
    type: String,
  },
  toolCategory: {
    type: String,
  },
  originalName: {
    type: String,
  },
  outputFileName: {
    type: String,
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
  },
  errorMessage: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Auto-delete after 24 hours
  },
});

module.exports = mongoose.model('FileHistory', fileHistorySchema);
