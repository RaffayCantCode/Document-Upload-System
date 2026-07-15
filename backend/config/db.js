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
      status        TEXT NOT NULL DEFAULT 'pending',
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),

      transcript_file_name    TEXT,
      transcript_file_data    BLOB,
      transcript_file_size    INTEGER,
      transcript_mime_type    TEXT,
      transcript_uploaded_at  TEXT,

      cnic_file_name    TEXT,
      cnic_file_data    BLOB,
      cnic_file_size    INTEGER,
      cnic_mime_type    TEXT,
      cnic_uploaded_at  TEXT,

      photo_file_name    TEXT,
      photo_file_data    BLOB,
      photo_file_size    INTEGER,
      photo_mime_type    TEXT,
      photo_uploaded_at  TEXT
    )
  `);

  try {
    db.run("ALTER TABLE applicants ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'");
  } catch (e) {}
  for (const col of ['photo_file_name', 'photo_file_data', 'photo_file_size', 'photo_mime_type', 'photo_uploaded_at']) {
    try { db.run('ALTER TABLE applicants ADD COLUMN ' + col + ' TEXT'); } catch (e) {}
  }
  try {
    db.run("DROP TABLE IF EXISTS photos");
  } catch (e) {}
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
