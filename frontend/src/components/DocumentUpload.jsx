import React, { useState, useRef, useCallback, useEffect } from 'react';

const DEFAULT_DOC_TYPES = [
  { value: 'transcript', label: 'Transcript' },
  { value: 'cnic', label: 'CNIC' },
  { value: 'photo', label: 'Photo' },
];

const ALL_DOC_VALUES = DEFAULT_DOC_TYPES.map((t) => t.value);

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PreUploadPreview({ file, onClose }) {
  const [loaded, setLoaded] = useState(false);
  const isImage = file.type.startsWith('image/');
  const objectUrl = useRef(null);

  if (!objectUrl.current) {
    objectUrl.current = URL.createObjectURL(file);
  }

  const handleClose = useCallback(() => {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
    onClose();
  }, [onClose]);

  return (
    <div className="doc-modal-overlay" onClick={handleClose}>
      <div className="doc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="doc-modal-header">
          <span className="doc-modal-title">{file.name}</span>
          <button className="doc-modal-close" onClick={handleClose}>&times;</button>
        </div>
        <div className="doc-modal-body">
          {isImage ? (
            <div className="doc-preview-image-wrap">
              {!loaded && <div className="doc-spinner"><div className="doc-spinner-ring" /><span>Loading preview...</span></div>}
              <img
                src={objectUrl.current}
                alt={file.name}
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
              <p>PDF preview not available before upload.</p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '-8px' }}>Upload the file first, then use the preview feature in the document list.</p>
            </div>
          )}
        </div>
        <div className="doc-modal-footer">
          <span className="doc-modal-meta">{formatSize(file.size)} &middot; {file.type || 'unknown type'}</span>
        </div>
      </div>
    </div>
  );
}

export default function DocumentUpload({
  apiClient,
  applicantId,
  uploadedDocTypes = [],
  documentTypes = DEFAULT_DOC_TYPES,
  maxFileSizeMB = 1,
  allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'],
  onUploadSuccess,
  onUploadError,
  className = '',
}) {
  const availableDocTypes = documentTypes;
  const allSubmitted = false;

  const [fullName, setFullName] = useState('');
  const [docType, setDocType] = useState(availableDocTypes[0]?.value || 'transcript');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
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
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const result = await apiClient.upload(file, applicantId, fullName, docType);
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
      {allSubmitted ? (
        <div className="doc-all-submitted">
          <div className="doc-all-submitted-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>All documents submitted</h3>
          <p>Transcript, CNIC, and Photo have all been uploaded. Delete a document below to upload a replacement.</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="doc-alert doc-alert-error">
              <span className="doc-alert-icon"><XIcon /></span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="doc-alert doc-alert-success">
              <span className="doc-alert-icon"><CheckIcon /></span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="doc-form-row">
              <label className="doc-label">
                Full Name
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. John Doe" className="doc-input" />
              </label>
            </div>
            <div className="doc-form-row">
              <label className="doc-label">
                Document Type
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="doc-select">
                  {availableDocTypes.map((t) => (
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
              onClick={() => !file && fileInputRef.current?.click()}
            >
              {file ? (
                <div className="doc-file-selected">
                  <span className="doc-file-icon"><FileIcon /></span>
                  <div className="doc-file-info">
                    <span className="doc-file-name">{file.name}</span>
                    <span className="doc-file-size">{formatSize(file.size)}</span>
                  </div>
                  <button
                    type="button"
                    className="doc-btn doc-btn-sm doc-btn-preview"
                    onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                    title="Preview file"
                  >
                    <EyeIcon /> Preview
                  </button>
                  <button
                    type="button"
                    className="doc-btn doc-btn-sm doc-btn-remove"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setError(''); }}
                    title="Remove file"
                  >
                    <XIcon /> Remove
                  </button>
                </div>
              ) : (
                <div className="doc-drop-text">
                  <div className="doc-drop-icon"><UploadIcon /></div>
                  <p>Drag & drop your file here, or click to browse</p>
                  <small>Allowed: {allowedExtensions.join(', ').toUpperCase()} — Max {maxFileSizeMB}MB</small>
                  <div className="doc-dropzone-size">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10h-10V2z" />
                      <path d="M12 12 9.5 9.5" />
                      <path d="M12 7.5V12" />
                    </svg>
                    Most transcripts, CNICs, and photos are under 500KB — 1MB limit is generous
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" onChange={handleChange} hidden accept=".pdf,.png,.jpg,.jpeg" />
            </div>

            {uploading && (
              <div className="doc-progress-bar">
                <div className="doc-progress-fill" style={{ width: '60%' }} />
              </div>
            )}

            <button type="submit" className="doc-btn doc-btn-primary" disabled={uploading || !file}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>

          {previewFile && (
            <PreUploadPreview file={previewFile} onClose={() => setPreviewFile(null)} />
          )}
        </>
      )}
    </div>
  );
}
