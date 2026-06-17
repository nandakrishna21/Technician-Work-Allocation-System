import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TaskList() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: initialStatus, priority: '', search: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchTasks = () => {
    setLoading(true);
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.search) params.search = filters.search;

    tasksAPI.getAll(params)
      .then(res => setTasks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, [filters.status, filters.priority, filters.search]);

  const handleFilter = () => fetchTasks();

  const exportToExcel = () => {
    const data = tasks.map(t => ({
      'Task ID': t.id,
      'Client Name': t.client_name,
      'Contact Person': t.contact_person || '',
      'Mobile': t.mobile_number || '',
      'Location': t.location,
      'Job Type': t.job_type,
      'Priority': t.priority,
      'Status': t.status,
      'Technicians': t.technicians?.map(tech => tech.name).join(', ') || '',
      'Description': t.description || '',
      'Special Instructions': t.special_instructions || '',
      'Created By': t.created_by_name || '',
      'Created At': t.created_at,
      'Completed At': t.completed_at || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    XLSX.writeFile(wb, `tasks-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

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
        <h1>Tasks{filters.status ? ` - ${filters.status.replace(/_/g, ' ')}` : ''}</h1>
        <div className="page-header-actions">
          <button className="btn btn-sm btn-outline" onClick={exportToExcel} disabled={tasks.length === 0}>
            &#8681; Export Excel
          </button>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => navigate('/tasks/create')}>+ Create Task</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search by client, job type, or ID..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleFilter()}
          />
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="CREATED">Created</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <button className="btn btn-sm btn-outline" onClick={() => { setFilters({ status: '', priority: '', search: '' }); navigate('/tasks'); }}>Clear</button>
        </div>

        {loading ? (
          <div className="empty-state">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">No tasks found.</div>
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
                  <th>Technicians</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} onClick={() => navigate(`/tasks/${task.id}`)} style={{ cursor: 'pointer' }}>
                    <td><strong>{task.id}</strong></td>
                    <td>{task.client_name}</td>
                    <td>{task.job_type}</td>
                    <td><span className={`priority-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                    <td><span className={statusBadge(task.status)}>{task.status}</span></td>
                    <td>{task.technicians?.map(t => t.name).join(', ') || '-'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{task.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
