const express = require('express');
const { createModule, errorHandler, initDatabase, config } = require('./index');

async function start() {
  await initDatabase();

  const app = express();

  app.get('/', (req, res) => {
    res.json({
      service: 'Document Upload System',
      status: 'running',
      storage: 'Files stored in database (BLOB) — no disk storage needed',
      endpoints: {
        upload: { method: 'POST', path: '/api/documents/upload', description: 'Upload a file (multipart: file, applicant_id, document_type)' },
        list: { method: 'GET', path: '/api/documents?applicant_id=', description: 'List documents for an applicant' },
        get: { method: 'GET', path: '/api/documents/:id', description: 'Get document metadata' },
        download: { method: 'GET', path: '/api/documents/:id/download', description: 'Download the actual file' },
        delete: { method: 'DELETE', path: '/api/documents/:id', description: 'Delete a document' },
        updateStatus: { method: 'PATCH', path: '/api/documents/:id/status', description: 'Update document status' },
      },
      config: {
        maxFileSizeMB: config.maxFileSizeMB,
        allowedTypes: Object.keys(config.allowedMimeTypes),
      },
    });
  });

  app.use('/api/documents', createModule());
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

start();
