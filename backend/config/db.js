const initSqlJs = require('sql.js');
const fs = require('fs');
const config = require('./index');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(config.dbPath)) {
    const buffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id            TEXT PRIMARY KEY,
      applicant_id  TEXT NOT NULL,
      full_name     TEXT NOT NULL DEFAULT '',
      document_type TEXT NOT NULL CHECK(document_type IN ('transcript','cnic','photo')),
      file_name     TEXT NOT NULL,
      file_data     BLOB,
      file_size     INTEGER NOT NULL,
      mime_type     TEXT NOT NULL,
      uploaded_at   TEXT NOT NULL DEFAULT (datetime('now')),
      status        TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected'))
    )
  `);

  try { db.run('ALTER TABLE documents ADD COLUMN full_name TEXT NOT NULL DEFAULT \'\''); } catch (e) {}
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_docs_applicant_type ON documents(applicant_id, document_type)');

  saveDatabase();
  return db;
}

function saveDatabase() {
  const data = db.export();
  fs.writeFileSync(config.dbPath, Buffer.from(data));
}

function getDb() {
  return db;
}

function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
  }
}

module.exports = { initDatabase, saveDatabase, getDb, closeDatabase };
