function createDocumentController(service) {
  function asyncHandler(fn) {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  }

  const upload = asyncHandler(async (req, res) => {
    const doc = await service.uploadDocument(req.file, req.body.applicant_id, req.body.document_type);
    res.status(201).json({ message: 'File uploaded successfully', document: doc });
  });

  const list = asyncHandler(async (req, res) => {
    const documents = await service.listDocuments(req.query.applicant_id);
    res.json({ documents });
  });

  const getById = asyncHandler(async (req, res) => {
    const doc = await service.getDocument(req.params.id);
    res.json({ document: doc });
  });

  const download = asyncHandler(async (req, res) => {
    const file = await service.getDocumentFile(req.params.id);
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    res.send(Buffer.from(file.file_data));
  });

  const remove = asyncHandler(async (req, res) => {
    await service.deleteDocument(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  });

  const patchStatus = asyncHandler(async (req, res) => {
    await service.updateStatus(req.params.id, req.body.status);
    res.json({ message: 'Document status updated' });
  });

  return { upload, list, getById, download, remove, patchStatus };
}

module.exports = { createDocumentController };
