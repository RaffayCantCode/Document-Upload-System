import { useState, useEffect, useCallback } from 'react';

export function useDocuments(apiClient, applicantId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDocuments = useCallback(async () => {
    if (!applicantId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const docs = await apiClient.list(applicantId);
      setDocuments(docs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiClient, applicantId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const deleteDocument = async (id) => {
    setError('');
    try {
      await apiClient.remove(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const refresh = fetchDocuments;

  return { documents, loading, error, deleteDocument, refresh, setError };
}
