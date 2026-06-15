import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI } from '../services/api';

export default function CreateTask() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    client_name: '',
    contact_person: '',
    mobile_number: '',
    location: '',
    job_type: '',
    description: '',
    special_instructions: '',
    priority: 'Medium'
  });
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const res = await tasksAPI.create(formData);
      navigate(`/tasks/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-sm btn-outline" onClick={() => navigate('/tasks')}>&larr; Back</button>
          <h1>Create New Task</h1>
        </div>
      </div>

      <div className="card">
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '1rem' }}>Customer Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Client Name *</label>
              <input name="client_name" value={form.client_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Contact Person</label>
              <input name="contact_person" value={form.contact_person} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mobile Number</label>
              <input name="mobile_number" value={form.mobile_number} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Location / Address *</label>
              <input name="location" value={form.location} onChange={handleChange} required />
            </div>
          </div>

          <h3 style={{ margin: '1.5rem 0 1rem' }}>Task Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Purpose / Job Type *</label>
              <input name="job_type" value={form.job_type} onChange={handleChange} required placeholder="e.g. Installation, Repair, Maintenance" />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Task Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
          </div>
          <div className="form-group">
            <label>Special Instructions</label>
            <textarea name="special_instructions" value={form.special_instructions} onChange={handleChange} rows={2} />
          </div>
          <div className="form-group">
            <label>Attachment (Optional)</label>
            <input type="file" onChange={e => setAttachment(e.target.files[0])} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/tasks')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
