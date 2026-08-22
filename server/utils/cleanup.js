const fs = require('fs');
const path = require('path');

/**
 * Delete files older than `maxAgeMinutes` from the given directory.
 */
const cleanupOldFiles = (directory, maxAgeMinutes = 60) => {
  if (!fs.existsSync(directory)) return;

  const now = Date.now();
  const maxAge = maxAgeMinutes * 60 * 1000;

  fs.readdir(directory, (err, files) => {
    if (err) return console.error('Cleanup error:', err);

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) return;
        if (now - stats.mtimeMs > maxAge) {
          fs.unlink(filePath, (unlinkErr) => {
            if (!unlinkErr) {
              console.log(`🗑️  Cleaned up: ${file}`);
            }
          });
        }
      });
    });
  });
};

/**
 * Delete a list of specific file paths.
 */
const deleteFiles = (filePaths = []) => {
  filePaths.forEach((filePath) => {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn(`Could not delete: ${filePath}`);
      }
    }
  });
};

module.exports = { cleanupOldFiles, deleteFiles };
