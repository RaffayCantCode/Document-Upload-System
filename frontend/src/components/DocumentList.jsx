import React, { useState } from 'react';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_CLASSES = {
  pending: 'doc-status-pending',
  verified: 'doc-status-verified',
  rejected: 'doc-status-rejected',
};

const PREVIEW_TYPES = ['image/png', 'image/jpeg'];

function Spinner() {
  return (
    <div className="doc-spinner">
      <div className="doc-spinner-ring" />
      <span>Loading documents...</span>
    </div>
  );
}

function EmptyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function PreviewModal({ doc, downloadUrl, onClose }) {
  const [loaded, setLoaded] = useState(false);
  const isImage = PREVIEW_TYPES.includes(doc.mime_type);

  return (
    <div className="doc-modal-overlay" onClick={onClose}>
      <div className="doc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="doc-modal-header">
          <span className="doc-modal-title">{doc.file_name}</span>
          <button className="doc-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="doc-modal-body">
          {isImage ? (
            <div className="doc-preview-image-wrap">
              {!loaded && <div className="doc-spinner"><div className="doc-spinner-ring" /><span>Loading preview...</span></div>}
              <img
                src={downloadUrl}
                alt={doc.file_name}
                onLoad={() => setLoaded(true)}
                className={`doc-preview-image ${loaded ? 'doc-preview-loaded' : ''}`}
              />
            </div>
          ) : (
            <div className="doc-preview-pdf">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <p>PDF preview not available inline.</p>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="doc-btn doc-btn-primary" style={{ width: 'auto' }}>
                Open in new tab
              </a>
            </div>
          )}
        </div>
        <div className="doc-modal-footer">
          <span className="doc-modal-meta">{doc.document_type} &middot; {formatSize(doc.file_size)} &middot; {formatDate(doc.uploaded_at)}</span>
          <a href={downloadUrl} className="doc-btn doc-btn-sm doc-btn-download" download>Download</a>
        </div>
      </div>
    </div>
  );
}

export default function DocumentList({
  documents = [],
  loading = false,
  error = '',
  onDelete,
  getDownloadUrl,
  showStatusFilter = true,
  emptyMessage = 'No documents found.',
  className = '',
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewDoc, setPreviewDoc] = useState(null);

  const filtered = statusFilter === 'all'
    ? documents
    : documents.filter((d) => d.status === statusFilter);

  const handleDelete = (id) => {
    if (window.confirm('Delete this document?')) {
      if (onDelete) onDelete(id);
    }
  };

  return (
    <div className={`doc-list-module ${className}`}>
      {error && (
        <div className="doc-alert doc-alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="doc-filter-bar">
        {showStatusFilter && documents.length > 0 && (
          <label className="doc-label doc-filter-label">
            Filter:
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="doc-select doc-select-sm">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
        )}
        <span className="doc-count">{documents.length} document(s)</span>
      </div>

      {loading ? (
        <Spinner />
      ) : documents.length === 0 ? (
        <div className="doc-empty">
          <div className="doc-empty-icon"><EmptyIcon /></div>
          {emptyMessage}
        </div>
      ) : (
        <div className="doc-table-wrap">
          <table className="doc-table">
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
              {filtered.map((doc) => (
                <tr key={doc.id}>
                  <td><span className="doc-badge doc-type-badge">{doc.document_type}</span></td>
                  <td>
                    <button className="doc-file-link" onClick={() => setPreviewDoc(doc)} title="Click to preview">
                      {doc.file_name}
                    </button>
                  </td>
                  <td>{formatSize(doc.file_size)}</td>
                  <td>{formatDate(doc.uploaded_at)}</td>
                  <td><span className={`doc-badge ${STATUS_CLASSES[doc.status] || 'doc-status-pending'}`}>{doc.status}</span></td>
                  <td className="doc-actions">
                    <button className="doc-btn doc-btn-sm doc-btn-outline" onClick={() => setPreviewDoc(doc)}>Preview</button>
                    {getDownloadUrl && (
                      <a href={getDownloadUrl(doc.id)} className="doc-btn doc-btn-sm doc-btn-download" download>Download</a>
                    )}
                    <button className="doc-btn doc-btn-sm doc-btn-danger" onClick={() => handleDelete(doc.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewDoc && getDownloadUrl && (
        <PreviewModal
          doc={previewDoc}
          downloadUrl={getDownloadUrl(previewDoc.id)}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
