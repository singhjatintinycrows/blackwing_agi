import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/assessment');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dw-login">
      <div className="dw-login__card">
        <div className="dw-login__brand">
          <div className="dw-topbar__logo" aria-hidden="true" style={{ width: 32, height: 32 }}>
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="1.5" y="1.5" width="21" height="21" rx="4" stroke="#c4c9d3" strokeDasharray="3 3"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Blackwing</h1>
            <p style={{ margin: '2px 0 0', color: '#8d92a0', fontSize: 12 }}>by Tinycrows</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dw-field">
            <label className="dw-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="dw-field">
            <label className="dw-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="dw-login__error">{error}</p>}
          <button
            type="submit"
            className="dw-btn dw-btn--primary dw-btn--full"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
