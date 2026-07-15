/**
 * Template Repository — Stub Adapter
 *
 * Copy this file and implement each method for your own database
 * (MongoDB, MySQL, Firestore, etc.). Then pass the object to createModule():
 *
 *   const myRepo = createMyRepository();
 *   app.use('/api/documents', docUpload.createModule({ repository: myRepo }));
 *
 * Method signatures and expected return types are documented below.
 */

function createMyRepository() {
  return {

    /**
     * Insert or update a document for this applicant + document_type.
     * For transcript/cnic: if a row exists, update it (upsert). Only 1 per applicant.
     * For photo: always insert a new row (multiple photos allowed).
     * @param {string} id          — UUID (only used for new inserts)
     * @param {string} applicantId — e.g. "STU-001"
     * @param {string} fullName    — applicant's full name
     * @param {string} docType     — one of: "transcript", "cnic", "photo"
     * @param {string} fileName    — original file name
     * @param {Buffer} fileData    — raw file bytes (BLOB)
     * @param {number} fileSize    — file size in bytes
     * @param {string} mimeType    — e.g. "application/pdf", "image/png"
     * @returns {string} the id of the upserted/inserted document
     */
    async upsertDocument(id, applicantId, fullName, docType, fileName, fileData, fileSize, mimeType) {
      // TODO: if (docType === 'transcript' || docType === 'cnic') check existing;
      //       if exists UPDATE and return its id, else INSERT new
      return id;
    },

    /**
     * List documents, optionally filtered by applicantId.
     * @param {string|null} applicantId — filter or null for all
     * @returns {Array<object>} each object: { id, applicant_id, full_name, document_type, file_name, file_size, mime_type, uploaded_at, status }
     *   Do NOT include file_data for performance.
     */
    async findDocuments(applicantId) {
      // TODO: SELECT … return array
      return [];
    },

    /**
     * Get a single document's metadata by id.
     * @param {string} id
     * @returns {object|null} { id, applicant_id, full_name, document_type, file_name, file_size, mime_type, uploaded_at, status }
     */
    async findDocumentById(id) {
      // TODO: SELECT … return one row or null
      return null;
    },

    /**
     * Get a document's file data for download.
     * @param {string} id
     * @returns {object|null} { id, file_name, mime_type, file_data(Buffer) }
     */
    async findDocumentFileById(id) {
      // TODO: SELECT … return one row or null; file_data should be a Buffer
      return null;
    },

    /**
     * Delete a document by id.
     * @param {string} id
     */
    async deleteDocumentById(id) {
      // TODO: DELETE FROM …
    },

    /**
     * Update a document's status.
     * @param {string} id
     * @param {string} status — one of: "pending", "verified", "rejected"
     */
    async updateDocumentStatus(id, status) {
      // TODO: UPDATE …
    },
  };
}

module.exports = { createMyRepository };
