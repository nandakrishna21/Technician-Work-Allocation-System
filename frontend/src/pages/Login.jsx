import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { id: 'admin', label: 'Admin', username: 'admin', icon: '\u2691' },
  { id: 'technician', label: 'Technician', username: 'tech1', icon: '\u2692' }
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const selectRole = (role) => {
    setSelectedRole(role.id);
    setUsername(role.username);
    setPassword('');
    setError('');
    setShowForgot(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select a role first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Technician Work Allocation</h1>
        <p>Select your role to sign in</p>
        {error && <div className="error-message">{error}</div>}

        <div className="role-selector">
          {ROLES.map(role => (
            <button
              key={role.id}
              className={`role-btn ${selectedRole === role.id ? 'active' : ''}`}
              onClick={() => selectRole(role)}
            >
              <span className="role-icon">{role.icon}</span>
              <span className="role-label">{role.label}</span>
            </button>
          ))}
        </div>

        {selectedRole && (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required autoFocus />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {selectedRole && (
          <div className="forgot-password">
            <button className="forgot-btn" onClick={() => setShowForgot(!showForgot)}>
              Forgot Password?
            </button>
            {showForgot && (
              <div className="forgot-info">
                Contact your system administrator to reset your password.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
