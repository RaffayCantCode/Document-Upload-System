const path = require('path');
const fs = require('fs');

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  uploadDir: path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads'),
  dbPath: path.resolve(__dirname, '..', process.env.DB_PATH || 'database.sqlite'),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10,
  allowedMimeTypes: {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
  },
  allowedDocTypes: ['transcript', 'cnic', 'photo'],
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : ['*'],
};

Object.defineProperty(config, 'maxFileSizeBytes', {
  get() {
    return this.maxFileSizeMB * 1024 * 1024;
  },
});

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

module.exports = config;
