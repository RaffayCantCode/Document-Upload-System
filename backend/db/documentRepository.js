const { getDb, saveDatabase } = require('../config/db');

function createSqliteRepository() {
  function setCol(prefix, applicantId, fullName, fileName, fileData, fileSize, mimeType) {
    const db = getDb();
    db.run(
      `INSERT INTO applicants (applicant_id, full_name, status, updated_at,
        ${prefix}_file_name, ${prefix}_file_data, ${prefix}_file_size, ${prefix}_mime_type, ${prefix}_uploaded_at)
       VALUES (?, ?, 'pending', datetime('now'), ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(applicant_id) DO UPDATE SET
        full_name = COALESCE(NULLIF(excluded.full_name, ''), full_name),
        status = 'pending',
        updated_at = datetime('now'),
        ${prefix}_file_name = excluded.${prefix}_file_name,
        ${prefix}_file_data = excluded.${prefix}_file_data,
        ${prefix}_file_size = excluded.${prefix}_file_size,
        ${prefix}_mime_type = excluded.${prefix}_mime_type,
        ${prefix}_uploaded_at = datetime('now')`,
      [applicantId, fullName, fileName, fileData, fileSize, mimeType]
    );
    saveDatabase();
    return prefix + ':' + applicantId;
  }

  return {
    upsertDocument(id, applicantId, fullName, docType, fileName, fileData, fileSize, mimeType) {
      return setCol(docType, applicantId, fullName, fileName, fileData, fileSize, mimeType);
    },

    findDocuments(applicantId) {
      const db = getDb();
      const docs = [];
      const app = queryOne(db, 'SELECT * FROM applicants WHERE applicant_id = ?', [applicantId]);
      if (app) {
        for (const t of ['transcript', 'cnic', 'photo']) {
          if (app[t + '_file_name']) {
            docs.push({
              id: t + ':' + app.applicant_id,
              applicant_id: app.applicant_id,
              full_name: app.full_name,
              document_type: t,
              file_name: app[t + '_file_name'],
              file_size: app[t + '_file_size'],
              mime_type: app[t + '_mime_type'],
              uploaded_at: app[t + '_uploaded_at'],
              status: app.status,
            });
          }
        }
      }
      return docs;
    },

    findDocumentById(id) {
      const db = getDb();
      if (id.startsWith('transcript:') || id.startsWith('cnic:') || id.startsWith('photo:')) {
        const parts = id.split(':');
        const t = parts[0];
        const appId = parts.slice(1).join(':');
        const app = queryOne(db, 'SELECT * FROM applicants WHERE applicant_id = ?', [appId]);
        if (!app || !app[t + '_file_name']) return null;
        return {
          id, applicant_id: app.applicant_id, full_name: app.full_name, document_type: t,
          file_name: app[t + '_file_name'], file_size: app[t + '_file_size'],
          mime_type: app[t + '_mime_type'], uploaded_at: app[t + '_uploaded_at'], status: app.status,
        };
      }
      return null;
    },

    findDocumentFileById(id) {
      const db = getDb();
      if (id.startsWith('transcript:') || id.startsWith('cnic:') || id.startsWith('photo:')) {
        const parts = id.split(':');
        const t = parts[0];
        const appId = parts.slice(1).join(':');
        const app = queryOne(db, 'SELECT ' + t + '_file_name as file_name, ' + t + '_mime_type as mime_type, ' + t + '_file_data as file_data FROM applicants WHERE applicant_id = ?', [appId]);
        if (!app || !app.file_data) return null;
        return app;
      }
      return null;
    },

    deleteDocumentById(id) {
      const db = getDb();
      if (id.startsWith('transcript:') || id.startsWith('cnic:') || id.startsWith('photo:')) {
        const parts = id.split(':');
        const t = parts[0];
        const appId = parts.slice(1).join(':');
        const fields = [t + '_file_name', t + '_file_data', t + '_file_size', t + '_mime_type', t + '_uploaded_at'];
        db.run(`UPDATE applicants SET ${fields.map(f => f + '=NULL').join(',')}, updated_at=datetime('now') WHERE applicant_id=?`, [appId]);
        db.run(`DELETE FROM applicants WHERE applicant_id=? AND transcript_file_name IS NULL AND cnic_file_name IS NULL AND photo_file_name IS NULL`, [appId]);
      }
      saveDatabase();
    },

    updateDocumentStatus(id, status) {
      const db = getDb();
      if (id.startsWith('transcript:') || id.startsWith('cnic:') || id.startsWith('photo:')) {
        const parts = id.split(':');
        const appId = parts.slice(1).join(':');
        db.run('UPDATE applicants SET status = ?, updated_at = datetime(\'now\') WHERE applicant_id = ?', [status, appId]);
      }
      saveDatabase();
    },
  };
}

function queryOne(db, sql, params = []) {
  const rows = queryAll(db, sql, params);
  return rows.length ? rows[0] : null;
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
