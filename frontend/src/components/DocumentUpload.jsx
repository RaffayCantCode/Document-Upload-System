import React, { useState, useRef } from 'react';

const DEFAULT_DOC_TYPES = [
  { value: 'transcript', label: 'Transcript' },
  { value: 'cnic', label: 'CNIC' },
  { value: 'photo', label: 'Photo' },
];

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function DocumentUpload({
  apiClient,
  applicantId,
  documentTypes = DEFAULT_DOC_TYPES,
  maxFileSizeMB = 10,
  allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'],
  onUploadSuccess,
  onUploadError,
  className = '',
}) {
  const [docType, setDocType] = useState(documentTypes[0]?.value || 'transcript');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return `Invalid file type (.${ext}). Allowed: ${allowedExtensions.join(', ').toUpperCase()}`;
    }
    if (f.size > maxFileSizeMB * 1024 * 1024) {
      return `File too large. Max size: ${maxFileSizeMB}MB`;
    }
    return null;
  };

  const handleFileSelect = (f) => {
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

  const handleChange = (e) => {
    handleFileSelect(e.target.files[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!applicantId) {
      setError('Applicant ID is required');
      return;
    }
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const result = await apiClient.upload(file, applicantId, docType);
      setSuccess(`${result.document.document_type} uploaded successfully`);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess(result.document);
    } catch (err) {
      setError(err.message);
      if (onUploadError) onUploadError(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`doc-upload-module ${className}`}>
      {error && <div className="doc-alert doc-alert-error">{error}</div>}
      {success && <div className="doc-alert doc-alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="doc-form-row">
          <label className="doc-label">
            Document Type
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="doc-select">
              {documentTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div
          className={`doc-dropzone ${dragOver ? 'doc-dropzone-active' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <div className="doc-file-selected">
              <span className="doc-file-icon">&#128196;</span>
              <span>{file.name}</span>
              <span className="doc-file-size">{formatSize(file.size)}</span>
            </div>
          ) : (
            <div className="doc-drop-text">
              <span className="doc-upload-icon">&#11014;&#65039;</span>
              <p>Drag & drop a file here, or click to browse</p>
              <small>Allowed: {allowedExtensions.join(', ').toUpperCase()} — Max {maxFileSizeMB}MB</small>
            </div>
          )}
          <input ref={fileInputRef} type="file" onChange={handleChange} hidden accept=".pdf,.png,.jpg,.jpeg" />
        </div>

        <button type="submit" className="doc-btn doc-btn-primary" disabled={uploading || !file}>
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
    </div>
  );
}
