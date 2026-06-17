import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [noteText, setNoteText] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [leadTech, setLeadTech] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchTask = () => {
    setLoading(true);
    tasksAPI.getById(id)
      .then(res => setTask(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTask(); }, [id]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAccept = async () => {
    try {
      await tasksAPI.accept(id);
      showMessage('success', 'Task accepted!');
      fetchTask();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Failed to accept task.');
    }
  };

  const handleStart = async () => {
    try {
      await tasksAPI.start(id);
      showMessage('success', 'Work started!');
      fetchTask();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Failed to start task.');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      await tasksAPI.addNote(id, { note: noteText, is_progress: task.status === 'IN_PROGRESS' ? 1 : 0 });
      setNoteText('');
      showMessage('success', 'Note added!');
      fetchTask();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Failed to add note.');
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (completionNotes) formData.append('completion_notes', completionNotes);
      if (completionPhotos) {
        for (let i = 0; i < completionPhotos.length; i++) {
          formData.append('photos', completionPhotos[i]);
        }
      }
      await tasksAPI.complete(id, formData);
      showMessage('success', 'Task marked as completed!');
      setCompletionNotes('');
      setCompletionPhotos(null);
      fetchTask();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Failed to complete task.');
    }
  };

  const handleApprove = async () => {
    try {
      await tasksAPI.approve(id);
      showMessage('success', 'Task closed!');
      fetchTask();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Failed to close task.');
    }
  };

  const handleReopen = async () => {
    try {
      await tasksAPI.reopen(id);
      showMessage('success', 'Task reopened!');
      fetchTask();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Failed to reopen task.');
    }
  };

  const openAssignModal = async () => {
    try {
      const res = await usersAPI.getTechnicians();
      setTechnicians(res.data);
      setSelectedTechs(task.technicians?.map(t => t.id) || []);
      setLeadTech(task.technicians?.find(t => t.is_lead)?.id || '');
      setShowAssignModal(true);
    } catch (err) {
      showMessage('error', 'Failed to load technicians.');
    }
  };

  const handleAssign = async () => {
    try {
      await tasksAPI.assign(id, { technician_ids: selectedTechs, lead_technician_id: leadTech || null });
      setShowAssignModal(false);
      showMessage('success', 'Task assigned successfully!');
      fetchTask();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Failed to assign task.');
    }
  };

  const toggleTech = (techId) => {
    setSelectedTechs(prev =>
      prev.includes(techId) ? prev.filter(t => t !== techId) : [...prev, techId]
    );
  };

  const statusBadge = (status) => {
    const map = {
      CREATED: 'badge-created', ASSIGNED: 'badge-assigned', ACCEPTED: 'badge-accepted',
      IN_PROGRESS: 'badge-progress', COMPLETED: 'badge-completed', CLOSED: 'badge-closed'
    };
    return `badge ${map[status] || 'badge-created'}`;
  };

  if (loading) return <div className="empty-state">Loading task details...</div>;
  if (!task) return <div className="empty-state">Task not found.</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-sm btn-outline" onClick={() => navigate('/tasks')}>&larr; Back</button>
          <h1>{task.id}</h1>
          <span className={statusBadge(task.status)}>{task.status}</span>
          <span className={`priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
        </div>
      </div>

      {message.text && <div className={`${message.type}-message`}>{message.text}</div>}

      {/* Action Buttons */}
      <div className="action-bar">
          {user?.role === 'admin' && task.status === 'CREATED' && (
            <button className="btn btn-primary" onClick={openAssignModal}>Assign Technicians</button>
          )}
          {user?.role === 'admin' && (task.status === 'ASSIGNED' || task.status === 'ACCEPTED' || task.status === 'IN_PROGRESS') && (
            <button className="btn btn-primary" onClick={openAssignModal}>Reassign</button>
          )}
          {user?.role === 'admin' && (task.status === 'COMPLETED') && (
            <>
              <button className="btn btn-success" onClick={handleApprove}>Approve & Close</button>
              <button className="btn btn-warning" onClick={handleReopen}>Reopen Task</button>
            </>
          )}
          {user?.role === 'technician' && task.status === 'ASSIGNED' && (
            <button className="btn btn-success" onClick={handleAccept}>Accept Task</button>
          )}
          {user?.role === 'technician' && (task.status === 'ACCEPTED' || task.status === 'IN_PROGRESS') && task.status !== 'IN_PROGRESS' && (
            <button className="btn btn-primary" onClick={handleStart}>Start Work</button>
          )}
        </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
        <button className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>Activity Log</button>
        <button className={`tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
        {task.photos?.length > 0 && (
          <button className={`tab ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>Photos ({task.photos.length})</button>
        )}
      </div>

      {activeTab === 'details' && (
        <div className="card">
          <div className="detail-grid">
            <div className="detail-item">
              <label>Client Name</label>
              <div className="value">{task.client_name}</div>
            </div>
            <div className="detail-item">
              <label>Contact Person</label>
              <div className="value">{task.contact_person || '-'}</div>
            </div>
            <div className="detail-item">
              <label>Mobile Number</label>
              <div className="value">{task.mobile_number || '-'}</div>
            </div>
            <div className="detail-item">
              <label>Location</label>
              <div className="value">{task.location}</div>
            </div>
            <div className="detail-item">
              <label>Job Type</label>
              <div className="value">{task.job_type}</div>
            </div>
            <div className="detail-item">
              <label>Priority</label>
              <div className="value"><span className={`priority-${task.priority.toLowerCase()}`}>{task.priority}</span></div>
            </div>
            <div className="detail-item">
              <label>Created By</label>
              <div className="value">{task.created_by_name}</div>
            </div>
            <div className="detail-item">
              <label>Created At</label>
              <div className="value">{task.created_at}</div>
            </div>
            {task.assigned_by_name && (
              <>
                <div className="detail-item">
                  <label>Assigned By</label>
                  <div className="value">{task.assigned_by_name}</div>
                </div>
                <div className="detail-item">
                  <label>Assigned At</label>
                  <div className="value">{task.assigned_at}</div>
                </div>
              </>
            )}
            {task.completed_by_name && (
              <>
                <div className="detail-item">
                  <label>Completed By</label>
                  <div className="value">{task.completed_by_name}</div>
                </div>
                <div className="detail-item">
                  <label>Completed At</label>
                  <div className="value">{task.completed_at}</div>
                </div>
              </>
            )}
            {task.closed_by_name && (
              <>
                <div className="detail-item">
                  <label>Closed By</label>
                  <div className="value">{task.closed_by_name}</div>
                </div>
                <div className="detail-item">
                  <label>Closed At</label>
                  <div className="value">{task.closed_at}</div>
                </div>
              </>
            )}
            <div className="detail-item full">
              <label>Description</label>
              <div className="value">{task.description || 'No description.'}</div>
            </div>
            <div className="detail-item full">
              <label>Special Instructions</label>
              <div className="value">{task.special_instructions || 'None.'}</div>
            </div>
            {task.attachment && (
              <div className="detail-item full">
                <label>Attachment</label>
                <div className="value">
                  <a href={`/uploads/${task.attachment}`} target="_blank" rel="noopener noreferrer">
                    {task.attachment.replace(/^\d+-\d+-/, '')}
                  </a>
                </div>
              </div>
            )}
            {task.completion_notes && (
              <div className="detail-item full">
                <label>Completion Notes</label>
                <div className="value">{task.completion_notes}</div>
              </div>
            )}
            <div className="detail-item full">
              <label>Assigned Technicians</label>
              <div className="value">
                {task.technicians?.length > 0 ? (
                  <ul style={{ paddingLeft: '1.25rem' }}>
                    {task.technicians.map(t => (
                      <li key={t.id}>{t.name} {t.is_lead ? '(Lead)' : ''}</li>
                    ))}
                  </ul>
                ) : 'Not assigned yet.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          {task.activity_logs?.length === 0 ? (
            <div className="empty-state">No activity recorded.</div>
          ) : (
            task.activity_logs?.map(log => (
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
      )}

      {activeTab === 'notes' && (
        <div className="card">
          {user?.role === 'technician' && (task.status === 'IN_PROGRESS' || task.status === 'ACCEPTED') && (
            <form onSubmit={handleAddNote} style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Add Note / Progress Update</label>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Describe what you're working on, issues found, etc."
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Add Note</button>
            </form>
          )}

          {task.status === 'IN_PROGRESS' && user?.role === 'technician' && (
            <form onSubmit={handleComplete} className="completion-form">
              <h4>Mark Task as Completed</h4>
              <div className="form-group">
                <label>Completion Notes</label>
                <textarea
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  placeholder="Summarize the work completed..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Photos (Optional, max 5)</label>
                <input type="file" multiple accept="image/*" onChange={e => setCompletionPhotos(e.target.files)} />
              </div>
              <button type="submit" className="btn btn-success">Mark Completed</button>
            </form>
          )}

          {task.notes?.length === 0 ? (
            <div className="empty-state">No notes yet.</div>
          ) : (
            task.notes?.map(note => (
              <div key={note.id} className="note-item">
                <div className="note-header">
                  <strong>{note.user_name}</strong>
                  <span style={{ color: '#999', fontSize: '0.8rem' }}>{note.created_at}</span>
                </div>
                <div className="note-text">{note.note}</div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="card">
          <div className="photo-grid">
            {task.photos?.map(photo => (
              <div key={photo.id}>
                <img
                    src={`/api/tasks/${task.id}/photos/${photo.file_path}`}
                  alt="Task photo"
                  onClick={() => window.open(`/api/tasks/${task.id}/photos/${photo.file_path}`, '_blank')}
                />
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>{photo.user_name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Assign Technicians</h2>
            <div className="form-group">
              <label>Select Technicians</label>
              <div className="checkbox-list">
                {technicians.map(tech => (
                  <label key={tech.id}>
                    <input
                      type="checkbox"
                      checked={selectedTechs.includes(tech.id)}
                      onChange={() => toggleTech(tech.id)}
                    />
                    {tech.name} ({tech.username})
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Lead Technician (Optional)</label>
              <select value={leadTech} onChange={e => setLeadTech(e.target.value)}>
                <option value="">No lead</option>
                {selectedTechs.map(id => {
                  const tech = technicians.find(t => t.id === id);
                  return tech ? <option key={id} value={id}>{tech.name}</option> : null;
                })}
              </select>
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={selectedTechs.length === 0}>Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
