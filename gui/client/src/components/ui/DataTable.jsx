export function DataTable({ columns, rows, onRowClick, emptyMessage = 'No data.' }) {
  if (!rows || rows.length === 0) {
    return <p className="dw-table-empty">{emptyMessage}</p>;
  }

  return (
    <div className="dw-table-wrap">
      <table className="dw-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={col.width ? { width: col.width } : {}}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'dw-table__row--clickable' : ''}
            >
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
