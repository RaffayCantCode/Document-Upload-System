# Document Upload System

Group 21 — University Admissions Portal (SafeX Solutions)

React + Express + SQLite (pluggable database)

---

## Quick Start

```bash
# Terminal 1 — Backend
cd backend && npm install && npm start     # → localhost:5000

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev  # → localhost:3000
```

Open `http://localhost:3000`, enter an Applicant ID, pick a file, upload.

---

## Features

- Upload transcripts, CNIC, photos — validated for type (PDF/PNG/JPG) and size (max 10MB)
- Files stored as BLOBs in database — no file system dependency
- Drag-and-drop upload + document list with status badges + download button
- Status tracking: pending → verified/rejected
- Scoped CSS (`doc-*`) — won't break your existing styles
- CORS-ready — configure allowed origins

---

## API

| Method | Endpoint | What it does |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload file (multipart: file + applicant_id + document_type) |
| GET | `/api/documents?applicant_id=X` | List documents |
| GET | `/api/documents/:id` | Get metadata |
| GET | `/api/documents/:id/download` | Download file |
| DELETE | `/api/documents/:id` | Delete document |
| PATCH | `/api/documents/:id/status` | Update status |

---

## Integrate Into Your Site

**Backend** — mount in 3 lines:
```js
const docUpload = require('./backend');
await docUpload.initDatabase();
app.use('/api/documents', docUpload.createModule());
app.use(docUpload.errorHandler);
```

**Use your own database** — pass a custom adapter:
```js
app.use('/api/documents', docUpload.createModule({
  repository: { insertDocument, findDocuments, findDocumentById, findDocumentFileById, deleteDocumentById, updateDocumentStatus }
}));
```

**Frontend** — import the React widgets:
```jsx
import { DocumentUpload, DocumentList, createApiClient, useDocuments } from './frontend/src/index';
const api = createApiClient('/api/documents');
<DocumentUpload apiClient={api} applicantId={id} onUploadSuccess={refresh} />
<DocumentList documents={docs} onDelete={deleteDocument} getDownloadUrl={api.getDownloadUrl} />
```

See `DOCUMENTATION.md` or `DOCUMENTATION.doc` for full integration guide.

---

## Project Structure

```
backend/
  config/        Environment config + DB init
  middleware/    Multer upload + error handler
  routes/        API routes
  controllers/  Request handlers
  services/      Business logic
  db/            Repository (pluggable database adapter)
  index.js       Module factory — mount into any Express app
  server.js      Standalone launcher
frontend/
  src/
    components/  DocumentUpload + DocumentList widgets
    hooks/       useDocuments hook
    api.js       API client factory
    index.js     Public exports
    App.jsx      Demo app
    App.css      Scoped styles
```

---

## Config (via .env)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `DB_PATH` | database.sqlite | SQLite file path |
| `MAX_FILE_SIZE_MB` | 1 | Max upload size |
| `CORS_ORIGINS` | * | Allowed origins |

## Challenges

- **sql.js BLOBs** — retrieving binary data needed manual `stmt.get()` + `Buffer.from()` instead of `getAsObject()`
- **Pluggable DB** — inverted repo/service/controller into factory functions so users inject their own database adapter
- **Multer timing** — `req.body` undefined in diskStorage destination; switched to memoryStorage + manual write
- **Two preview flows** — pre-upload (`URL.createObjectURL`) vs post-upload (DB download); PDF blob URLs unreliable in browsers
- **Scoped CSS** — all `doc-*` prefixed to avoid clashing with host site styles
- **sql.js persistence** — in-memory DB requires explicit `saveDatabase()` after every write or data is lost on crash

Full details in `DOCUMENTATION.doc`.

---

*Add screenshots and video demo link here.*
