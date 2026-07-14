/**
 * Example: Use the Document Upload components in any React app.
 *
 *   import { DocumentUpload, DocumentList, createApiClient, useDocuments } from '../frontend/src/index';
 *   import '../frontend/src/App.css';
 *
 *   function MyApp() {
 *     const api = createApiClient('https://my-api.com/api/documents');
 *     const [applicantId, setApplicantId] = useState('APP-2024-001');
 *     const { documents, loading, deleteDocument, refresh } = useDocuments(api, applicantId);
 *
 *     return (
 *       <div>
 *         <h1>My Admissions Portal</h1>
 *
 *         <DocumentUpload
 *           apiClient={api}
 *           applicantId={applicantId}
 *           onUploadSuccess={refresh}
 *           maxFileSizeMB={5}
 *         />
 *
 *         <DocumentList
 *           documents={documents}
 *           loading={loading}
 *           onDelete={deleteDocument}
 *         />
 *       </div>
 *     );
 *   }
 */

import React, { useState } from 'react';
import { DocumentUpload, DocumentList, createApiClient, useDocuments } from '../frontend/src/index';
import '../frontend/src/App.css';

const api = createApiClient('/api/documents');

export default function IntegrationDemo() {
  const [applicantId, setApplicantId] = useState('APP-2024-001');
  const { documents, loading, error, deleteDocument, refresh } = useDocuments(api, applicantId);

  return (
    <div>
      <h1>Admissions Portal — Document Upload</h1>
      <input
        type="text"
        value={applicantId}
        onChange={(e) => setApplicantId(e.target.value)}
        placeholder="Applicant ID"
      />

      <DocumentUpload
        apiClient={api}
        applicantId={applicantId}
        onUploadSuccess={refresh}
      />

      <DocumentList
        documents={documents}
        loading={loading}
        error={error}
        onDelete={deleteDocument}
      />
    </div>
  );
}
