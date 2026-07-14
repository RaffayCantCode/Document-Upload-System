# Document Upload System

A modular, pluggable document upload module for university admissions portals.

**Developer:** Group 21 Member  
**Stack:** React 19 + Express.js + SQLite  
**Week:** 2 — Individual Contribution (SafeX Solutions)

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Your Express App                    │
│  ┌───────────────────────────────────────────┐  │
│  │  /api/documents  ←── DocumentUpload Module │  │
│  │  ├── POST   /upload    Upload file         │  │
│  │  ├── GET    /          List documents      │  │
│  │  ├── GET    /:id       Get single document  │  │
│  │  ├── DELETE /:id       Delete document      │  │
│  │  └── PATCH  /:id/status Update status       │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  /uploads  ←── Static file serving         │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

Backend layers:   Router → Controller → Service → Repository → SQLite
Frontend modules: DocumentUpload + DocumentList → apiClient → Backend API
```

---

## Modular Integration

### Backend — Mount into any Express app

```js
const express = require('express');
const documentUpload = require('./backend');

async function main() {
  await documentUpload.initDatabase();

  const app = express();

  // Your existing routes
  app.get('/', (req, res) => res.send('My app'));

  // Mount the document upload module (1 line)
  app.use('/api/documents', documentUpload.createModule());
  app.use(documentUpload.errorHandler);

  app.listen(3000);
}
main();
```

The module respects these env vars:

| Variable         | Default    | Description                |
|------------------|------------|----------------------------|
| `PORT`           | `5000`     | Server port                |
| `UPLOAD_DIR`     | `uploads`  | File storage directory     |
| `DB_PATH`        | `database.sqlite` | SQLite file path   |
| `MAX_FILE_SIZE_MB` | `10`    | Max upload size in MB      |
| `CORS_ORIGINS`   | `*`        | Comma-separated origins    |

### Frontend — Use the React components anywhere

```jsx
import {
  DocumentUpload,
  DocumentList,
  createApiClient,
  useDocuments,
} from './frontend/src/index';
import './frontend/src/App.css';

function MyPortal() {
  const api = createApiClient('/api/documents');
  const [applicantId, setApplicantId] = useState('APP-2024-001');
  const { documents, loading, deleteDocument, refresh } = useDocuments(api, applicantId);

  return (
    <div>
      <h1>My Portal</h1>

      <DocumentUpload
        apiClient={api}
        applicantId={applicantId}
        onUploadSuccess={refresh}
        onUploadError={(err) => console.error(err)}
        maxFileSizeMB={10}
        documentTypes={[
          { value: 'transcript', label: 'Transcript' },
          { value: 'cnic', label: 'CNIC' },
          { value: 'photo', label: 'Photo' },
        ]}
      />

      <DocumentList
        documents={documents}
        loading={loading}
        onDelete={deleteDocument}
        showStatusFilter={true}
        emptyMessage="No documents uploaded yet."
      />
    </div>
  );
}
```

---

## Features

- **File validation** — type (.pdf, .png, .jpg) + size (configurable, default 10MB) on client and server
- **Drag & drop** upload with visual feedback
- **Document types** — transcripts, CNIC, photos (configurable)
- **Status tracking** — pending → verified / rejected
- **Filter & list** — filter by status, view upload date/size
- **CORS-ready** — configure allowed origins for cross-site embedding
- **Scoped CSS** — all classes prefixed with `doc-` to prevent collisions
- **Backend layers** — clean separation: routes → controllers → services → repository → db

---

## How to Run (Standalone)

### Prerequisites

- Node.js v18+

### 1. Backend

```bash
cd backend
npm install
npm start
```

Server runs on **http://localhost:5000**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on **http://localhost:3000** (proxies /api to backend)

### 3. Open

Navigate to **http://localhost:3000**

---

## API Reference

| Method | Endpoint                       | Description              |
|--------|--------------------------------|--------------------------|
| POST   | `/api/documents/upload`        | Upload a file            |
| GET    | `/api/documents?applicant_id=` | List documents           |
| GET    | `/api/documents/:id`           | Get document             |
| DELETE | `/api/documents/:id`           | Delete document          |
| PATCH  | `/api/documents/:id/status`    | Update status            |

### POST /upload

Multipart form-data:
- `file` — the file (PDF, PNG, JPG)
- `applicant_id` — string
- `document_type` — `transcript`, `cnic`, or `photo`

### PATCH /:id/status

```json
{ "status": "verified" }
```

Valid statuses: `pending`, `verified`, `rejected`

---

## Database Schema

```sql
CREATE TABLE documents (
  id            TEXT PRIMARY KEY,
  applicant_id  TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK(...),
  file_name     TEXT NOT NULL,
  stored_path   TEXT NOT NULL,
  file_size     INTEGER NOT NULL,
  mime_type     TEXT NOT NULL,
  uploaded_at   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK(...)
);
```

---

## Project Structure

```
Document-Upload-System/
├── backend/
│   ├── config/
│   │   ├── index.js          # Config loader (env vars)
│   │   └── db.js             # SQLite init & persistence
│   ├── middleware/
│   │   ├── upload.js          # Multer file validation
│   │   └── errorHandler.js    # Global error handler
│   ├── routes/
│   │   └── documents.js       # API route definitions
│   ├── controllers/
│   │   └── documentController.js  # Request handlers
│   ├── services/
│   │   └── documentService.js     # Business logic
│   ├── db/
│   │   └── documentRepository.js  # DB queries
│   ├── index.js               # Module factory (for integration)
│   ├── server.js              # Standalone launcher
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DocumentUpload.jsx  # Reusable upload widget
│   │   │   └── DocumentList.jsx    # Reusable list widget
│   │   ├── hooks/
│   │   │   └── useDocuments.js     # API hook
│   │   ├── api.js                  # API client factory
│   │   ├── App.jsx                 # Demo app
│   │   ├── main.jsx                # Entry point
│   │   ├── index.js                # Public exports
│   │   └── App.css                 # Scoped styles (doc-*)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── examples/
│   ├── integration-backend.js      # Backend mount demo
│   └── integration-frontend.jsx    # Frontend component demo
├── .gitignore
└── README.md
```

---

## Screenshots

*(Add screenshots of the running app here)*

---

## Video Demonstration

*(Link to 5-15 min explanation video — architecture, challenges, tools, working demo)*

---

## Submission Checklist

- [x] Source code
- [x] README with setup instructions
- [x] API documentation
- [ ] Screenshots / recording
- [ ] Explanation video (5-15 min, HD, face visible)
- [ ] Push to GitHub
- [ ] Submit individual feedback on Group Leader
