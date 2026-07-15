const { v4: uuidv4 } = require('uuid');
const config = require('../config/index');

function createDocumentService(repo) {
  async function uploadDocument(file, applicantId, fullName, docType) {
    if (!file) {
      throw Object.assign(new Error('No file provided'), { status: 400 });
    }
    if (!applicantId || !docType) {
      throw Object.assign(new Error('applicant_id and document_type are required'), { status: 400 });
    }
    if (!config.allowedDocTypes.includes(docType)) {
      throw Object.assign(
        new Error(`Invalid document_type. Allowed: ${config.allowedDocTypes.join(', ')}`),
        { status: 400 }
      );
    }

    const id = uuidv4();
    const docId = await repo.upsertDocument(id, applicantId, fullName || '', docType, file.originalname, file.buffer, file.size, file.mimetype);

    return { id: docId, applicant_id: applicantId, full_name: fullName || '', document_type: docType, file_name: file.originalname, file_size: file.size, mime_type: file.mimetype };
  }

  async function listDocuments(applicantId) {
    return repo.findDocuments(applicantId || null);
  }

  async function getDocument(id) {
    const doc = await repo.findDocumentById(id);
    if (!doc) {
      throw Object.assign(new Error('Document not found'), { status: 404 });
    }
    return doc;
  }

  async function getDocumentFile(id) {
    const file = await repo.findDocumentFileById(id);
    if (!file) {
      throw Object.assign(new Error('Document not found'), { status: 404 });
    }
    return file;
  }

  async function deleteDocument(id) {
    const doc = await repo.findDocumentById(id);
    if (!doc) {
      throw Object.assign(new Error('Document not found'), { status: 404 });
    }
    await repo.deleteDocumentById(id);
  }

  async function updateStatus(id, status) {
    const valid = ['pending', 'verified', 'rejected'];
    if (!valid.includes(status)) {
      throw Object.assign(new Error(`Invalid status. Use: ${valid.join(', ')}`), { status: 400 });
    }
    const doc = await repo.findDocumentById(id);
    if (!doc) {
      throw Object.assign(new Error('Document not found'), { status: 404 });
    }
    await repo.updateDocumentStatus(id, status);
  }

  return { uploadDocument, listDocuments, getDocument, getDocumentFile, deleteDocument, updateStatus };
}

module.exports = { createDocumentService };
