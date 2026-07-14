const { v4: uuidv4 } = require('uuid');
const config = require('../config/index');

function createDocumentService(repo) {
  function uploadDocument(file, applicantId, docType) {
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
    repo.insertDocument(id, applicantId, docType, file.originalname, file.buffer, file.size, file.mimetype);

    return { id, applicant_id: applicantId, document_type: docType, file_name: file.originalname, file_size: file.size, mime_type: file.mimetype };
  }

  function listDocuments(applicantId) {
    return repo.findDocuments(applicantId || null);
  }

  function getDocument(id) {
    const doc = repo.findDocumentById(id);
    if (!doc) {
      throw Object.assign(new Error('Document not found'), { status: 404 });
    }
    return doc;
  }

  function getDocumentFile(id) {
    const file = repo.findDocumentFileById(id);
    if (!file) {
      throw Object.assign(new Error('Document not found'), { status: 404 });
    }
    return file;
  }

  function deleteDocument(id) {
    const doc = repo.findDocumentById(id);
    if (!doc) {
      throw Object.assign(new Error('Document not found'), { status: 404 });
    }
    repo.deleteDocumentById(id);
  }

  function updateStatus(id, status) {
    const valid = ['pending', 'verified', 'rejected'];
    if (!valid.includes(status)) {
      throw Object.assign(new Error(`Invalid status. Use: ${valid.join(', ')}`), { status: 400 });
    }
    const doc = repo.findDocumentById(id);
    if (!doc) {
      throw Object.assign(new Error('Document not found'), { status: 404 });
    }
    repo.updateDocumentStatus(id, status);
  }

  return { uploadDocument, listDocuments, getDocument, getDocumentFile, deleteDocument, updateStatus };
}

module.exports = { createDocumentService };
