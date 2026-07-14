const express = require('express');
const { createModule, errorHandler, initDatabase, config } = require('./index');

async function start() {
  await initDatabase();

  const app = express();

  app.get('/', (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Document Upload System — Backend</title>
<style>
body { font-family: system-ui, sans-serif; background: #0f0c29; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 40px; max-width: 520px; text-align: center; }
h1 { font-size: 1.5rem; background: linear-gradient(135deg,#818cf8,#c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0 0 6px; }
.status { color: #86efac; font-size: 0.9rem; margin-bottom: 20px; }
p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin: 0 0 20px; }
a { display: inline-block; padding: 10px 24px; background: linear-gradient(135deg,#818cf8,#6366f1); color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
a:hover { box-shadow: 0 8px 25px rgba(99,102,241,0.35); }
.env { margin-top: 20px; font-size: 0.8rem; color: #64748b; }
.env span { display: inline-block; margin: 2px 6px; padding: 2px 8px; background: rgba(255,255,255,0.05); border-radius: 4px; }
</style>
</head>
<body>
<div class="card">
  <h1>Document Upload System</h1>
  <div class="status">&#10003; Backend is running</div>
  <p>The API server is active. Files are stored as BLOBs in the database.<br>Go to the frontend to upload and manage documents.</p>
  <a href="http://localhost:3000">Open Frontend (localhost:3000)</a>
  <div class="env">
    <span>Port: ${config.port}</span>
    <span>Max upload: ${config.maxFileSizeMB}MB</span>
    <span>Database: ${config.dbType === 'postgres' ? 'PostgreSQL' : 'SQLite'}</span>
  </div>
</div>
</body>
</html>`;
    res.type('html').send(html);
  });

  app.use('/api/documents', createModule());
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`Backend running at http://localhost:${config.port}`);
    console.log(`Frontend should be started separately at http://localhost:3000`);
    console.log(`API endpoints available at http://localhost:${config.port}/api/documents`);
  });
}

start();
