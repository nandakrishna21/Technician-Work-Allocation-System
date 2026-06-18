import { useState } from 'react';
import { tasksAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Manage() {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
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

  return (
    <div>
      <div className="page-header">
        <h1>Manage</h1>
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