const path = require('path');

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  dbPath: path.resolve(__dirname, '..', process.env.DB_PATH || 'database.sqlite'),
  dbType: process.env.DB_TYPE || 'sqlite',
  pgConnectionString: process.env.PG_CONNECTION_STRING || 'postgresql://user:password@localhost:5432/document_upload',
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 1,
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

module.exports = config;
