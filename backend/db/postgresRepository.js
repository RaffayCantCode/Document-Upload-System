const { Pool } = require('pg');

function createPostgresRepository(connectionString) {
  const pool = new Pool({ connectionString });

  async function ensureTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applicants (
        applicant_id  TEXT PRIMARY KEY,
        full_name     TEXT NOT NULL DEFAULT '',
        status        TEXT NOT NULL DEFAULT 'pending',
        updated_at    TIMESTAMP DEFAULT NOW(),

        transcript_file_name    TEXT,
        transcript_file_data    BYTEA,
        transcript_file_size    INTEGER,
        transcript_mime_type    TEXT,
        transcript_uploaded_at  TIMESTAMP,

        cnic_file_name    TEXT,
        cnic_file_data    BYTEA,
        cnic_file_size    INTEGER,
        cnic_mime_type    TEXT,
        cnic_uploaded_at  TIMESTAMP,

        photo_file_name    TEXT,
        photo_file_data    BYTEA,
        photo_file_size    INTEGER,
        photo_mime_type    TEXT,
        photo_uploaded_at  TIMESTAMP
      )
    `);
    await pool.query("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'");
    await pool.query("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS photo_file_name TEXT");
    try { await pool.query("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS photo_file_data BYTEA"); } catch (e) {}
    await pool.query("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS photo_file_size INTEGER");
    await pool.query("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS photo_mime_type TEXT");
    await pool.query("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMP");
    await pool.query(`
      UPDATE applicants SET status = 
        CASE 
          WHEN transcript_status = 'rejected' OR cnic_status = 'rejected' THEN 'rejected'
          WHEN transcript_status = 'verified' AND cnic_status = 'verified' THEN 'verified'
          ELSE 'pending'
        END
      WHERE (transcript_status IS NOT NULL OR cnic_status IS NOT NULL)
    `);
    await pool.query('ALTER TABLE applicants DROP COLUMN IF EXISTS transcript_status');
    await pool.query('ALTER TABLE applicants DROP COLUMN IF EXISTS cnic_status');
    try {
      await pool.query('DROP TABLE IF EXISTS photos');
    } catch (e) {}
  }

  return {
    pool,
    ensureTable,

    async upsertDocument(id, applicantId, fullName, docType, fileName, fileData, fileSize, mimeType) {
      const prefix = docType;
      await pool.query(
        `INSERT INTO applicants (applicant_id, full_name, status, updated_at,
          ${prefix}_file_name, ${prefix}_file_data, ${prefix}_file_size, ${prefix}_mime_type, ${prefix}_uploaded_at)
         VALUES ($1, $2, 'pending', NOW(), $3, $4, $5, $6, NOW())
         ON CONFLICT (applicant_id) DO UPDATE SET
          full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), applicants.full_name),
          status = 'pending',
          updated_at = NOW(),
          ${prefix}_file_name = EXCLUDED.${prefix}_file_name,
          ${prefix}_file_data = EXCLUDED.${prefix}_file_data,
          ${prefix}_file_size = EXCLUDED.${prefix}_file_size,
          ${prefix}_mime_type = EXCLUDED.${prefix}_mime_type,
          ${prefix}_uploaded_at = NOW()`,
        [applicantId, fullName, fileName, fileData, fileSize, mimeType]
      );
      return prefix + ':' + applicantId;
    },

    async findDocuments(applicantId) {
      const docs = [];
      const appRes = await pool.query('SELECT * FROM applicants WHERE applicant_id = $1', [applicantId]);
      const app = appRes.rows[0];
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

    async findDocumentById(id) {
      if (id.startsWith('transcript:') || id.startsWith('cnic:') || id.startsWith('photo:')) {
        const [t, ...rest] = id.split(':');
        const appId = rest.join(':');
        const res = await pool.query('SELECT * FROM applicants WHERE applicant_id = $1', [appId]);
        const app = res.rows[0];
        if (!app || !app[t + '_file_name']) return null;
        return {
          id, applicant_id: app.applicant_id, full_name: app.full_name, document_type: t,
          file_name: app[t + '_file_name'], file_size: app[t + '_file_size'],
          mime_type: app[t + '_mime_type'], uploaded_at: app[t + '_uploaded_at'], status: app.status,
        };
      }
      return null;
    },

    async findDocumentFileById(id) {
      if (id.startsWith('transcript:') || id.startsWith('cnic:') || id.startsWith('photo:')) {
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
      return null;
    },

    async deleteDocumentById(id) {
      if (id.startsWith('transcript:') || id.startsWith('cnic:') || id.startsWith('photo:')) {
        const [t, ...rest] = id.split(':');
        const appId = rest.join(':');
        const fields = [t + '_file_name', t + '_file_data', t + '_file_size', t + '_mime_type', t + '_uploaded_at'];
        await pool.query(
          `UPDATE applicants SET ${fields.map(f => f + '=NULL').join(',')}, updated_at=NOW() WHERE applicant_id=$1`,
          [appId]
        );
      }
    },

    async updateDocumentStatus(id, status) {
      if (id.startsWith('transcript:') || id.startsWith('cnic:') || id.startsWith('photo:')) {
        const [t, ...rest] = id.split(':');
        const appId = rest.join(':');
        await pool.query('UPDATE applicants SET status = $1, updated_at = NOW() WHERE applicant_id = $2', [status, appId]);
      }
    },

    async close() {
      await pool.end();
    },
  };
}

module.exports = { createPostgresRepository };
