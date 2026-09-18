import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { DataTable } from '../../components/ui/DataTable';
import { SeverityBadge, StatusBadge } from '../../components/ui/Badge';

export function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/reports/${id}`)
      .then(setReport)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="dw-page-body"><p>Loading…</p></div>;
  if (error)   return <div className="dw-page-body"><p className="dw-error">{error}</p></div>;
  if (!report) return null;

  const columns = [
    { key: 'severity', label: 'Severity', width: 100, render: v => <SeverityBadge severity={v} /> },
    { key: 'category', label: 'Category', width: 110, render: v => v || '—' },
    { key: 'title',    label: 'Finding' },
    { key: 'status',   label: 'Status',   width: 110, render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div className="dw-page-body">
      <div className="dw-page-head">
        <button type="button" className="dw-back-btn" onClick={() => navigate(-1)}>← Reports</button>
        <h1>{report.title || 'Assessment Report'}</h1>
        {report.app_name && <p className="dw-page-head__sub">{report.app_name} — {report.target}</p>}
        <p className="dw-page-head__meta">
          {report.created_at ? new Date(report.created_at).toLocaleString() : ''}
          {report.summary && <> · {report.summary}</>}
        </p>
        <div className="dw-report-actions" style={{ marginTop: 12 }}>
          <a className="dw-btn dw-btn--primary" href={`/api/reports/${id}/pdf`} download>
            ↓ Download Report (PDF)
          </a>
        </div>
      </div>

      <section className="dw-detail-section">
        <h2>Findings</h2>
        <DataTable
          columns={columns}
          rows={report.findings}
          onRowClick={row => navigate(`/vulns/${row.id}`)}
          emptyMessage="No findings recorded."
        />
      </section>

      {report.raw_log && (
        <section className="dw-detail-section">
          <h2>Raw Log</h2>
          <pre className="dw-raw-log">{report.raw_log}</pre>
        </section>
      )}
    </div>
  );
}
