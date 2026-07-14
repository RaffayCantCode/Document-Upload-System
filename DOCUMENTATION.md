# Document Upload System — Documentation

**Project:** University Admissions Portal (SafeX Solutions)  
**Developer:** Group 21 Member  
**Week 2 — Individual Contribution**

---

## What Was Built

A full-stack **Document Upload Module** that lets university applicants upload required admission documents — **transcripts, CNIC, and photos** — with file-type and size validation.

The module is designed as a **pluggable component**: it can be mounted into any existing Express app (backend) and used as a React component in any frontend. It is not a standalone application — it is an integration-ready subsystem.

---

## Architecture

```
┌────── User's Browser ──────┐     ┌────── Node.js Server ──────────────┐
│                             │     │                                    │
│  React App                  │     │  Express App                       │
│  ┌─────────────────────┐    │     │  ┌─────────────────────────────┐   │
│  │ DocumentUpload      │────┼─────┼──┤  /api/documents  (Router)   │   │
│  │  (widget)           │    │     │  │  ├─ POST /upload            │   │
│  │                     │    │     │  │  ├─ GET  /                  │   │
│  │ DocumentList        │    │     │  │  ├─ GET  /:id               │   │
│  │  (widget)           │────┼─────┼──┤  ├─ DELETE /:id             │   │
│  └─────────────────────┘    │     │  │  └─ PATCH /:id/status      │   │
│                             │     │  └─────────────────────────────┘   │
│  useDocuments(api, id)      │     │       ↓ Controller                │
│  → fetches & manages state  │     │       ↓ Service                   │
│                             │     │       ↓ Repository                │
└─────────────────────────────┘     │       ↓ SQLite Database           │
                                    └────────────────────────────────────┘
```

### Backend Layers

| Layer | File | Responsibility |
|-------|------|----------------|
| **Config** | `backend/config/index.js` | Loads env vars (port, upload dir, CORS, max size, allowed types) |
| **Database** | `backend/config/db.js` | SQLite init, load/save via `sql.js` |
| **Middleware** | `backend/middleware/upload.js` | Multer config: memory storage, file filter (type + size) |
| **Middleware** | `backend/middleware/errorHandler.js` | Global error handling → proper HTTP status codes |
| **Routes** | `backend/routes/documents.js` | Defines 5 REST endpoints |
| **Controller** | `backend/controllers/documentController.js` | Request parsing, response formatting |
| **Service** | `backend/services/documentService.js` | Business logic, file operations, validation |
| **Repository** | `backend/db/documentRepository.js` | Direct SQL queries (insert, find, delete, update) |
| **Module** | `backend/index.js` | Factory `createModule()` → returns a standalone Express Router |

### Frontend Components

| Component/Module | File | Purpose |
|------------------|------|---------|
| **DocumentUpload** | `frontend/src/components/DocumentUpload.jsx` | Drag-and-drop upload widget with type selector, validation, progress |
| **DocumentList** | `frontend/src/components/DocumentList.jsx` | Table of uploaded docs with status badges, filter, delete |
| **useDocuments** | `frontend/src/hooks/useDocuments.js` | React hook for API calls, state management, refresh |
| **apiClient** | `frontend/src/api.js` | Factory: `createApiClient(baseUrl)` → returns `{upload, list, get, remove, updateStatus}` |
| **App** | `frontend/src/App.jsx` | Demo/demo application using the components above |
| **Styles** | `frontend/src/App.css` | Scoped CSS (all classes prefixed `doc-*`) |

---

## How It Works

### Upload Flow

1. User selects a document type (Transcript / CNIC / Photo) and a file
2. **Client-side validation:** checks file extension (.pdf, .png, .jpg) and size (≤10MB)
3. File is sent as `multipart/form-data` to `POST /api/documents/upload`
4. **Server-side validation** re-checks MIME type, extension, size, and document type
5. On success: file is saved to `uploads/{applicant_id}/{document_type}/{uuid}.ext`, metadata stored in SQLite
6. Record is returned with `status: "pending"` — admin can later update to `verified` or `rejected`

### Validation Rules

| Check | Client | Server |
|-------|--------|--------|
| File extension | .pdf/.png/.jpg/.jpeg | Same |
| MIME type | — | application/pdf, image/png, image/jpeg |
| File size | ≤10MB (configurable) | Same |
| Document type | Must be one of: transcript, cnic, photo | Same |
| Applicant ID | Required | Required |

### REST API

| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/api/documents/upload` | multipart: file + applicant_id + document_type | `{ message, document }` |
| GET | `/api/documents?applicant_id=X` | Query param | `{ documents: [...] }` |
| GET | `/api/documents/:id` | Path param | `{ document: {...} }` |
| DELETE | `/api/documents/:id` | Path param | `{ message }` |
| PATCH | `/api/documents/:id/status` | JSON `{ status }` | `{ message }` |

---

## How to Run

### Prerequisites

- Node.js v18+
- npm

### Step 1: Backend

```bash
cd backend
npm install
npm start
```

Server starts on **http://localhost:5000**

### Step 2: Frontend

```bash
cd frontend
npm install
npm run dev
```

Dev server on **http://localhost:3000** (proxies /api to backend)

### Step 3: Use

Open **http://localhost:3000**, enter an Applicant ID (e.g. `APP-2024-001`), select document type, drag or pick a file, and click Upload.

---

## Integration (Mount Into Another App)

### Backend (3 lines):

```js
const docUpload = require('./backend');
app.use('/api/documents', docUpload.createModule());
app.use(docUpload.errorHandler);
```

### Frontend:

```jsx
import { DocumentUpload, DocumentList, createApiClient, useDocuments } from './frontend/src/index';
import './frontend/src/App.css';

const api = createApiClient('/api/documents');
// ... use components as needed
```

See `examples/` folder for complete integration demos.

---

## Key Design Decisions

1. **sql.js (pure JS SQLite)** — avoids native compilation; database persists as a single file
2. **Memory storage + manual write** — lets us validate body fields before writing file to correct `{applicant}/{type}/` folder
3. **Scoped CSS (`doc-*` prefix)** — prevents style conflicts when embedded in existing portals
4. **Backend layered architecture** — each concern is testable independently (controller, service, repository)
5. **apiClient factory pattern** — the frontend can point to any backend URL; swap endpoints with one config change
6. **Config driven by env vars** — port, upload dir, CORS origins, max size — all overridable without code changes

---

## Tools & Technologies

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v24.18.0 | Runtime |
| Express | 4.21 | HTTP server + routing |
| React | 19.0 | UI library |
| Vite | 6.4 | Build tool + dev server |
| SQLite (sql.js) | 1.11 | Embedded database |
| Multer | 1.4.5 | File upload handling |
| Git | — | Version control |
| GitHub | — | Repository hosting |

---

## Challenges Faced

1. **No Python available for native modules** — `better-sqlite3` requires node-gyp + Python. Switched to `sql.js` (pure JS implementation).
2. **Windows PowerShell restrictions** — execution policy blocked npm scripts; used full paths to npm.cmd. JSON quoting in curl required workarounds.
3. **Multer body parsing order** — `req.body` fields are populated after file processing in diskStorage; switched to memoryStorage + manual file save to ensure validation before disk I/O.
4. **CORS for cross-origin embedding** — added configurable CORS origins via env var so the API works when embedded in other domains.

---

## Screenshots

*(Insert browser screenshots here. Recommended: upload form with file selected, document list showing uploaded files with status badges, error state showing validation message.)*

---

## Video Demo

*(Link to 5-15 min explanation video — cover architecture, challenges, tools used, and a live walkthrough)*
