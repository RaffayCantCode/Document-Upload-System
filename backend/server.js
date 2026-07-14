/**
 * Standalone server — starts the document upload module on its own.
 * For production, mount the module into your main Express app instead.
 */
const express = require('express');
const { createModule, errorHandler, initDatabase, config } = require('./index');

async function start() {
  await initDatabase();

  const app = express();
  app.use('/api/documents', createModule());
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`Document Upload System running on http://localhost:${config.port}`);
    console.log(`API base: http://localhost:${config.port}/api/documents`);
    console.log(`Uploads dir: ${config.uploadDir}`);
  });
}

start();
