import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI, authAPI } from '../../services/api';
import { Loader2, UserPlus, Search } from 'lucide-react';

const AdminIssues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [issuesRes, supRes] = await Promise.all([
          issuesAPI.list(),
          authAPI.getSupervisors(),
        ]);
        setIssues(issuesRes.data.results || issuesRes.data);
        setSupervisors(supRes.data.results || supRes.data);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedSupervisor) return;
    setAssigning(true);
    try {
      await issuesAPI.assign(assignModal.id, parseInt(selectedSupervisor));
      // Refresh issues
      const res = await issuesAPI.list();
      setIssues(res.data.results || res.data);
      setAssignModal(null);
      setSelectedSupervisor('');
    } catch (err) {
      alert('Failed to assign issue');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusBadge = (status) => {
    const cls = status?.toLowerCase().replace(/\s+/g, '') || 'open';
    return <span className={`badge badge-${cls}`}>{status}</span>;
  };

  const filtered = issues.filter(i =>
    !filter || i.status === filter
  );

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>All Issues</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Manage and assign maintenance issues
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {['', 'Open', 'Assigned', 'In Progress', 'Resolved', 'Escalated'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Supervisor</th>
                <th>Matches</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((issue) => (
                <tr key={issue.id}>
                  <td>
                    <span style={{ fontWeight: '500', cursor: 'pointer', color: 'var(--color-primary)' }} onClick={() => navigate(`/issue/${issue.id}`)}>
                      {issue.title}
                    </span>
                  </td>
                  <td>{issue.location}</td>
                  <td>{issue.category || '-'}</td>
                  <td><span className={`badge badge-${issue.priority?.toLowerCase()}`}>{issue.priority}</span></td>
                  <td>{getStatusBadge(issue.status)}</td>
                  <td>{issue.assigned_supervisor_name || '—'}</td>
                  <td>
                    {issue.duplicate_count > 0 ? (
                      <span className="badge" style={{ backgroundColor: '#E0E7FF', color: '#4F46E5', fontWeight: 'bold' }}>
                        +{issue.duplicate_count}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {issue.assigned_supervisor ? (
                      <button className="btn btn-sm btn-outline" style={{ padding: '4px 8px' }} onClick={() => setAssignModal(issue)}>
                        <UserPlus size={14} /> Reassign
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-primary" onClick={() => setAssignModal(issue)}>
                        <UserPlus size={14} /> Assign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Issue</h3>
              <button className="modal-close" onClick={() => setAssignModal(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
              Assign "<strong>{assignModal.title}</strong>" to a supervisor
            </p>
            <div className="input-group">
              <label className="input-label">Select Supervisor</label>
              <select className="input-field" value={selectedSupervisor} onChange={(e) => setSelectedSupervisor(e.target.value)}>
                <option value="">Choose a supervisor...</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.department || 'General'}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={assigning || !selectedSupervisor}>
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminIssues;
