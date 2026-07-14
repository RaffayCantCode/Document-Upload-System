const multer = require('multer');
const path = require('path');
const config = require('../config/index');

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg'];

  if (!allowedExts.includes(ext)) {
    return cb(new Error(`Invalid file extension "${ext}". Allowed: PDF, PNG, JPG`), false);
  }
  if (!config.allowedMimeTypes[file.mimetype]) {
    return cb(new Error(`Invalid file type "${file.mimetype}". Allowed: PDF, PNG, JPEG`), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: config.maxFileSizeBytes },
});

module.exports = upload;
