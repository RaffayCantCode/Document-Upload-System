const { Router } = require('express');
const upload = require('../middleware/upload');

function createDocumentRoutes(controller) {
  const router = Router();

  router.post('/upload', upload.single('file'), controller.upload);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.get('/:id/download', controller.download);
  router.delete('/:id', controller.remove);
  router.patch('/:id/status', controller.patchStatus);

  return router;
}

module.exports = { createDocumentRoutes };
