const { getDb, saveDatabase } = require('../config/db');

function createSqliteRepository() {
  function setCol(prefix, applicantId, fullName, fileName, fileData, fileSize, mimeType) {
    const db = getDb();
    db.run(
      `INSERT INTO applicants (applicant_id, full_name, updated_at,
        ${prefix}_file_name, ${prefix}_file_data, ${prefix}_file_size, ${prefix}_mime_type, ${prefix}_uploaded_at, ${prefix}_status)
       VALUES (?, ?, datetime('now'), ?, ?, ?, ?, datetime('now'), 'pending')
       ON CONFLICT(applicant_id) DO UPDATE SET
        full_name = COALESCE(NULLIF(excluded.full_name, ''), full_name),
        updated_at = datetime('now'),
        ${prefix}_file_name = excluded.${prefix}_file_name,
        ${prefix}_file_data = excluded.${prefix}_file_data,
        ${prefix}_file_size = excluded.${prefix}_file_size,
        ${prefix}_mime_type = excluded.${prefix}_mime_type,
        ${prefix}_uploaded_at = datetime('now'),
        ${prefix}_status = 'pending'`,
      [applicantId, fullName, fileName, fileData, fileSize, mimeType]
    );
    saveDatabase();
    return prefix + ':' + applicantId;
  }

  return {
    upsertDocument(id, applicantId, fullName, docType, fileName, fileData, fileSize, mimeType) {
      if (docType === 'photo') {
        const db = getDb();
        db.run(
          'INSERT INTO photos (id, applicant_id, file_name, file_data, file_size, mime_type, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))',
          [id, applicantId, fileName, fileData, fileSize, mimeType]
        );
        saveDatabase();
        return id;
      }
      return setCol(docType, applicantId, fullName, fileName, fileData, fileSize, mimeType);
    },

    findDocuments(applicantId) {
      const db = getDb();
      const docs = [];
      const app = queryOne(db, 'SELECT * FROM applicants WHERE applicant_id = ?', [applicantId]);
      if (app) {
        for (const t of ['transcript', 'cnic']) {
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
              status: app[t + '_status'],
            });
          }
        }
      }
      const photos = queryAll(db, 'SELECT id, applicant_id, file_name, file_size, mime_type, uploaded_at, status FROM photos WHERE applicant_id = ? ORDER BY uploaded_at DESC', [applicantId]);
      for (const p of photos) {
        p.document_type = 'photo';
        p.full_name = app ? app.full_name : '';
        docs.push(p);
      }
      return docs;
    },

    findDocumentById(id) {
      const db = getDb();
      if (id.startsWith('transcript:') || id.startsWith('cnic:')) {
        const parts = id.split(':');
        const t = parts[0];
        const appId = parts.slice(1).join(':');
        const app = queryOne(db, 'SELECT * FROM applicants WHERE applicant_id = ?', [appId]);
        if (!app || !app[t + '_file_name']) return null;
        return {
          id, applicant_id: app.applicant_id, full_name: app.full_name, document_type: t,
          file_name: app[t + '_file_name'], file_size: app[t + '_file_size'],
          mime_type: app[t + '_mime_type'], uploaded_at: app[t + '_uploaded_at'], status: app[t + '_status'],
        };
      }
      const p = queryOne(db, 'SELECT id, applicant_id, file_name, file_size, mime_type, uploaded_at, status FROM photos WHERE id = ?', [id]);
      if (p) { p.document_type = 'photo'; return p; }
      return null;
    },

    findDocumentFileById(id) {
      const db = getDb();
      if (id.startsWith('transcript:') || id.startsWith('cnic:')) {
        const parts = id.split(':');
        const t = parts[0];
        const appId = parts.slice(1).join(':');
        const app = queryOne(db, 'SELECT ' + t + '_file_name as file_name, ' + t + '_mime_type as mime_type, ' + t + '_file_data as file_data FROM applicants WHERE applicant_id = ?', [appId]);
        if (!app || !app.file_data) return null;
        return app;
      }
      const stmt = db.prepare('SELECT id, file_name, mime_type, file_data FROM photos WHERE id = ?');
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
      if (id.startsWith('transcript:') || id.startsWith('cnic:')) {
        const parts = id.split(':');
        const t = parts[0];
        const appId = parts.slice(1).join(':');
        const fields = [t + '_file_name', t + '_file_data', t + '_file_size', t + '_mime_type', t + '_uploaded_at', t + '_status'];
        db.run(`UPDATE applicants SET ${fields.map(f => f + '=NULL').join(',')}, updated_at=datetime('now') WHERE applicant_id=?`, [appId]);
      } else {
        db.run('DELETE FROM photos WHERE id = ?', [id]);
      }
      saveDatabase();
    },

    updateDocumentStatus(id, status) {
      const db = getDb();
      if (id.startsWith('transcript:') || id.startsWith('cnic:')) {
        const parts = id.split(':');
        const t = parts[0];
        const appId = parts.slice(1).join(':');
        db.run(`UPDATE applicants SET ${t}_status = ?, updated_at = datetime('now') WHERE applicant_id = ?`, [status, appId]);
      } else {
        db.run('UPDATE photos SET status = ? WHERE id = ?', [status, id]);
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
