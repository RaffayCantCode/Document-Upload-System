# Document Upload System

**Developer:** Muhammad Raffay Asif  
**Group 21** — University Admissions Portal (SafeX Solutions)

A pluggable document upload module for university admissions portals.  
**Stack:** React 19 + Express.js + SQLite/PostgreSQL

---

## Quick Start

> Backend and frontend must run **simultaneously** — frontend on port 3000 calls backend on port 5000.

**Double-click `start.bat`** or open two terminals:

```bash
# Terminal 1 — Backend (API)
cd backend && npm install && npm start

# Terminal 2 — Frontend (UI)
cd frontend && npm install && npm run dev
```

Open `http://localhost:3000`, enter an Applicant ID, pick a file, upload.

---

## Features

- Upload transcripts, CNIC, photos (PDF/PNG/JPG, max 1MB)
- Files stored as BLOBs in database — no file system dependency
- Drag-and-drop upload with pre-upload preview (images) + remove
- Document table with inline preview (images), open-in-tab (PDFs), download
- Status tracking: pending → verified/rejected
- Scoped CSS (`doc-*`) — won't break existing site styles
- CORS-ready with configurable allowed origins
- `sessionStorage` persistence — applicant ID survives page reloads

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload a file (multipart: file + applicant_id + document_type) |
| GET | `/api/documents?applicant_id=X` | List documents for an applicant |
| GET | `/api/documents/:id` | Get document metadata |
| GET | `/api/documents/:id/download` | Download file (binary) |
| DELETE | `/api/documents/:id` | Delete a document |
| PATCH | `/api/documents/:id/status` | Update status (pending/verified/rejected) |

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

**Frontend** — import React widgets:
```jsx
import { DocumentUpload, DocumentList, createApiClient, useDocuments } from './frontend/src/index';
import './frontend/src/App.css';

const api = createApiClient('/api/documents');

<DocumentUpload apiClient={api} applicantId={id} onUploadSuccess={refresh} />
<DocumentList documents={docs} onDelete={deleteDocument} getDownloadUrl={api.getDownloadUrl} />
```

---

## Database Adapters

**SQLite** (default via sql.js) — zero config, files as BLOBs, single file on disk.

**PostgreSQL** — set in `.env`:
```env
DB_TYPE=postgres
PG_CONNECTION_STRING=postgresql://user:password@host:5432/db
```

**Custom** — implement 6 methods and pass to `createModule({ repository })`.  
A [template repository](backend/db/templateRepository.js) with stubs is provided.

---

## Project Structure

```
backend/
  config/        Environment config + DB init
  middleware/    Multer upload + error handler
  routes/        API route definitions
  controllers/   Request handlers
  services/      Business logic
  db/            Repository adapters (SQLite, PostgreSQL, template)
  index.js       Module factory
  server.js      Standalone launcher
frontend/
  src/
    components/  DocumentUpload + DocumentList widgets
    hooks/       useDocuments hook
    api.js       API client factory
    App.jsx      Demo app
    App.css      Scoped styles (doc-* prefixed)
```

---

## Config (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `DB_TYPE` | sqlite | `sqlite` or `postgres` |
| `DB_PATH` | database.sqlite | SQLite file path |
| `PG_CONNECTION_STRING` | — | PostgreSQL connection string |
| `MAX_FILE_SIZE_MB` | 1 | Max upload size in MB |
| `CORS_ORIGINS` | * | Allowed origins (comma-separated) |

---

## Challenges

- **sql.js BLOBs** — manual `stmt.get()` + `Buffer.from()` needed instead of `getAsObject()`
- **Pluggable DB** — inverted to factory functions so any database can be injected
- **sql.js persistence** — every write must call `saveDatabase()` or data is lost on crash
- **Multer timing** — `req.body` undefined in diskStorage; switched to memoryStorage
- **CSS overlay** — `::before` pseudo-element ate button clicks; fixed with `pointer-events: none`
- **Dotenv missing** — `.env` was never parsed; installed `dotenv` and called `config()`

Full development story and challenges in [`DOCUMENTATION.doc`](DOCUMENTATION.doc).

---

## Demo

Backend: `http://localhost:5000` — shows status page with config info.  
Frontend: `http://localhost:3000` — upload, preview, download, delete.
