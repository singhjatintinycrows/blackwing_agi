import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { SeverityBadge, StatusBadge } from '../../components/ui/Badge';
import { STATUS_OPTIONS } from '../../lib/constants';

export function VulnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [finding, setFinding] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [status, setStatus]     = useState('');
  const [remediation, setRemediation] = useState('');

  useEffect(() => {
    api.get(`/api/vulns/${id}`)
      .then(f => {
        setFinding(f);
        setStatus(f.status);
        setRemediation(f.remediation || '');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.patch(`/api/vulns/${id}`, { status, remediation });
      setFinding(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="dw-page-body"><p>Loading…</p></div>;
  if (error)   return <div className="dw-page-body"><p className="dw-error">{error}</p></div>;
  if (!finding) return null;

  const dirty = status !== finding.status || remediation !== (finding.remediation || '');

  return (
    <div className="dw-page-body">
      <div className="dw-page-head">
        <button type="button" className="dw-back-btn" onClick={() => navigate(-1)}>← Vulnerabilities</button>
        <h1>{finding.title}</h1>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <SeverityBadge severity={finding.severity} />
          {finding.category && <span className="dw-meta-chip">{finding.category}</span>}
        </div>
        {finding.app_name && <p className="dw-page-head__sub">{finding.app_name} — {finding.target}</p>}
      </div>

      <section className="dw-detail-section">
        <h2>Description</h2>
        <p>{finding.description || finding.title}</p>
      </section>

      <section className="dw-detail-section">
        <h2>Remediation</h2>
        <div className="dw-field">
          <label className="dw-label" htmlFor="status-select">Status</label>
          <select
            id="status-select"
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{ maxWidth: 220 }}
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="dw-field" style={{ marginTop: 12 }}>
          <label className="dw-label" htmlFor="remediation-notes">Notes</label>
          <textarea
            id="remediation-notes"
            rows={5}
            value={remediation}
            onChange={e => setRemediation(e.target.value)}
            placeholder="Document remediation steps or rationale…"
          />
        </div>
        {error && <p className="dw-error">{error}</p>}
        <button
          type="button"
          className="dw-btn dw-btn--primary"
          disabled={!dirty || saving}
          onClick={handleSave}
          style={{ marginTop: 12 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </section>

      <section className="dw-detail-section">
        <h2>Metadata</h2>
        <dl className="dw-dl">
          <dt>First seen</dt><dd>{finding.created_at ? new Date(finding.created_at).toLocaleString() : '—'}</dd>
          <dt>Last updated</dt><dd>{finding.updated_at ? new Date(finding.updated_at).toLocaleString() : '—'}</dd>
          <dt>Assessment</dt><dd>{finding.run_id || '—'}</dd>
        </dl>
      </section>
    </div>
  );
}
