const { getDb, saveDatabase } = require('../config/db');

function insertDocument(id, applicantId, docType, fileName, storedPath, fileSize, mimeType) {
  const db = getDb();
  db.run(
    `INSERT INTO documents (id, applicant_id, document_type, file_name, stored_path, file_size, mime_type, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [id, applicantId, docType, fileName, storedPath, fileSize, mimeType]
  );
  saveDatabase();
}

function findDocuments(applicantId) {
  const db = getDb();
  let query = 'SELECT * FROM documents';
  const params = [];

  if (applicantId) {
    query += ' WHERE applicant_id = ?';
    params.push(applicantId);
  }

  query += ' ORDER BY uploaded_at DESC';
  return queryAll(db, query, params);
}

function findDocumentById(id) {
  const db = getDb();
  const results = queryAll(db, 'SELECT * FROM documents WHERE id = ?', [id]);
  return results.length ? results[0] : null;
}

function deleteDocumentById(id) {
  const db = getDb();
  db.run('DELETE FROM documents WHERE id = ?', [id]);
  saveDatabase();
}

function updateDocumentStatus(id, status) {
  const db = getDb();
  db.run('UPDATE documents SET status = ? WHERE id = ?', [status, id]);
  saveDatabase();
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

module.exports = {
  insertDocument,
  findDocuments,
  findDocumentById,
  deleteDocumentById,
  updateDocumentStatus,
};
