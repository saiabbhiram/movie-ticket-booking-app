import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminLogin({ username, password });
      localStorage.setItem('cinebook_admin_token', res.data.data.token);
      localStorage.setItem('cinebook_admin_user', res.data.data.admin.username);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section">
      <div className="panel" style={{ maxWidth: 440, margin: '40px auto' }}>
        <h1 style={{ marginBottom: 8 }}>Admin Login</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
          Sign in to manage movies, theatres, showtimes, and bookings.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="adminUsername">Username</label>
            <input
              id="adminUsername"
              type="text"
              className="form-control"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div className="form-group">
            <label htmlFor="adminPassword">Password</label>
            <input
              id="adminPassword"
              type="password"
              className="form-control"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
