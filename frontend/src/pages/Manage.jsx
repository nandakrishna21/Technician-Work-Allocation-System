import { useState } from 'react';
import { tasksAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Manage() {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { showToast } = useToast();

  const handleReset = async () => {
    setResetting(true);
    try {
      await tasksAPI.resetAll();
      showToast('All tasks have been reset successfully.', 'success');
      setConfirmReset(false);
    } catch {
      showToast('Failed to reset tasks.', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId.trim()) return;
    setDeleting(true);
    try {
      await tasksAPI.delete(deleteId.trim());
      showToast(`Task ${deleteId.trim()} deleted successfully.`, 'success');
      setDeleteId('');
      setConfirmDelete(false);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete task.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Manage</h1>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Delete Single Task</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Enter a Task ID to permanently delete it along with all its assignments, logs, notes, and photos.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={deleteId}
            onChange={e => setDeleteId(e.target.value)}
            placeholder="Enter Task ID (e.g. TASK-00001)"
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.9rem', flex: '1', minWidth: '200px', background: 'var(--card-bg)', color: 'var(--text)' }}
          />
          {!confirmDelete ? (
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)} disabled={!deleteId.trim()}>&#10005; Delete Task</button>
          ) : (
            <>
              <span style={{ fontWeight: 600, color: 'var(--danger)' }}>Delete {deleteId.trim()}?</span>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button className="btn btn-outline" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Reset All Tasks</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          This will permanently delete all tasks, assignments, activity logs, notes, and photos. This action cannot be undone.
        </p>
        {!confirmReset ? (
          <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>&#8634; Reset All Tasks</button>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: 'var(--danger)' }}>Are you sure?</span>
            <button className="btn btn-danger" onClick={handleReset} disabled={resetting}>
              {resetting ? 'Resetting...' : 'Yes, Reset Everything'}
            </button>
            <button className="btn btn-outline" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}