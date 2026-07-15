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
 *   const myRepo = docUpload.createMyRepository();    // template stubs
 *   // or   const myRepo = require('./db/postgresRepository');
 *   app.use('/api/documents', docUpload.createModule({ repository: myRepo }));
 *
 * Auto-select database by setting DB_TYPE in .env:
 *   DB_TYPE=sqlite     (default)
 *   DB_TYPE=postgres
 */

const express = require('express');
const cors = require('cors');
const config = require('./config/index');
const { initDatabase, closeDatabase } = require('./config/db');
const { createSqliteRepository } = require('./db/documentRepository');
const { createPostgresRepository } = require('./db/postgresRepository');
const { createMyRepository } = require('./db/templateRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentController } = require('./controllers/documentController');
const { createDocumentRoutes } = require('./routes/documents');
const errorHandler = require('./middleware/errorHandler');

function getDefaultRepository() {
  if (config.dbType === 'postgres') {
    return createPostgresRepository(config.pgConnectionString);
  }
  return createSqliteRepository();
}

function createModule(options = {}) {
  const repo = options.repository || getDefaultRepository();
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
  initDatabase: async () => {
    if (config.dbType === 'postgres') {
      const repo = createPostgresRepository(config.pgConnectionString);
      if (repo.ensureTable) {
        await repo.ensureTable();
      }
    }
    await initDatabase();
  },
  closeDatabase,
  createSqliteRepository,
  createPostgresRepository,
  createMyRepository,
};
