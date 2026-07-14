const { Pool } = require('pg');

function createPostgresRepository(connectionString) {
  const pool = new Pool({ connectionString });

  async function ensureTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id            TEXT PRIMARY KEY,
        applicant_id  TEXT NOT NULL,
        document_type TEXT NOT NULL CHECK(document_type IN ('transcript','cnic','photo')),
        file_name     TEXT NOT NULL,
        file_data     BYTEA,
        file_size     INTEGER NOT NULL,
        mime_type     TEXT NOT NULL,
        uploaded_at   TIMESTAMP DEFAULT NOW(),
        status        TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected'))
      )
    `);
  }

  return {
    pool,
    ensureTable,

    async insertDocument(id, applicantId, docType, fileName, fileData, fileSize, mimeType) {
      await pool.query(
        `INSERT INTO documents (id, applicant_id, document_type, file_name, file_data, file_size, mime_type, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [id, applicantId, docType, fileName, fileData, fileSize, mimeType]
      );
    },

    async findDocuments(applicantId) {
      let sql = 'SELECT id, applicant_id, document_type, file_name, file_size, mime_type, uploaded_at, status FROM documents';
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
        'SELECT id, applicant_id, document_type, file_name, file_size, mime_type, uploaded_at, status FROM documents WHERE id = $1',
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
