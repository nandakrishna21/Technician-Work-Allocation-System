import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatDate';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editAttachment, setEditAttachment] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [showClarifyModal, setShowClarifyModal] = useState(false);
  const [clarifyMessage, setClarifyMessage] = useState('');
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [respondMessage, setRespondMessage] = useState('');
  const [respondLoading, setRespondLoading] = useState(false);

  const fetchTask = () => {
    setLoading(true);
    tasksAPI.getById(id)
      .then(res => setTask(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTask(); }, [id]);

  const showMessage = (type, text) => {
    showToast(text, type === 'error' ? 'error' : type === 'success' ? 'success' : 'info');
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

  const openEditModal = () => {
    setEditForm({
      client_name: task.client_name || '',
      contact_person: task.contact_person || '',
      mobile_number: task.mobile_number || '',
      location: task.location || '',
      job_type: task.job_type || '',
      description: task.description || '',
      special_instructions: task.special_instructions || '',
      priority: task.priority || 'Medium'
    });
    setEditAttachment(null);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const formData = new FormData();
      Object.entries(editForm).forEach(([key, value]) => { formData.append(key, value); });
      if (editAttachment) formData.append('attachment', editAttachment);
      await tasksAPI.update(id, formData);
      showToast('Task updated successfully!', 'success');
      setShowEditModal(false);
      fetchTask();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update task.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleClarify = async () => {
    if (!clarifyMessage.trim()) return;
    setClarifyLoading(true);
    try {
      await tasksAPI.clarify(id, { message: clarifyMessage });
      showToast('Clarification request sent to admin.', 'success');
      setShowClarifyModal(false);
      setClarifyMessage('');
      fetchTask();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send request.', 'error');
    } finally {
      setClarifyLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!respondMessage.trim()) return;
    setRespondLoading(true);
    try {
      await tasksAPI.respond(id, { message: respondMessage });
      showToast('Response sent to technician.', 'success');
      setRespondMessage('');
      fetchTask();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send response.', 'error');
    } finally {
      setRespondLoading(false);
    }
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
          {user?.role === 'admin' && task.status !== 'CLOSED' && (
            <button className="btn btn-outline" onClick={openEditModal}>&#9998; Edit</button>
          )}
          {user?.role === 'technician' && task.status === 'ASSIGNED' && (
            <button className="btn btn-success" onClick={handleAccept}>Accept Task</button>
          )}
          {user?.role === 'technician' && task.status === 'ACCEPTED' && (
            <button className="btn btn-primary" onClick={handleStart}>Start Work</button>
          )}
          {user?.role === 'technician' && (task.status === 'ACCEPTED' || task.status === 'IN_PROGRESS') && (
            <button className="btn btn-outline" onClick={() => setShowClarifyModal(true)}>&#63; Request Clarification</button>
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
               <div className="value">{formatDate(task.created_at)}</div>
            </div>
            <div className="detail-item techs-row">
              <label>Assigned Technicians</label>
              <div className="value">
                {task.technicians?.length > 0 ? (
                  <div className="tech-tags">
                    {task.technicians.map(t => (
                      <span key={t.id} className={`tech-tag ${t.is_lead ? 'tech-lead' : ''}`}>
                        {t.name}{t.is_lead ? ' (Lead)' : ''}
                      </span>
                    ))}
                  </div>
                ) : 'Not assigned yet.'}
              </div>
            </div>
            {task.assigned_by_name && (
              <>
                <div className="detail-item">
                  <label>Assigned By</label>
                  <div className="value">{task.assigned_by_name}</div>
                </div>
                <div className="detail-item">
                  <label>Assigned At</label>
                  <div className="value">{formatDate(task.assigned_at)}</div>
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
                  <div className="value">{formatDate(task.completed_at)}</div>
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
                  <div className="value">{formatDate(task.closed_at)}</div>
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
            {task.clarification_request && (
              <div className="detail-item full">
                <label>Clarification Request</label>
                <div className="value clarify-box request">
                  {task.clarification_request}
                </div>
              </div>
            )}
            {task.clarification_response && (
              <div className="detail-item full">
                <label>Clarification Response</label>
                <div className="value clarify-box response">
                  {task.clarification_response}
                </div>
              </div>
            )}
            {user?.role === 'admin' && task.clarification_request && !task.clarification_response && (
              <div className="detail-item full">
                <label>Respond to Clarification</label>
                <div style={{ marginTop: '0.25rem' }}>
                  <textarea
                    className="respond-textarea"
                    value={respondMessage}
                    onChange={e => setRespondMessage(e.target.value)}
                    placeholder="Type your response here..."
                    rows={3}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'inherit', fontSize: '0.9rem', background: 'var(--card-bg)', color: 'var(--text)', resize: 'vertical' }}
                  />
                  <button className="btn btn-primary" onClick={handleRespond} disabled={respondLoading || !respondMessage.trim()} style={{ marginTop: '0.5rem' }}>
                    {respondLoading ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </div>
            )}
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
                  <div className="meta">{log.user_name} &middot; {formatDate(log.created_at)}</div>
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
                  <span style={{ color: '#999', fontSize: '0.8rem' }}>{formatDate(note.created_at)}</span>
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => !editLoading && setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '600px' }}>
            <h2>Edit Task — {task.id}</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Client Name</label>
                  <input name="client_name" value={editForm.client_name} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>Contact Person</label>
                  <input name="contact_person" value={editForm.contact_person} onChange={handleEditChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input name="mobile_number" value={editForm.mobile_number} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input name="location" value={editForm.location} onChange={handleEditChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Job Type</label>
                  <input name="job_type" value={editForm.job_type} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={editForm.priority} onChange={handleEditChange}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={editForm.description} onChange={handleEditChange} rows={3} />
              </div>
              <div className="form-group">
                <label>Special Instructions</label>
                <textarea name="special_instructions" value={editForm.special_instructions} onChange={handleEditChange} rows={2} />
              </div>
              <div className="form-group">
                <label>Attachment</label>
                <input type="file" onChange={e => setEditAttachment(e.target.files[0])} />
                {task.attachment && <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: 'var(--text-muted)' }}>Current: {task.attachment.replace(/^\d+-\d+-/, '')}</div>}
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)} disabled={editLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clarify Modal */}
      {showClarifyModal && (
        <div className="modal-overlay" onClick={() => !clarifyLoading && setShowClarifyModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '480px' }}>
            <h2>Request Clarification</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Describe what additional information you need from the admin.</p>
            <div className="form-group">
              <textarea
                value={clarifyMessage}
                onChange={e => setClarifyMessage(e.target.value)}
                placeholder="I need more details about..."
                rows={4}
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'inherit', fontSize: '0.9rem', background: 'var(--card-bg)', color: 'var(--text)', resize: 'vertical' }}
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setShowClarifyModal(false)} disabled={clarifyLoading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleClarify} disabled={clarifyLoading || !clarifyMessage.trim()}>
                {clarifyLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
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
