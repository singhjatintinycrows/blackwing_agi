import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="dw-topbar">
      <div className="dw-topbar__brand">
        <div className="dw-topbar__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="1.5" y="1.5" width="21" height="21" rx="4" stroke="#c4c9d3" strokeDasharray="3 3"/>
          </svg>
        </div>
        <b>Blackwing</b>
        <span style={{ color: '#8d92a0', fontWeight: 400, marginLeft: 6 }}>by Tinycrows</span>
      </div>
      {user && (
        <div className="dw-topbar__user">
          <span className="dw-topbar__name">{user.name || user.email}</span>
          <button type="button" className="dw-topbar__logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
