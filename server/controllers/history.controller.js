const FileHistory = require('../models/FileHistory');

const toClientItem = (doc) => ({
  id: doc._id.toString(),
  toolId: doc.toolId || doc.toolName,
  toolLabel: doc.toolLabel || doc.toolName,
  inputFiles: doc.originalName || '',
  outputFile: doc.outputFileName || '',
  downloadUrl: doc.downloadUrl || '',
  createdAt: doc.createdAt,
  status: doc.status,
});

// GET /api/history
exports.getHistory = async (req, res) => {
  try {
    const history = await FileHistory.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, history: history.map(toClientItem) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/history
exports.addHistory = async (req, res) => {
  try {
    const { toolId, toolLabel, inputFiles, outputFile, downloadUrl } = req.body;
    if (!toolId && !toolLabel) {
      return res.status(400).json({ error: 'toolId or toolLabel is required.' });
    }

    const item = await FileHistory.create({
      userId: req.user._id,
      toolId: toolId || toolLabel,
      toolLabel: toolLabel || toolId,
      toolName: toolLabel || toolId,
      originalName: inputFiles || '',
      outputFileName: outputFile || '',
      downloadUrl: downloadUrl || '',
      status: 'completed',
    });

    res.status(201).json({ success: true, item: toClientItem(item) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/history/:id
exports.deleteHistory = async (req, res) => {
  try {
    const item = await FileHistory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) {
      return res.status(404).json({ error: 'History item not found or not authorized.' });
    }
    res.json({ success: true, message: 'History item deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/history
exports.clearHistory = async (req, res) => {
  try {
    await FileHistory.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: 'All history cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
