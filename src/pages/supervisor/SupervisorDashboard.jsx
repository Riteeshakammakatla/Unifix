import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Briefcase, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const SupervisorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateModal, setUpdateModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await issuesAPI.list();
      setIssues(res.data.results || res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      const data = { status: newStatus };
      if (notes) data.resolution_notes = notes;
      await issuesAPI.update(updateModal.id, data);
      await fetchIssues();
      setUpdateModal(null);
      setNewStatus('');
      setNotes('');
    } catch (err) {
      alert('Failed to update issue');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const cls = status?.toLowerCase().replace(/\s+/g, '') || 'open';
    return <span className={`badge badge-${cls}`}>{status}</span>;
  };

  const stats = {
    total: issues.length,
    inProgress: issues.filter(i => i.status === 'In Progress').length,
    resolved: issues.filter(i => i.status === 'Resolved').length,
    assigned: issues.filter(i => i.status === 'Assigned').length,
  };

  const statCards = [
    { label: 'Assigned Issues', value: stats.total, icon: <Briefcase size={22} />, bg: 'rgba(74,159,229,0.15)', color: 'var(--color-primary)' },
    { label: 'Awaiting Action', value: stats.assigned, icon: <Clock size={22} />, bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    { label: 'In Progress', value: stats.inProgress, icon: <AlertTriangle size={22} />, bg: 'rgba(251,146,60,0.15)', color: '#FB923C' },
    { label: 'Resolved', value: stats.resolved, icon: <CheckCircle size={22} />, bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  ];

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>My Department Issues</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Manage and update assigned maintenance issues
        </p>
      </div>

      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="card">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Assigned Issues</div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td>
                    <span style={{ fontWeight: '500', cursor: 'pointer', color: 'var(--color-primary)' }} onClick={() => navigate(`/issue/${issue.id}`)}>
                      {issue.title}
                    </span>
                  </td>
                  <td>{issue.location}</td>
                  <td><span className={`badge badge-${issue.priority?.toLowerCase()}`}>{issue.priority}</span></td>
                  <td>{getStatusBadge(issue.status)}</td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {new Date(issue.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {issue.status !== 'Resolved' && (
                      <button className="btn btn-sm btn-secondary" onClick={() => { setUpdateModal(issue); setNewStatus(issue.status); }}>
                        Update
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Status Modal */}
      {updateModal && (
        <div className="modal-overlay" onClick={() => setUpdateModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Update Issue Status</h3>
              <button className="modal-close" onClick={() => setUpdateModal(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
              {updateModal.title}
            </p>

            <div className="input-group">
              <label className="input-label">Status</label>
              <select className="input-field" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Notes (optional)</label>
              <textarea className="input-field" placeholder="Add resolution notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setUpdateModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={updating}>
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SupervisorDashboard;
