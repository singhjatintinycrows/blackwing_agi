import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export function useAssessment() {
  const [runId, setRunId]     = useState(null);
  const [status, setStatus]   = useState('idle'); // idle | running | complete | error | aborted
  const [logLines, setLogLines] = useState([]);

  const start = useCallback(async (formData) => {
    setLogLines([]);
    setStatus('running');
    try {
      const { runId: id } = await api.post('/api/assessments', formData);
      setRunId(id);
      return id;
    } catch (err) {
      setStatus('error');
      throw err;
    }
  }, []);

  const abort = useCallback(async () => {
    if (!runId) return;
    await api.post(`/api/assessments/${runId}/abort`).catch(() => {});
    setStatus('aborted');
  }, [runId]);

  const appendLog = useCallback((line) => {
    setLogLines(prev => [...prev, line]);
  }, []);

  const complete = useCallback(() => setStatus('complete'), []);

  const reset = useCallback(() => {
    setRunId(null);
    setStatus('idle');
    setLogLines([]);
  }, []);

  return { runId, status, logLines, start, abort, appendLog, complete, reset };
}
