const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/index');
const repo = require('../db/documentRepository');

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

  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueName = `${uuidv4()}${ext}`;
  const destDir = path.join(config.uploadDir, applicantId, docType);
  const destPath = path.join(destDir, uniqueName);

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(destPath, file.buffer);

  const id = uuidv4();
  repo.insertDocument(id, applicantId, docType, file.originalname, destPath, file.size, file.mimetype);

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

function deleteDocument(id) {
  const doc = repo.findDocumentById(id);
  if (!doc) {
    throw Object.assign(new Error('Document not found'), { status: 404 });
  }

  if (fs.existsSync(doc.stored_path)) {
    fs.unlinkSync(doc.stored_path);
    const dir = path.dirname(doc.stored_path);
    if (fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
    }
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

module.exports = { uploadDocument, listDocuments, getDocument, deleteDocument, updateStatus };
