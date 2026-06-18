import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { dashboardAPI, tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatDate';

const STAT_CONFIG = {
  CREATED: { label: 'Open Tasks', cls: 'stat-created', icon: '\u25CB' },
  ASSIGNED: { label: 'Assigned Tasks', cls: 'stat-assigned', icon: '\u2192' },
  ACCEPTED: { label: 'Accepted Tasks', cls: 'stat-accepted', icon: '\u2713' },
  IN_PROGRESS: { label: 'In Progress', cls: 'stat-progress', icon: '\u2699' },
  COMPLETED: { label: 'Completed', cls: 'stat-completed', icon: '\u2714' },
  CLOSED: { label: 'Closed', cls: 'stat-closed', icon: '\u2716' }
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const viewAllTasks = () => navigate('/tasks');
  const goToFiltered = (status) => () => navigate(`/tasks?status=${status}`);
  const openReset = () => setShowResetConfirm(true);
  const closeReset = () => { if (!resetting) setShowResetConfirm(false); };

  const loadData = () => {
    setLoading(true);
    Promise.all([dashboardAPI.get(), dashboardAPI.getActivity()])
      .then(([dashRes, activityRes]) => {
        setData(dashRes.data);
        setActivity(activityRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleReset = async () => {
    setResetting(true);
    setShowResetConfirm(false);
    setResetError('');
    const emptyCounts = { CREATED: 0, ASSIGNED: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, CLOSED: 0 };
    setData(prev => prev ? { ...prev, counts: emptyCounts, totalTasks: 0, recentTasks: [] } : prev);
    try { await tasksAPI.resetAll(); } catch {}
    loadData();
    showToast('All tasks have been reset successfully.', 'success');
    setResetting(false);
  };

  const statusBadge = (status) => {
    const map = {
      CREATED: 'badge-created', ASSIGNED: 'badge-assigned', ACCEPTED: 'badge-accepted',
      IN_PROGRESS: 'badge-progress', COMPLETED: 'badge-completed', CLOSED: 'badge-closed'
    };
    return `badge ${map[status] || 'badge-created'}`;
  };

  if (loading) {
    return (
      <div>
        <div className="dash-welcome dash-welcome-skeleton">
          <div className="skeleton skeleton-text skeleton-w-200"></div>
          <div className="skeleton skeleton-text skeleton-w-150"></div>
        </div>
        <div className="stats-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton skeleton-card"></div>)}
        </div>
      </div>
    );
  }

  if (!data) return <div className="empty-state">Failed to load dashboard.</div>;

  const { counts, totalTasks, recentTasks } = data;

  const getGreeting = () => {
    const h = parseInt(new Date().toLocaleString('en-IN', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }));
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const totalActive = (counts.CREATED || 0) + (counts.ASSIGNED || 0) + (counts.ACCEPTED || 0) + (counts.IN_PROGRESS || 0);
  const totalDone = (counts.COMPLETED || 0) + (counts.CLOSED || 0);
  const totalClosed = counts.CLOSED || 0;

  return (
    <div>
      {/* Welcome Banner */}
      <div className="dash-welcome">
        <div className="dash-welcome-text">
          <h2>{getGreeting()}, {user?.role === 'admin' ? 'Admin' : user?.name?.split(' ')[0] || 'User'}</h2>
          <p>{totalTasks > 0 ? `You have ${totalActive} active task${totalActive !== 1 ? 's' : ''}, ${totalDone} completed, and ${totalClosed} closed.` : 'No tasks yet. Create your first task to get started.'}</p>
        </div>
        <div className="dash-welcome-actions">
          {user?.role === 'admin' && (
            <>
              <Link to="/tasks/create" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ New Task</Link>
              <button type="button" className="btn btn-outline" onClick={openReset}>&#8634; Reset</button>
            </>
          )}
        </div>
      </div>

      {/* Summary Row */}
      <div className="dash-summary">
        <div className="dash-summary-item">
          <span className="dash-summary-value">{totalTasks}</span>
          <span className="dash-summary-label">Total Tasks</span>
        </div>
        <div className="dash-summary-divider"></div>
        <div className="dash-summary-item">
          <span className="dash-summary-value" style={{ color: 'var(--primary)' }}>{totalActive}</span>
          <span className="dash-summary-label">Active</span>
        </div>
        <div className="dash-summary-divider"></div>
        <div className="dash-summary-item">
          <span className="dash-summary-value" style={{ color: '#10b981' }}>{totalDone}</span>
          <span className="dash-summary-label">Completed</span>
        </div>
        <div className="dash-summary-divider"></div>
        <div className="dash-summary-item">
          <span className="dash-summary-value" style={{ color: '#6b7280' }}>{totalClosed}</span>
          <span className="dash-summary-label">Closed</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {Object.entries(STAT_CONFIG).map(([key, cfg]) => (
          <Link key={key} to={`/tasks?status=${key}`} className={`stat-card ${cfg.cls}`} style={{ textDecoration: 'none' }}>
            <div className="stat-card-inner">
              <div className="stat-card-content">
                <div className="stat-value">{counts[key] || 0}</div>
                <div className="stat-label">{cfg.label}</div>
              </div>
              <div className="stat-card-icon">{cfg.icon}</div>
            </div>
            </Link>
          ))}
      </div>

      {/* Recent Tasks + Activity */}
      <div className="dash-bottom-grid">
        <div className="card">
          <div className="card-header">
            <h3>Recent Tasks</h3>
            <Link to="/tasks" className="btn btn-sm btn-outline" style={{ textDecoration: 'none' }}>View All</Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-state">No tasks created yet.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Client</th>
                    <th>Job Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map(task => (
                    <tr key={task.id} onClick={() => navigate(`/tasks/${task.id}`)} style={{ cursor: 'pointer' }}>
                      <td><strong>{task.id}</strong></td>
                      <td>{task.client_name}</td>
                      <td>{task.job_type}</td>
                      <td><span className={`priority-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                      <td><span className={statusBadge(task.status)}>{task.status}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{formatDate(task.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          {activity.length === 0 ? (
            <div className="empty-state">No activity recorded.</div>
          ) : (
            <div className="activity-list">
              {activity.slice(0, 8).map(log => (
                <div key={log.id} className="activity-item">
                  <div className="activity-icon">&#9654;</div>
                  <div className="activity-content">
                    <div className="action">{log.action}</div>
                    <div className="activity-detail">{log.details}</div>
                    <div className="meta">{log.user_name} &middot; {formatDate(log.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reset Modal */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={closeReset}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <h2>Reset All Tasks?</h2>
            {resetError && <div className="error-message">{resetError}</div>}
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              This will permanently delete all tasks, assignments, notes, photos, and activity logs. Users will be preserved. This action cannot be undone.
            </p>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={closeReset} disabled={resetting}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleReset} disabled={resetting}>
                {resetting ? 'Resetting...' : 'Yes, Reset Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
