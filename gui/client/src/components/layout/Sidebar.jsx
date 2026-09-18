import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/assessment', label: 'Assessment' },
  { to: '/reports',    label: 'Reports' },
  { to: '/vulns',      label: 'Vulnerabilities' },
  { to: '/tools',      label: 'Tools' },
];

export function Sidebar() {
  return (
    <nav className="dw-sidebar" aria-label="Main navigation">
      <ul className="dw-sidebar__list">
        {NAV_ITEMS.map(item => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `dw-sidebar__link${isActive ? ' dw-sidebar__link--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
