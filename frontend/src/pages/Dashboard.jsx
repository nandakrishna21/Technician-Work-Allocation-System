import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([dashboardAPI.get(), dashboardAPI.getActivity()])
      .then(([dashRes, activityRes]) => {
        setData(dashRes.data);
        setActivity(activityRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
        <span style={{ color: '#666' }}>Welcome, {user?.name}</span>
      </div>

      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.key} className={`stat-card ${s.className}`}>
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
            <div className="table-container">
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
                      <td style={{ fontSize: '0.8rem', color: '#999' }}>{task.created_at}</td>
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
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{log.details}</div>
                  <div className="meta">{log.user_name} &middot; {log.created_at}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
