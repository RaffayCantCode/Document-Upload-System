const { Pool } = require('pg');

function createPostgresRepository(connectionString) {
  const pool = new Pool({ connectionString });

  async function ensureTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applicants (
        applicant_id  TEXT PRIMARY KEY,
        full_name     TEXT NOT NULL DEFAULT '',
        updated_at    TIMESTAMP DEFAULT NOW(),

        transcript_file_name    TEXT,
        transcript_file_data    BYTEA,
        transcript_file_size    INTEGER,
        transcript_mime_type    TEXT,
        transcript_uploaded_at  TIMESTAMP,
        transcript_status       TEXT NOT NULL DEFAULT 'pending',

        cnic_file_name    TEXT,
        cnic_file_data    BYTEA,
        cnic_file_size    INTEGER,
        cnic_mime_type    TEXT,
        cnic_uploaded_at  TIMESTAMP,
        cnic_status       TEXT NOT NULL DEFAULT 'pending'
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id            TEXT PRIMARY KEY,
        applicant_id  TEXT NOT NULL,
        file_name     TEXT NOT NULL,
        file_data     BYTEA,
        file_size     INTEGER NOT NULL,
        mime_type     TEXT NOT NULL,
        uploaded_at   TIMESTAMP DEFAULT NOW(),
        status        TEXT NOT NULL DEFAULT 'pending'
      )
    `);
  }

  return {
    pool,
    ensureTable,

    async upsertDocument(id, applicantId, fullName, docType, fileName, fileData, fileSize, mimeType) {
      if (docType === 'photo') {
        await pool.query(
          'INSERT INTO photos (id, applicant_id, file_name, file_data, file_size, mime_type, uploaded_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [id, applicantId, fileName, fileData, fileSize, mimeType]
        );
        return id;
      }
      const prefix = docType;
      await pool.query(
        `INSERT INTO applicants (applicant_id, full_name, updated_at,
          ${prefix}_file_name, ${prefix}_file_data, ${prefix}_file_size, ${prefix}_mime_type, ${prefix}_uploaded_at, ${prefix}_status)
         VALUES ($1, $2, NOW(), $3, $4, $5, $6, NOW(), 'pending')
         ON CONFLICT (applicant_id) DO UPDATE SET
          full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), applicants.full_name),
          updated_at = NOW(),
          ${prefix}_file_name = EXCLUDED.${prefix}_file_name,
          ${prefix}_file_data = EXCLUDED.${prefix}_file_data,
          ${prefix}_file_size = EXCLUDED.${prefix}_file_size,
          ${prefix}_mime_type = EXCLUDED.${prefix}_mime_type,
          ${prefix}_uploaded_at = NOW(),
          ${prefix}_status = 'pending'`,
        [applicantId, fullName, fileName, fileData, fileSize, mimeType]
      );
      return prefix + ':' + applicantId;
    },

    async findDocuments(applicantId) {
      const docs = [];
      const appRes = await pool.query('SELECT * FROM applicants WHERE applicant_id = $1', [applicantId]);
      const app = appRes.rows[0];
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
      const photosRes = await pool.query(
        'SELECT id, applicant_id, file_name, file_size, mime_type, uploaded_at, status FROM photos WHERE applicant_id = $1 ORDER BY uploaded_at DESC',
        [applicantId]
      );
      for (const p of photosRes.rows) {
        p.document_type = 'photo';
        p.full_name = app ? app.full_name : '';
        docs.push(p);
      }
      return docs;
    },

    async findDocumentById(id) {
      if (id.startsWith('transcript:') || id.startsWith('cnic:')) {
        const [t, ...rest] = id.split(':');
        const appId = rest.join(':');
        const res = await pool.query('SELECT * FROM applicants WHERE applicant_id = $1', [appId]);
        const app = res.rows[0];
        if (!app || !app[t + '_file_name']) return null;
        return {
          id, applicant_id: app.applicant_id, full_name: app.full_name, document_type: t,
          file_name: app[t + '_file_name'], file_size: app[t + '_file_size'],
          mime_type: app[t + '_mime_type'], uploaded_at: app[t + '_uploaded_at'], status: app[t + '_status'],
        };
      }
      const pRes = await pool.query('SELECT id, applicant_id, file_name, file_size, mime_type, uploaded_at, status FROM photos WHERE id = $1', [id]);
      const p = pRes.rows[0];
      if (p) { p.document_type = 'photo'; return p; }
      return null;
    },

    async findDocumentFileById(id) {
      if (id.startsWith('transcript:') || id.startsWith('cnic:')) {
        const [t, ...rest] = id.split(':');
        const appId = rest.join(':');
        const res = await pool.query(
          `SELECT ${t}_file_name as file_name, ${t}_mime_type as mime_type, ${t}_file_data as file_data FROM applicants WHERE applicant_id = $1`,
          [appId]
        );
        const row = res.rows[0];
        if (!row || !row.file_data) return null;
        row.file_data = Buffer.from(row.file_data);
        return row;
      }
      const pRes = await pool.query('SELECT id, file_name, mime_type, file_data FROM photos WHERE id = $1', [id]);
      const p = pRes.rows[0];
      if (!p) return null;
      p.file_data = p.file_data ? Buffer.from(p.file_data) : null;
      return p;
    },

    async deleteDocumentById(id) {
      if (id.startsWith('transcript:') || id.startsWith('cnic:')) {
        const [t, ...rest] = id.split(':');
        const appId = rest.join(':');
        const fields = [t + '_file_name', t + '_file_data', t + '_file_size', t + '_mime_type', t + '_uploaded_at', t + '_status'];
        await pool.query(
          `UPDATE applicants SET ${fields.map(f => f + '=NULL').join(',')}, updated_at=NOW() WHERE applicant_id=$1`,
          [appId]
        );
      } else {
        await pool.query('DELETE FROM photos WHERE id = $1', [id]);
      }
    },

    async updateDocumentStatus(id, status) {
      if (id.startsWith('transcript:') || id.startsWith('cnic:')) {
        const [t, ...rest] = id.split(':');
        const appId = rest.join(':');
        await pool.query(`UPDATE applicants SET ${t}_status = $1, updated_at = NOW() WHERE applicant_id = $2`, [status, appId]);
      } else {
        await pool.query('UPDATE photos SET status = $1 WHERE id = $2', [status, id]);
      }
    },

    async close() {
      await pool.end();
    },
  };
}

module.exports = { createPostgresRepository };
