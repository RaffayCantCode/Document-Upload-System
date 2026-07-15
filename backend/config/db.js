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
    CREATE TABLE IF NOT EXISTS applicants (
      applicant_id  TEXT PRIMARY KEY,
      full_name     TEXT NOT NULL DEFAULT '',
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),

      transcript_file_name    TEXT,
      transcript_file_data    BLOB,
      transcript_file_size    INTEGER,
      transcript_mime_type    TEXT,
      transcript_uploaded_at  TEXT,
      transcript_status       TEXT NOT NULL DEFAULT 'pending',

      cnic_file_name    TEXT,
      cnic_file_data    BLOB,
      cnic_file_size    INTEGER,
      cnic_mime_type    TEXT,
      cnic_uploaded_at  TEXT,
      cnic_status       TEXT NOT NULL DEFAULT 'pending'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS photos (
      id            TEXT PRIMARY KEY,
      applicant_id  TEXT NOT NULL,
      file_name     TEXT NOT NULL,
      file_data     BLOB,
      file_size     INTEGER NOT NULL,
      mime_type     TEXT NOT NULL,
      uploaded_at   TEXT NOT NULL DEFAULT (datetime('now')),
      status        TEXT NOT NULL DEFAULT 'pending'
    )
  `);

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
