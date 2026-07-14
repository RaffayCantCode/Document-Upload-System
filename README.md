# Document Upload System

**Developer:** Muhammad Raffay Asif  
**Group 21** — University Admissions Portal (SafeX Solutions)

React + Express + SQLite (pluggable database)

---

## Quick Start

> **Important:** Backend and frontend must run **at the same time** in two separate terminals. The frontend on port 3000 sends API calls to the backend on port 5000 — if only one is running, nothing works.

### Option A — Double-click `start.bat`
Opens both terminals automatically. Then open `http://localhost:3000`.

### Option B — Manual (two terminals)

```bash
# Terminal 1 — Backend (API server)
cd backend
npm install    # first time only
npm start      # → http://localhost:5000

# Terminal 2 — Frontend (UI)
cd frontend
npm install    # first time only
npm run dev    # → http://localhost:3000
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
| `DB_TYPE` | sqlite | `sqlite` or `postgres` |
| `DB_PATH` | database.sqlite | SQLite file path |
| `PG_CONNECTION_STRING` | — | PostgreSQL connection string |
| `MAX_FILE_SIZE_MB` | 1 | Max upload size |
| `CORS_ORIGINS` | * | Allowed origins |

---

## Database Adapters

**SQLite** (default) — zero config, files stored as BLOBs.

**PostgreSQL** — switch by setting `DB_TYPE=postgres` + `PG_CONNECTION_STRING` in `.env`:
```env
DB_TYPE=postgres
PG_CONNECTION_STRING=postgresql://user:password@localhost:5432/document_upload
```
The PostgreSQL adapter uses the `pg` package with connection pooling. Table is auto-created on first use.

**Your own database** — use the [template repository](backend/db/templateRepository.js) with empty stubs:
```js
const myRepo = {
  async insertDocument(id, applicantId, docType, fileName, fileData, fileSize, mimeType) { /* TODO */ },
  async findDocuments(applicantId) { /* TODO */ },
  async findDocumentById(id) { /* TODO */ },
  async findDocumentFileById(id) { /* TODO */ },
  async deleteDocumentById(id) { /* TODO */ },
  async updateDocumentStatus(id, status) { /* TODO */ },
};
app.use('/api/documents', docUpload.createModule({ repository: myRepo }));
```
Works with MongoDB, MySQL, Firestore, or any database — the service layer never touches SQL.

## Challenges

- **sql.js BLOBs** — retrieving binary data needed manual `stmt.get()` + `Buffer.from()` instead of `getAsObject()`
- **Pluggable DB** — inverted repo/service/controller into factory functions so users inject their own database adapter
- **sql.js persistence** — in-memory DB requires explicit `saveDatabase()` after every write or data is lost on crash

Full details in `DOCUMENTATION.doc`.

---

*Add screenshots and video demo link here.*
