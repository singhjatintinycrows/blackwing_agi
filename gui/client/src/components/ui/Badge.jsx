import { SEVERITY_COLORS, STATUS_COLORS } from '../../lib/constants';

export function SeverityBadge({ severity }) {
  const c = SEVERITY_COLORS[severity] || SEVERITY_COLORS.info;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: '"IBM Plex Mono", monospace',
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      textTransform: 'uppercase',
      letterSpacing: '.3px',
    }}>
      {severity}
    </span>
  );
}

export function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.open;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 500,
      background: c.bg,
      color: c.text,
      border: '1px solid currentColor',
      borderColor: c.text + '44',
    }}>
      {status}
    </span>
  );
}
