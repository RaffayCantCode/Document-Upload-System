export function createApiClient(baseUrl = '/api/documents') {
  const api = baseUrl.replace(/\/+$/, '');

  async function upload(file, applicantId, documentType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicant_id', applicantId);
    formData.append('document_type', documentType);

    const res = await fetch(`${api}/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  }

  async function list(applicantId) {
    const params = applicantId ? `?applicant_id=${encodeURIComponent(applicantId)}` : '';
    const res = await fetch(`${api}/${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch documents');
    return data.documents || [];
  }

  async function get(id) {
    const res = await fetch(`${api}/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Document not found');
    return data.document;
  }

  async function remove(id) {
    const res = await fetch(`${api}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed');
    return data;
  }

  async function updateStatus(id, status) {
    const res = await fetch(`${api}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Status update failed');
    return data;
  }

  function getDownloadUrl(id) {
    return `${api}/${id}/download`;
  }

  return { upload, list, get, remove, updateStatus, getDownloadUrl };
}
