/**
 * Document Upload System — Backend Module
 *
 * Usage:
 *
 *   const docUpload = require('./backend');
 *   await docUpload.initDatabase();
 *   app.use('/api/documents', docUpload.createModule());
 *   app.use(docUpload.errorHandler);
 *
 * With custom database adapter:
 *
 *   const myRepo = {
 *     insertDocument: (id, applicantId, docType, fileName, fileData, fileSize, mimeType) => { ... },
 *     findDocuments: (applicantId) => { ... },
 *     findDocumentById: (id) => { ... },
 *     findDocumentFileById: (id) => { ... },
 *     deleteDocumentById: (id) => { ... },
 *     updateDocumentStatus: (id, status) => { ... },
 *   };
 *   app.use('/api/documents', docUpload.createModule({ repository: myRepo }));
 */

const express = require('express');
const cors = require('cors');
const config = require('./config/index');
const { initDatabase, closeDatabase } = require('./config/db');
const { createSqliteRepository } = require('./db/documentRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentController } = require('./controllers/documentController');
const { createDocumentRoutes } = require('./routes/documents');
const errorHandler = require('./middleware/errorHandler');

function createModule(options = {}) {
  const repo = options.repository || createSqliteRepository();
  const service = createDocumentService(repo);
  const controller = createDocumentController(service);
  const router = express.Router();

  const corsOptions = {
    origin: options.corsOrigins || config.corsOrigins,
    methods: options.corsMethods || ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: options.corsHeaders || ['Content-Type'],
  };

  router.use(cors(corsOptions));
  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));

  router.use('/', createDocumentRoutes(controller));

  return router;
}

module.exports = {
  createModule,
  errorHandler,
  config,
  initDatabase,
  closeDatabase,
};
