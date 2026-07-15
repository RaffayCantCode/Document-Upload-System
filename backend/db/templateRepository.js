/**
 * Template Repository — Stub Adapter
 *
 * The system now uses a single-row-per-applicant design:
 *   - applicants table: 1 row per applicant with transcript + cnic columns
 *   - photos table: 1 row per photo (1-to-many with applicant)
 *
 * Document IDs for API:
 *   - transcript → "transcript:<applicant_id>"
 *   - cnic       → "cnic:<applicant_id>"
 *   - photo      → "<photo_uuid>"
 *
 * Implement these methods and pass to createModule({ repository: myRepo }).
 */

function createMyRepository() {
  return {

    /**
     * Upload a document.
     * For transcript/cnic: upsert into applicants table (set the type's columns).
     * For photo: insert into photos table.
     * @param {string} id          — UUID (for photos; ignored for transcript/cnic)
     * @param {string} applicantId
     * @param {string} fullName
     * @param {string} docType     — "transcript" | "cnic" | "photo"
     * @param {string} fileName
     * @param {Buffer} fileData
     * @param {number} fileSize
     * @param {string} mimeType
     * @returns {string} document id — "transcript:<id>" | "cnic:<id>" | "<photo-uuid>"
     */
    async upsertDocument(id, applicantId, fullName, docType, fileName, fileData, fileSize, mimeType) {
      // TODO
      return docType === 'photo' ? id : docType + ':' + applicantId;
    },

    /**
     * List all documents for an applicant.
     * Return transcript + cnic (from applicants row) + all photos.
     * @param {string} applicantId
     * @returns {Array<object>} each with: id, applicant_id, full_name, document_type, file_name, file_size, mime_type, uploaded_at, status
     */
    async findDocuments(applicantId) {
      // TODO: SELECT applicants row + photos WHERE applicant_id = ?
      return [];
    },

    /**
     * Get a single document's metadata by its composite id.
     * @param {string} id — "transcript:<id>" | "cnic:<id>" | "<photo-uuid>"
     * @returns {object|null}
     */
    async findDocumentById(id) {
      // TODO: parse prefix, look up applicants or photos
      return null;
    },

    /**
     * Get file data for download.
     * @param {string} id — "transcript:<id>" | "cnic:<id>" | "<photo-uuid>"
     * @returns {object|null} { file_name, mime_type, file_data(Buffer) }
     */
    async findDocumentFileById(id) {
      // TODO
      return null;
    },

    /**
     * Delete a document.
     * For transcript/cnic: NULL out those columns in applicants row.
     * For photo: DELETE from photos table.
     * @param {string} id
     */
    async deleteDocumentById(id) {
      // TODO
    },

    /**
     * Update a document's status.
     * @param {string} id
     * @param {string} status — "pending" | "verified" | "rejected"
     */
    async updateDocumentStatus(id, status) {
      // TODO
    },
  };
}

module.exports = { createMyRepository };
