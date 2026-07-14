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

export default function DocumentList({
  documents = [],
  loading = false,
  error = '',
  onDelete,
  showStatusFilter = true,
  emptyMessage = 'No documents found.',
  className = '',
}) {
  const [statusFilter, setStatusFilter] = useState('all');

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
      {error && <div className="doc-alert doc-alert-error">{error}</div>}

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
        <div className="doc-empty">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="doc-empty">{emptyMessage}</div>
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
                  <td>{doc.file_name}</td>
                  <td>{formatSize(doc.file_size)}</td>
                  <td>{formatDate(doc.uploaded_at)}</td>
                  <td><span className={`doc-badge ${STATUS_CLASSES[doc.status] || 'doc-status-pending'}`}>{doc.status}</span></td>
                  <td>
                    <button className="doc-btn doc-btn-sm doc-btn-danger" onClick={() => handleDelete(doc.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
