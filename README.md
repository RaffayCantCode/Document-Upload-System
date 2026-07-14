# Document Upload System

A full-stack document upload module for the University Admissions Portal (SafeX Solutions).

**Developer:** Group 21 Member  
**Stack:** React (Vite) + Express.js + SQLite  
**Week:** 2 — Individual Contribution

---

## Features

- Upload transcripts, CNIC, and photos for university applicants
- File type validation (.pdf, .png, .jpg) — client + server side
- File size validation (max 10MB)
- Drag-and-drop file input
- View uploaded documents filtered by applicant ID
- Status tracking (pending / verified / rejected)
- Delete uploaded documents

---

## Project Structure

```
Document-Upload-System/
├── backend/
│   ├── server.js          # Express server & API routes
│   ├── db.js              # SQLite database (sql.js) init & helpers
│   ├── package.json
│   └── .env               # Port, upload dir, max file size
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── App.css        # Styles
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

---

## How to Run

### Prerequisites

- Node.js v18+ (tested on v24.18.0)
- npm

### 1. Backend

```bash
cd backend
npm install
npm start
```

Server runs on **http://localhost:5000**

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

App runs on **http://localhost:3000** (proxies `/api` requests to backend)

### 3. Open the App

Navigate to **http://localhost:3000** in your browser.

---

## API Endpoints

| Method | Endpoint                   | Description              |
|--------|----------------------------|--------------------------|
| POST   | `/api/upload`              | Upload a document        |
| GET    | `/api/documents`           | List documents (by applicant_id query param) |
| GET    | `/api/documents/:id`       | Get single document      |
| DELETE | `/api/documents/:id`       | Delete a document        |
| PATCH  | `/api/documents/:id/status`| Update document status   |

### Upload (POST `/api/upload`)

Form-data body:
- `file` — the file (PDF, PNG, JPG)
- `applicant_id` — string (e.g. `APP-2024-001`)
- `document_type` — one of: `transcript`, `cnic`, `photo`

---

## Database Schema

```sql
CREATE TABLE documents (
  id            TEXT PRIMARY KEY,
  applicant_id  TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('transcript','cnic','photo')),
  file_name     TEXT NOT NULL,
  stored_path   TEXT NOT NULL,
  file_size     INTEGER NOT NULL,
  mime_type     TEXT NOT NULL,
  uploaded_at   TEXT NOT NULL DEFAULT (datetime('now')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected'))
);
```

---

## Screenshots

*(Add screenshots of the running app here)*

---

## Tech Stack

- **Frontend:** React 19, Vite 6
- **Backend:** Express.js 4, Multer (file handling)
- **Database:** SQLite via sql.js (pure JS, no native compilation)
- **Validation:** Client-side (extension + size) + server-side (MIME + size + document type)

---

## Video Demonstration

*(Link to your 5-15 min explanation video)*
