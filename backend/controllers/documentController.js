function createDocumentController(service) {
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

  function download(req, res, next) {
    try {
      const file = service.getDocumentFile(req.params.id);
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
      res.send(Buffer.from(file.file_data));
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

  return { upload, list, getById, download, remove, patchStatus };
}

module.exports = { createDocumentController };
