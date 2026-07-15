/**
 * Document Repository — Database adapter
 *
 * Default implementation uses SQLite via sql.js.
 * Swap this out by passing your own adapter to createModule():
 *
 *   const myRepo = {
 *     upsertDocument: (id, applicantId, fullName, docType, fileName, fileData, fileSize, mimeType) => { ... },
 *     findDocuments: (applicantId) => { ... },
 *     findDocumentById: (id) => { ... },
 *     findDocumentFileById: (id) => { ... },
 *     deleteDocumentById: (id) => { ... },
 *     updateDocumentStatus: (id, status) => { ... },
 *   };
 *   app.use('/api/documents', documentUpload.createModule({ repository: myRepo }));
 */

const { getDb, saveDatabase } = require('../config/db');

function createSqliteRepository() {
  return {
    upsertDocument(id, applicantId, fullName, docType, fileName, fileData, fileSize, mimeType) {
      const db = getDb();
      const existing = queryAll(db, 'SELECT id FROM documents WHERE applicant_id = ? AND document_type = ?', [applicantId, docType]);
      if (existing.length) {
        const existingId = existing[0].id;
        db.run(
          `UPDATE documents SET file_name = ?, file_data = ?, file_size = ?, mime_type = ?, full_name = ?, uploaded_at = datetime('now'), status = 'pending' WHERE id = ?`,
          [fileName, fileData, fileSize, mimeType, fullName, existingId]
        );
        saveDatabase();
        return existingId;
      } else {
        db.run(
          `INSERT INTO documents (id, applicant_id, full_name, document_type, file_name, file_data, file_size, mime_type, uploaded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [id, applicantId, fullName, docType, fileName, fileData, fileSize, mimeType]
        );
        saveDatabase();
        return id;
      }
    },

    findDocuments(applicantId) {
      const db = getDb();
      let sql = 'SELECT id, applicant_id, full_name, document_type, file_name, file_size, mime_type, uploaded_at, status FROM documents';
      const params = [];
      if (applicantId) {
        sql += ' WHERE applicant_id = ?';
        params.push(applicantId);
      }
      sql += ' ORDER BY uploaded_at DESC';
      return queryAll(db, sql, params);
    },

    findDocumentById(id) {
      const db = getDb();
      const rows = queryAll(db, 'SELECT id, applicant_id, full_name, document_type, file_name, file_size, mime_type, uploaded_at, status FROM documents WHERE id = ?', [id]);
      return rows.length ? rows[0] : null;
    },

    findDocumentFileById(id) {
      const db = getDb();
      const stmt = db.prepare('SELECT id, file_name, mime_type, file_data FROM documents WHERE id = ?');
      stmt.bind([id]);
      let row = null;
      if (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        row = {};
        cols.forEach((c, i) => { row[c] = vals[i]; });
      }
      stmt.free();
      return row;
    },

    deleteDocumentById(id) {
      const db = getDb();
      db.run('DELETE FROM documents WHERE id = ?', [id]);
      saveDatabase();
    },

    updateDocumentStatus(id, status) {
      const db = getDb();
      db.run('UPDATE documents SET status = ? WHERE id = ?', [status, id]);
      saveDatabase();
    },
  };
}

function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

module.exports = { createSqliteRepository };
