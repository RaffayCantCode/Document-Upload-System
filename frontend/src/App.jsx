import React, { useState, useEffect, useCallback } from 'react';

const API = '/api';
const DOC_TYPES = [
  { value: 'transcript', label: 'Transcript' },
  { value: 'cnic', label: 'CNIC' },
  { value: 'photo', label: 'Photo' },
];
const MAX_SIZE_MB = 10;
const ALLOWED_EXTS = ['pdf', 'png', 'jpg', 'jpeg'];

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function App() {
  const [applicantId, setApplicantId] = useState('');
  const [docType, setDocType] = useState('transcript');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDocuments = useCallback(async () => {
    if (!applicantId.trim()) return;
    try {
      const res = await fetch(`${API}/documents?applicant_id=${encodeURIComponent(applicantId.trim())}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      setDocuments([]);
    }
  }, [applicantId]);

  useEffect(() => {
    if (applicantId.trim()) {
      fetchDocuments();
    } else {
      setDocuments([]);
    }
  }, [applicantId, fetchDocuments]);

  const validateFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return 'Invalid file type. Allowed: PDF, PNG, JPG';
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Max size: ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      e.target.value = '';
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!applicantId.trim()) {
      setError('Please enter an Applicant ID');
      return;
    }
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicant_id', applicantId.trim());
    formData.append('document_type', docType);

    setLoading(true);
    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
      } else {
        setSuccess(`${data.document.document_type} uploaded successfully`);
        setFile(null);
        document.getElementById('file-input').value = '';
        fetchDocuments();
      }
    } catch {
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      const res = await fetch(`${API}/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('Document deleted');
        fetchDocuments();
      }
    } catch {
      setError('Failed to delete');
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'verified': return 'status-verified';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  const filteredDocs = statusFilter === 'all'
    ? documents
    : documents.filter((d) => d.status === statusFilter);

  return (
    <div className="container">
      <header>
        <h1>Document Upload System</h1>
        <p>University Admissions Portal - SafeX Solutions</p>
      </header>

      <section className="upload-section">
        <h2>Upload Document</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleUpload}>
          <div className="form-row">
            <label>
              Applicant ID
              <input
                type="text"
                value={applicantId}
                onChange={(e) => setApplicantId(e.target.value)}
                placeholder="e.g. APP-2024-001"
                required
              />
            </label>
            <label>
              Document Type
              <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('file-input').click()}
          >
            {file ? (
              <div className="file-selected">
                <span className="file-icon">&#128196;</span>
                <span>{file.name}</span>
                <span className="file-size">{formatSize(file.size)}</span>
              </div>
            ) : (
              <div className="drop-text">
                <span className="upload-icon">&#11014;&#65039;</span>
                <p>Drag & drop a file here, or click to browse</p>
                <small>PDF, PNG, JPG up to {MAX_SIZE_MB}MB</small>
              </div>
            )}
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg"
              hidden
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !file}>
            {loading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </section>

      <section className="documents-section">
        <h2>Uploaded Documents</h2>
        <div className="filter-bar">
          <label>
            Filter by status:
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <span className="doc-count">{filteredDocs.length} document(s)</span>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="empty-state">
            {applicantId.trim() ? 'No documents found for this applicant.' : 'Enter an Applicant ID to view documents.'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>File Name</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td><span className="doc-type-badge">{doc.document_type}</span></td>
                    <td>{doc.file_name}</td>
                    <td>{formatSize(doc.file_size)}</td>
                    <td>{formatDate(doc.uploaded_at)}</td>
                    <td><span className={`status-badge ${getStatusClass(doc.status)}`}>{doc.status}</span></td>
                    <td className="actions">
                      <button className="btn btn-sm" onClick={() => handleDelete(doc.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
