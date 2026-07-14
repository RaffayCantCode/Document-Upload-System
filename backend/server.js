const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { initDatabase, saveDatabase, getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
const MAX_FILE_SIZE = (process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024;

const ALLOWED_MIMES = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

const ALLOWED_DOC_TYPES = ['transcript', 'cnic', 'photo'];

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg'];
    if (!allowedExts.includes(ext) || !ALLOWED_MIMES[file.mimetype]) {
      return cb(new Error(`Invalid file type: ${ext}. Allowed: PDF, PNG, JPG`), false);
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_FILE_SIZE },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));

app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { applicant_id, document_type } = req.body;
    if (!applicant_id || !document_type) {
      return res.status(400).json({ error: 'applicant_id and document_type are required' });
    }

    if (!ALLOWED_DOC_TYPES.includes(document_type)) {
      return res.status(400).json({ error: `Invalid document_type. Allowed: ${ALLOWED_DOC_TYPES.join(', ')}` });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    const destDir = path.join(UPLOAD_DIR, applicant_id, document_type);
    const destPath = path.join(destDir, uniqueName);

    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destPath, req.file.buffer);

    const id = uuidv4();
    const db = getDb();
    db.run(
      `INSERT INTO documents (id, applicant_id, document_type, file_name, stored_path, file_size, mime_type, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, applicant_id, document_type, req.file.originalname, destPath, req.file.size, req.file.mimetype]
    );
    saveDatabase();

    const result = db.exec(`SELECT * FROM documents WHERE id = '${id}'`);
    const row = result[0]?.values[0];
    const columns = result[0]?.columns;

    res.status(201).json({
      message: 'File uploaded successfully',
      document: {
        id: row[0],
        applicant_id: row[1],
        document_type: row[2],
        file_name: row[3],
        file_size: row[5],
        mime_type: row[6],
        uploaded_at: row[7],
        status: row[8],
      },
    });
  });
});

app.get('/api/documents', (req, res) => {
  const { applicant_id } = req.query;
  const db = getDb();

  let query = 'SELECT * FROM documents';
  const params = [];

  if (applicant_id) {
    query += ' WHERE applicant_id = ?';
    params.push(applicant_id);
  }

  query += ' ORDER BY uploaded_at DESC';

  const result = db.exec(query, params);
  if (!result.length) {
    return res.json({ documents: [] });
  }

  const columns = result[0].columns;
  const rows = result[0].values;

  const documents = rows.map((row) => {
    const doc = {};
    columns.forEach((col, i) => {
      doc[col] = row[i];
    });
    return doc;
  });

  res.json({ documents });
});

app.get('/api/documents/:id', (req, res) => {
  const db = getDb();
  const result = db.exec(`SELECT * FROM documents WHERE id = '${req.params.id}'`);

  if (!result.length || !result[0].values.length) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const columns = result[0].columns;
  const row = result[0].values[0];
  const doc = {};
  columns.forEach((col, i) => {
    doc[col] = row[i];
  });

  res.json({ document: doc });
});

app.delete('/api/documents/:id', (req, res) => {
  const db = getDb();
  const result = db.exec(`SELECT * FROM documents WHERE id = '${req.params.id}'`);

  if (!result.length || !result[0].values.length) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const docPath = result[0].values[0][4];

  if (fs.existsSync(docPath)) {
    fs.unlinkSync(docPath);
  }

  db.run(`DELETE FROM documents WHERE id = '${req.params.id}'`);
  saveDatabase();

  res.json({ message: 'Document deleted successfully' });
});

app.patch('/api/documents/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Use: pending, verified, rejected' });
  }

  const db = getDb();
  const result = db.exec(`SELECT * FROM documents WHERE id = '${req.params.id}'`);
  if (!result.length || !result[0].values.length) {
    return res.status(404).json({ error: 'Document not found' });
  }

  db.run(`UPDATE documents SET status = '${status}' WHERE id = '${req.params.id}'`);
  saveDatabase();

  res.json({ message: 'Document status updated', status });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
