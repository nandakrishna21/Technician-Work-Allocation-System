import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

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
    setShowResetConfirm(false);
    setResetError('');
    const emptyCounts = { CREATED: 0, ASSIGNED: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, CLOSED: 0 };
    setData(prev => prev ? { ...prev, counts: emptyCounts, totalTasks: 0, recentTasks: [] } : prev);
    try {
      await tasksAPI.resetAll();
      loadData();
    } catch (err) {
      loadData();
    }
  };

  if (loading) return <div className="empty-state">Loading dashboard...</div>;
  if (!data) return <div className="empty-state">Failed to load dashboard.</div>;

  const { counts, totalTasks, recentTasks } = data;

  const statCards = [
    { key: 'CREATED', label: 'Open Tasks', className: 'stat-created' },
    { key: 'ASSIGNED', label: 'Assigned Tasks', className: 'stat-assigned' },
    { key: 'ACCEPTED', label: 'Accepted Tasks', className: 'stat-accepted' },
    { key: 'IN_PROGRESS', label: 'In Progress', className: 'stat-progress' },
    { key: 'COMPLETED', label: 'Completed', className: 'stat-completed' },
    { key: 'CLOSED', label: 'Closed', className: 'stat-closed' }
  ];

  const statusBadge = (status) => {
    const map = {
      CREATED: 'badge-created', ASSIGNED: 'badge-assigned', ACCEPTED: 'badge-accepted',
      IN_PROGRESS: 'badge-progress', COMPLETED: 'badge-completed', CLOSED: 'badge-closed'
    };
    return `badge ${map[status] || 'badge-created'}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="page-header-actions">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Welcome, {user?.name}</span>
          {user?.role === 'admin' && (
            <button className="btn btn-sm btn-danger" onClick={() => setShowResetConfirm(true)}>&#8634; Reset All</button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.key} className={`stat-card ${s.className}`} onClick={() => navigate(`/tasks?status=${s.key}`)}>
            <div className="stat-value">{counts[s.key] || 0}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>Recent Tasks</h3>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/tasks')}>View All</button>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-state">No tasks yet.</div>
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
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{task.created_at}</td>
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
            <div className="empty-state">No activity yet.</div>
          ) : (
            activity.slice(0, 10).map(log => (
              <div key={log.id} className="activity-item">
                <div className="activity-icon">&#9654;</div>
                <div className="activity-content">
                  <div className="action">{log.action}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.details}</div>
                  <div className="meta">{log.user_name} &middot; {log.created_at}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => !resetting && setShowResetConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <h2>Reset All Tasks?</h2>
            {resetError && <div className="error-message">{resetError}</div>}
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              This will permanently delete all tasks, assignments, notes, photos, and activity logs. Users will be preserved. This action cannot be undone.
            </p>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setShowResetConfirm(false)} disabled={resetting}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReset} disabled={resetting}>
                {resetting ? 'Resetting...' : 'Yes, Reset Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
