import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { DataTable } from '../../components/ui/DataTable';
import { SeverityBadge, StatusBadge } from '../../components/ui/Badge';
import { SEVERITY_LEVELS, STATUS_OPTIONS } from '../../lib/constants';

function countBy(findings, field, value) {
  return findings.filter(f => f[field] === value).length;
}

export function VulnDashboard() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ severity: '', status: '' });
  const navigate = useNavigate();

  const query = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v)
  ).toString();

  useEffect(() => {
    setLoading(true);
    api.get(`/api/vulns${query ? '?' + query : ''}`)
      .then(setFindings)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [query]);

  const columns = [
    { key: 'severity',  label: 'Severity',    width: 100, render: v => <SeverityBadge severity={v} /> },
    { key: 'category',  label: 'Category',    width: 110, render: v => v || '—' },
    { key: 'title',     label: 'Finding' },
    { key: 'app_name',  label: 'Application', width: 160, render: v => v || '—' },
    { key: 'status',    label: 'Status',      width: 110, render: v => <StatusBadge status={v} /> },
    { key: 'created_at',label: 'Date',        width: 140, render: v => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  const allFindings = findings;

  if (error) return <div className="dw-page-body"><p className="dw-error">{error}</p></div>;

  return (
    <div className="dw-page-body">
      <div className="dw-page-head">
        <h1>Vulnerabilities</h1>
      </div>

      {/* Summary cards */}
      <div className="dw-summary-cards">
        <div className="dw-card dw-card--critical">
          <span className="dw-card__count">{countBy(allFindings, 'severity', 'critical')}</span>
          <span className="dw-card__label">Critical</span>
        </div>
        <div className="dw-card dw-card--high">
          <span className="dw-card__count">{countBy(allFindings, 'severity', 'high')}</span>
          <span className="dw-card__label">High</span>
        </div>
        <div className="dw-card dw-card--medium">
          <span className="dw-card__count">{countBy(allFindings, 'severity', 'medium')}</span>
          <span className="dw-card__label">Medium</span>
        </div>
        <div className="dw-card dw-card--low">
          <span className="dw-card__count">{countBy(allFindings, 'severity', 'low')}</span>
          <span className="dw-card__label">Low</span>
        </div>
        <div className="dw-card dw-card--open">
          <span className="dw-card__count">{countBy(allFindings, 'status', 'open')}</span>
          <span className="dw-card__label">Open</span>
        </div>
        <div className="dw-card dw-card--remediated">
          <span className="dw-card__count">{countBy(allFindings, 'status', 'remediated')}</span>
          <span className="dw-card__label">Remediated</span>
        </div>
      </div>

      {/* Filters */}
      <div className="dw-filters">
        <select
          value={filters.severity}
          onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
        >
          <option value="">All severities</option>
          {SEVERITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={findings}
          onRowClick={row => navigate(`/vulns/${row.id}`)}
          emptyMessage="No findings match the current filters."
        />
      )}
    </div>
  );
}
