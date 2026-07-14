/**
 * Document Upload System — Backend Module
 *
 * Usage (mount into any Express app):
 *
 *   const express = require('express');
 *   const app = express();
 *
 *   const documentUpload = require('./backend');
 *   app.use('/api/documents', documentUpload.router);
 *
 *   // Optionally apply CORS and error handling:
 *   app.use(documentUpload.errorHandler);
 *
 * Or run standalone:
 *   node backend/server.js
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/index');
const { initDatabase, closeDatabase } = require('./config/db');
const documentRouter = require('./routes/documents');
const errorHandler = require('./middleware/errorHandler');

function createModule(options = {}) {
  const router = express.Router();

  const corsOptions = {
    origin: options.corsOrigins || config.corsOrigins,
    methods: options.corsMethods || ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: options.corsHeaders || ['Content-Type'],
  };

  router.use(cors(corsOptions));
  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));

  const uploadsPath = options.uploadDir || config.uploadDir;
  router.use('/files', express.static(uploadsPath));

  router.use('/', documentRouter);

  return router;
}

module.exports = {
  createModule,
  router: createModule(),
  errorHandler,
  config,
  initDatabase,
  closeDatabase,
};
