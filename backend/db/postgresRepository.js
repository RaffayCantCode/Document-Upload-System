const { Pool } = require('pg');

function createPostgresRepository(connectionString) {
  const pool = new Pool({ connectionString });

  async function ensureTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id            TEXT PRIMARY KEY,
        applicant_id  TEXT NOT NULL,
        full_name     TEXT NOT NULL DEFAULT '',
        document_type TEXT NOT NULL CHECK(document_type IN ('transcript','cnic','photo')),
        file_name     TEXT NOT NULL,
        file_data     BYTEA,
        file_size     INTEGER NOT NULL,
        mime_type     TEXT NOT NULL,
        uploaded_at   TIMESTAMP DEFAULT NOW(),
        status        TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected'))
      )
    `);
    try { await pool.query(`ALTER TABLE documents ADD COLUMN full_name TEXT NOT NULL DEFAULT ''`); } catch (e) {}
  }

  return {
    pool,
    ensureTable,

    async upsertDocument(id, applicantId, fullName, docType, fileName, fileData, fileSize, mimeType) {
      if (docType === 'transcript' || docType === 'cnic') {
        const existing = await pool.query('SELECT id FROM documents WHERE applicant_id = $1 AND document_type = $2', [applicantId, docType]);
        if (existing.rows.length) {
          const existingId = existing.rows[0].id;
          await pool.query(
            `UPDATE documents SET file_name = $1, file_data = $2, file_size = $3, mime_type = $4, full_name = $5, uploaded_at = NOW(), status = 'pending' WHERE id = $6`,
            [fileName, fileData, fileSize, mimeType, fullName, existingId]
          );
          return existingId;
        }
      }
      await pool.query(
        `INSERT INTO documents (id, applicant_id, full_name, document_type, file_name, file_data, file_size, mime_type, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [id, applicantId, fullName, docType, fileName, fileData, fileSize, mimeType]
      );
      return id;
    },

    async findDocuments(applicantId) {
      let sql = 'SELECT id, applicant_id, full_name, document_type, file_name, file_size, mime_type, uploaded_at, status FROM documents';
      const params = [];
      if (applicantId) {
        sql += ' WHERE applicant_id = $1';
        params.push(applicantId);
      }
      sql += ' ORDER BY uploaded_at DESC';
      const result = await pool.query(sql, params);
      return result.rows;
    },

    async findDocumentById(id) {
      const result = await pool.query(
        'SELECT id, applicant_id, full_name, document_type, file_name, file_size, mime_type, uploaded_at, status FROM documents WHERE id = $1',
        [id]
      );
      return result.rows.length ? result.rows[0] : null;
    },

    async findDocumentFileById(id) {
      const result = await pool.query(
        'SELECT id, file_name, mime_type, file_data FROM documents WHERE id = $1',
        [id]
      );
      if (!result.rows.length) return null;
      const row = result.rows[0];
      row.file_data = row.file_data ? Buffer.from(row.file_data) : null;
      return row;
    },

    async deleteDocumentById(id) {
      await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    },

    async updateDocumentStatus(id, status) {
      await pool.query('UPDATE documents SET status = $1 WHERE id = $2', [status, id]);
    },

    async close() {
      await pool.end();
    },
  };
}

module.exports = { createPostgresRepository };
