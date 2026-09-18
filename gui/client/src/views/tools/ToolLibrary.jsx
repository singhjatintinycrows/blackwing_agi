import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { TOOL_TYPES } from '../../lib/constants';

export function ToolLibrary() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'scanner', description: '' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/tools')
      .then(setTools)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const tool = await api.post('/api/tools', form);
      setTools(prev => [...prev, tool]);
      setShowAdd(false);
      setForm({ name: '', type: 'scanner', description: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="dw-page-body"><p>Loading…</p></div>;

  return (
    <div className="dw-page-body">
      <div className="dw-page-head dw-page-head--row">
        <h1>Tool Library</h1>
        {user?.role === 'admin' && (
          <button type="button" className="dw-btn dw-btn--primary" onClick={() => setShowAdd(s => !s)}>
            {showAdd ? 'Cancel' : 'Register Tool'}
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="dw-inline-form">
          <div className="dw-grid">
            <label>
              <span className="dw-label">Name</span>
              <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </label>
            <label>
              <span className="dw-label">Type</span>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="dw-grid__full">
              <span className="dw-label">Description</span>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </label>
          </div>
          {error && <p className="dw-error">{error}</p>}
          <button type="submit" className="dw-btn dw-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Add Tool'}
          </button>
        </form>
      )}

      {error && !showAdd && <p className="dw-error">{error}</p>}

      {tools.length === 0 ? (
        <p className="dw-table-empty">No tools registered.</p>
      ) : (
        <div className="dw-tool-grid">
          {tools.map(tool => (
            <div key={tool.id} className="dw-tool-card" onClick={() => navigate(`/tools/${tool.id}`)}>
              <div className="dw-tool-card__type">{tool.type || 'custom'}</div>
              <h3 className="dw-tool-card__name">{tool.name}</h3>
              {tool.description && <p className="dw-tool-card__desc">{tool.description}</p>}
              <span className="dw-tool-card__date">Added {tool.created_at ? new Date(tool.created_at).toLocaleDateString() : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
