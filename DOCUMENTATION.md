# Document Upload System

A document upload tool for the University Admissions Portal. Built by Group 21.

---

## What It Does

Lets applicants upload **transcripts**, **CNIC**, and **photos** for their admission application. Checks that files are the right type (PDF, PNG, JPG) and not too big (max 10MB).

---

## How It Works

**Frontend** (React) → User picks a file and clicks Upload → **Backend** (Express) → Saves file to disk + stores info in **SQLite database**

Simple flow:
1. User enters their Applicant ID
2. Selects document type (Transcript / CNIC / Photo)
3. Drops or picks a file
4. Clicks Upload
5. File gets validated (type + size), saved, and shows up in the document list

---

## How to Run

### Prerequisites
- Node.js installed

### 1. Start the Backend
```
cd backend
npm install
npm start
```
Runs on `http://localhost:5000`

### 2. Start the Frontend
```
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:3000`

### 3. Use It
Open `http://localhost:3000`, type an Applicant ID like `APP-2024-001`, pick a file, and upload.

---

## API Endpoints

| What | How | Endpoint |
|------|-----|----------|
| Upload a file | POST | `/api/documents/upload` |
| List documents | GET | `/api/documents?applicant_id=...` |
| Get one document | GET | `/api/documents/:id` |
| Delete a document | DELETE | `/api/documents/:id` |
| Update status | PATCH | `/api/documents/:id/status` |

---

## Technologies Used

- **Frontend:** React, Vite
- **Backend:** Node.js, Express
- **Database:** SQLite
- **File handling:** Multer
- **Version control:** Git + GitHub

---

## Challenges

- Python wasn't available on the machine, so native SQLite libraries wouldn't install. Used `sql.js` (a JavaScript-only SQLite) instead.
- The machine had restricted PowerShell settings. Used full paths to run commands.
- Made the module easy to plug into other apps by using scoped CSS and a configurable API client.

---

## Screenshots

*(Add screenshots here)*

## Video Demo

*(Link to video)*
