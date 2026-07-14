import React, { useState } from 'react';
import { createApiClient } from './api';
import { useDocuments } from './hooks/useDocuments';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';

const apiClient = createApiClient('/api/documents');

export default function App() {
  const [applicantId, setApplicantId] = useState('');
  const { documents, loading, error: listError, deleteDocument, refresh } = useDocuments(apiClient, applicantId);

  return (
    <div className="doc-container">
      <header className="doc-header">
        <h1>Document Upload System</h1>
        <p>University Admissions Portal — SafeX Solutions</p>
        <div className="doc-badge-line">
          <span>Transcript</span>
          <span>CNIC</span>
          <span>Photo</span>
          <span>PDF / PNG / JPG</span>
          <span>Max 10MB</span>
        </div>
      </header>

      <section className="doc-section">
        <h2 className="doc-section-title">Upload Document</h2>
        <div className="doc-form-row">
          <label className="doc-label">
            Applicant ID
            <input
              type="text"
              value={applicantId}
              onChange={(e) => setApplicantId(e.target.value)}
              placeholder="e.g. APP-2024-001"
              className="doc-input"
            />
          </label>
        </div>

        <DocumentUpload
          apiClient={apiClient}
          applicantId={applicantId}
          onUploadSuccess={refresh}
        />
      </section>

      <section className="doc-section">
        <h2 className="doc-section-title">Uploaded Documents</h2>
        <DocumentList
          documents={documents}
          loading={loading}
          error={listError}
          onDelete={deleteDocument}
          getDownloadUrl={apiClient.getDownloadUrl}
          emptyMessage={applicantId ? 'No documents found for this applicant.' : 'Enter an Applicant ID to view documents.'}
        />
      </section>
    </div>
  );
}
