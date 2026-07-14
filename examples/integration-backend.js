/**
 * Example: Mount the Document Upload module into an existing Express app.
 *
 *   const express = require('express');
 *   const app = express();
 *
 *   // --- Your existing routes here ---
 *   app.get('/', (req, res) => res.send('My main app'));
 *
 *   // --- Mount document upload at /api/documents ---
 *   const documentUpload = require('../backend');
 *   app.use('/api/documents', documentUpload.createModule());
 *   app.use(documentUpload.errorHandler);
 *
 *   // Init DB and start
 *   documentUpload.initDatabase().then(() => {
 *     app.listen(3000, () => console.log('App running on port 3000'));
 *   });
 */

const express = require('express');
const documentUpload = require('../backend');

async function main() {
  await documentUpload.initDatabase();

  const app = express();

  // Existing routes
  app.get('/', (req, res) => {
    res.json({ message: 'Main application — Document Upload System is mounted at /api/documents' });
  });

  // Mount the document upload module
  app.use('/api/documents', documentUpload.createModule());
  app.use(documentUpload.errorHandler);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Main app running on http://localhost:${PORT}`);
    console.log(`Document upload API: http://localhost:${PORT}/api/documents`);
  });
}

main();
