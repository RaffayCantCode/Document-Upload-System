/**
 * Template Repository — Stub Adapter
 *
 * Single-row-per-applicant design (no separate photos table):
 *   - applicants table: 1 row per applicant with transcript + cnic + photo columns
 *
 * Document IDs for API (all use the same prefix pattern):
 *   - transcript → "transcript:<applicant_id>"
 *   - cnic       → "cnic:<applicant_id>"
 *   - photo      → "photo:<applicant_id>"
 *
 * Implement these methods and pass to createModule({ repository: myRepo }).
 */

function createMyRepository() {
  return {

    /**
     * Upload a document. Resets applicant status to 'pending'.
     * Upserts into applicants table using `${docType}_file_*` columns.
     * @param {string} id          — ignored (all types use prefix:<applicant_id>)
     * @param {string} applicantId
     * @param {string} fullName
     * @param {string} docType     — "transcript" | "cnic" | "photo"
     * @param {string} fileName
     * @param {Buffer} fileData
     * @param {number} fileSize
     * @param {string} mimeType
     * @returns {string} document id — "transcript:<id>" | "cnic:<id>" | "photo:<id>"
     */
    async upsertDocument(id, applicantId, fullName, docType, fileName, fileData, fileSize, mimeType) {
      // TODO: INSERT INTO applicants (...) VALUES (...) ON CONFLICT DO UPDATE SET ... status='pending'
      return docType + ':' + applicantId;
    },

    /**
     * List all documents for an applicant.
     * Returns transcript, cnic, and photo rows from the single applicants row.
     * @param {string} applicantId
     * @returns {Array<object>} each with: id, applicant_id, full_name, document_type, file_name, file_size, mime_type, uploaded_at, status
     */
    async findDocuments(applicantId) {
      // TODO: SELECT applicants row, push for each type where ${t}_file_name IS NOT NULL
      return [];
    },

    /**
     * Get a single document's metadata by its composite id.
     * Status comes from applicants.status (one status per applicant).
     * @param {string} id — "transcript:<id>" | "cnic:<id>" | "photo:<id>"
     * @returns {object|null}
     */
    async findDocumentById(id) {
      // TODO: parse prefix, look up applicants row
      return null;
    },

    /**
     * Get file data for download.
     * @param {string} id — "transcript:<id>" | "cnic:<id>" | "photo:<id>"
     * @returns {object|null} { file_name, mime_type, file_data(Buffer) }
     */
    async findDocumentFileById(id) {
      // TODO
      return null;
    },

    /**
     * Delete a document by NULLing its columns in the applicants row.
     * Does NOT change applicant status.
     * @param {string} id — "transcript:<id>" | "cnic:<id>" | "photo:<id>"
     */
    async deleteDocumentById(id) {
      // TODO: parse prefix, NULL out ${prefix}_file_* columns
    },

    /**
     * Update the applicant's status (one status per application, not per document).
     * For all document types, updates applicants.status.
     * @param {string} id — "transcript:<id>" | "cnic:<id>" | "photo:<id>"
     * @param {string} status — "pending" | "verified" | "rejected"
     */
    async updateDocumentStatus(id, status) {
      // TODO: parse prefix, extract applicant_id, UPDATE applicants SET status = ?
    },
  };
}

module.exports = { createMyRepository };
