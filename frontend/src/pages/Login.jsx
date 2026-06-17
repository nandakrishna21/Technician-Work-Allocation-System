import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { id: 'admin', label: 'Admin', username: 'admin', icon: '\u2691', desc: 'Full system access' },
  { id: 'technician', label: 'Technician', username: 'tech1', icon: '\u2692', desc: 'Task management' }
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

  const goBack = () => {
    setSelectedRole(null);
    setPassword('');
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1"></div>
      <div className="login-bg-orb login-bg-orb-2"></div>
      <div className="login-bg-orb login-bg-orb-3"></div>

      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">TW</div>
          <div>
            <h1>Technician Work</h1>
            <p className="login-subtitle">Allocation System</p>
          </div>
        </div>

        {!selectedRole ? (
          <>
            <p className="login-select-text">Choose your role to continue</p>
            {error && <div className="error-message">{error}</div>}
            <div className="role-selector">
              {ROLES.map(role => (
                <button
                  key={role.id}
                  className="role-btn"
                  onClick={() => selectRole(role)}
                >
                  <span className="role-icon">{role.icon}</span>
                  <span className="role-label">{role.label}</span>
                  <span className="role-desc">{role.desc}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="login-selected-header">
              <button className="login-back-btn" onClick={goBack} title="Change role">&larr;</button>
              <div>
                <span className="login-selected-label">Signing in as</span>
                <span className="login-selected-role">{selectedRole === 'admin' ? 'Admin' : 'Technician'}</span>
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Username</label>
                <div className="input-with-icon">
                  <span className="input-icon">&#9783;</span>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="input-with-icon">
                  <span className="input-icon">&#9679;</span>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required autoFocus />
                </div>
              </div>
              <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

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
          </>
        )}

        <div className="login-footer">
          <span>TechWorkFlow v1.0</span>
          <span>Secure System</span>
        </div>
      </div>
    </div>
  );
}
