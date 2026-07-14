const { Router } = require('express');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/documentController');

const router = Router();

router.post('/upload', upload.single('file'), ctrl.upload);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.delete('/:id', ctrl.remove);
router.patch('/:id/status', ctrl.patchStatus);

module.exports = router;
