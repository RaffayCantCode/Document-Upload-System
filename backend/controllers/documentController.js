const service = require('../services/documentService');

function upload(req, res, next) {
  try {
    const doc = service.uploadDocument(req.file, req.body.applicant_id, req.body.document_type);
    res.status(201).json({ message: 'File uploaded successfully', document: doc });
  } catch (err) {
    next(err);
  }
}

function list(req, res, next) {
  try {
    const documents = service.listDocuments(req.query.applicant_id);
    res.json({ documents });
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const doc = service.getDocument(req.params.id);
    res.json({ document: doc });
  } catch (err) {
    next(err);
  }
}

function remove(req, res, next) {
  try {
    service.deleteDocument(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    next(err);
  }
}

function patchStatus(req, res, next) {
  try {
    service.updateStatus(req.params.id, req.body.status);
    res.json({ message: 'Document status updated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, list, getById, remove, patchStatus };
