import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { TOOL_TYPES } from '../../lib/constants';

export function ToolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tool, setTool]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api.get(`/api/tools/${id}`)
      .then(t => { setTool(t); setForm({ name: t.name, type: t.type || '', description: t.description || '', config_json: t.config_json || '' }); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.patch(`/api/tools/${id}`, form);
      setTool(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete tool "${tool.name}"?`)) return;
    try {
      await api.delete(`/api/tools/${id}`);
      navigate('/tools');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="dw-page-body"><p>Loading…</p></div>;
  if (error && !tool) return <div className="dw-page-body"><p className="dw-error">{error}</p></div>;
  if (!tool) return null;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="dw-page-body">
      <div className="dw-page-head dw-page-head--row">
        <div>
          <button type="button" className="dw-back-btn" onClick={() => navigate(-1)}>← Tools</button>
          <h1>{tool.name}</h1>
          {tool.type && <span className="dw-meta-chip">{tool.type}</span>}
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="dw-btn dw-btn--ghost" onClick={() => setEditing(e => !e)}>
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button type="button" className="dw-btn dw-btn--danger" onClick={handleDelete}>Delete</button>
          </div>
        )}
      </div>

      {editing ? (
        <section className="dw-detail-section">
          <div className="dw-grid">
            <label>
              <span className="dw-label">Name</span>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </label>
            <label>
              <span className="dw-label">Type</span>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="dw-grid__full">
              <span className="dw-label">Description</span>
              <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </label>
            <label className="dw-grid__full">
              <span className="dw-label">Config JSON</span>
              <textarea rows={5} className="mono" value={form.config_json} onChange={e => setForm(f => ({ ...f, config_json: e.target.value }))} placeholder="{}" />
            </label>
          </div>
          {error && <p className="dw-error">{error}</p>}
          <button type="button" className="dw-btn dw-btn--primary" disabled={saving} onClick={handleSave} style={{ marginTop: 12 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </section>
      ) : (
        <>
          {tool.description && (
            <section className="dw-detail-section">
              <h2>Description</h2>
              <p>{tool.description}</p>
            </section>
          )}
          {tool.config_json && (
            <section className="dw-detail-section">
              <h2>Configuration</h2>
              <pre className="dw-raw-log">{tool.config_json}</pre>
            </section>
          )}
          <section className="dw-detail-section">
            <h2>Metadata</h2>
            <dl className="dw-dl">
              <dt>Registered</dt><dd>{tool.created_at ? new Date(tool.created_at).toLocaleString() : '—'}</dd>
            </dl>
          </section>
        </>
      )}
    </div>
  );
}
