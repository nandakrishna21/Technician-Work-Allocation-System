import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { formatDate } from '../utils/formatDate';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'technician', mobile: '' });
  const [editForm, setEditForm] = useState({ name: '', mobile: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getTechnicians();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await usersAPI.create(form);
      setSuccess(`User ${form.username} created successfully!`);
      setShowCreate(false);
      setForm({ username: '', password: '', name: '', role: 'technician', mobile: '' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({ name: user.name, mobile: user.mobile || '' });
    setShowEdit(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await usersAPI.update(editUser.id, editForm);
      setSuccess(`User ${editUser.username} updated successfully!`);
      setShowEdit(false);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Add Technician</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">No technicians found.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Mobile</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.name}</td>
                    <td><span className="badge badge-assigned">{u.role}</span></td>
                    <td>{u.mobile || '-'}</td>
                    <td style={{ fontSize: '0.8rem', color: '#999' }}>{formatDate(u.created_at)}</td>
                    <td><button className="btn btn-sm btn-outline" onClick={() => openEdit(u)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Technician</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Username *</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="technician">Technician</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mobile</label>
                <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && editUser && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Technician</h2>
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label>Username</label>
                <input value={editUser.username} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="form-group">
                <label>Full Name *</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Mobile</label>
                <input value={editForm.mobile} onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
