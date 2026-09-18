import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { DataTable } from '../../components/ui/DataTable';
import { SeverityBadge } from '../../components/ui/Badge';

export function ReportList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/reports')
      .then(setReports)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'title',         label: 'Report',       render: (v, row) => (
        <span>
          <strong>{v || 'Untitled'}</strong>
          {row.target && <span className="dw-table__sub">{row.target}</span>}
        </span>
      )
    },
    { key: 'app_name',      label: 'Application',  render: v => v || '—' },
    { key: 'finding_count', label: 'Findings',     width: 90, render: v => v ?? 0 },
    { key: 'created_at',    label: 'Date',         width: 160, render: v => v ? new Date(v).toLocaleString() : '—' },
    { key: 'status',        label: 'Status',       width: 110 },
  ];

  if (loading) return <div className="dw-page-body"><p>Loading…</p></div>;
  if (error)   return <div className="dw-page-body"><p className="dw-error">{error}</p></div>;

  return (
    <div className="dw-page-body">
      <div className="dw-page-head">
        <h1>Reports</h1>
      </div>
      <DataTable
        columns={columns}
        rows={reports}
        onRowClick={row => navigate(`/reports/${row.id}`)}
        emptyMessage="No reports yet. Complete an assessment to generate a report."
      />
    </div>
  );
}
