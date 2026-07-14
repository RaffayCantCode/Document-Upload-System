const multer = require('multer');
const config = require('../config/index');

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `File too large. Max size: ${config.maxFileSizeMB}MB` });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.message && err.message.startsWith('Invalid file')) {
    return res.status(400).json({ error: err.message });
  }

  console.error('[UploadSystem] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
