import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI, authAPI, materialsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Briefcase, CheckCircle, Clock, AlertTriangle, Users, Plus, UserCheck } from 'lucide-react';

const SupervisorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [workerRequests, setWorkerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateModal, setUpdateModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [assignedWorker, setAssignedWorker] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('');
  const [requestingWorker, setRequestingWorker] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [issuesRes, workersRes, inventoryRes, requestsRes] = await Promise.all([
        issuesAPI.list(),
        authAPI.getWorkers(),
        materialsAPI.list(),
        authAPI.getWorkerRequests()
      ]);
      setIssues(issuesRes.data.results || issuesRes.data);
      setWorkers(workersRes.data.results || workersRes.data);
      setInventory(inventoryRes.data.results || inventoryRes.data);
      setWorkerRequests(requestsRes.data.results || requestsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      // 1. Update basic status/notes
      const data = { status: newStatus };
      if (notes) data.resolution_notes = notes;
      await issuesAPI.update(updateModal.id, data);
      
      // 2. If assigning to a specific worker
      if (assignedWorker && assignedWorker !== (updateModal.assigned_worker || '')) {
        await issuesAPI.assignMember(updateModal.id, { worker_id: assignedWorker });
      }
      
      await fetchData();
      setUpdateModal(null);
      setNewStatus('');
      setAssignedWorker('');
      setNotes('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update issue');
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestWorker = async (e) => {
    e.preventDefault();
    if (!newWorkerName || !newWorkerRole) {
      alert('Name and Role are required');
      return;
    }
    setRequestingWorker(true);
    try {
      await authAPI.createWorkerRequest({
        name: newWorkerName,
        role: newWorkerRole
      });
      setNewWorkerName('');
      setNewWorkerRole('');
      await fetchData();
      alert('Worker request submitted for admin approval.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to request worker.');
    } finally {
      setRequestingWorker(false);
    }
  };

  const getStatusBadge = (status) => {
    const cls = status?.toLowerCase().replace(/\s+/g, '') || 'open';
    return <span className={`badge badge-${cls}`}>{status}</span>;
  };

  const getAvailabilityColor = (status) => {
    switch (status) {
      case 'free': return 'var(--color-success)';
      case 'assigned': return '#FB923C';
      case 'busy': return 'var(--color-error)';
      default: return 'var(--color-text-secondary)';
    }
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
    { label: 'Approved Workers', value: workers.length, icon: <Users size={22} />, bg: 'rgba(198,246,213,0.3)', color: 'var(--color-success)' },
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
        <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Supervisor Dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Manage your maintenance team and assigned issues
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

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Issues List */}
        <div className="card">
          <div className="card-title">Assigned Issues</div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
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
                    <td>{getStatusBadge(issue.status)}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => { 
                        setUpdateModal(issue); 
                        setNewStatus(issue.status);
                        setAssignedWorker(issue.assigned_worker || '');
                      }}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
                {issues.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-secondary)' }}>No active issues assigned.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Workers List & Quick Request */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <div className="card-title">Approved Workers</div>
            <div style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
              {workers.map(w => (
                <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>{w.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{w.role_type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: w.status === 'free' ? 'var(--color-success)' : 'var(--color-warning)', textTransform: 'uppercase' }}>
                      {w.status}
                    </div>
                  </div>
                </div>
              ))}
              {workers.length === 0 && (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>No workers assigned yet.</p>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
              <div style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>Request Worker Addition</div>
              <form onSubmit={handleRequestWorker} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Worker Name" 
                  style={{ fontSize: '12px' }}
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  required
                />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Role (e.g. Electrician)" 
                  style={{ fontSize: '12px' }}
                  value={newWorkerRole}
                  onChange={(e) => setNewWorkerRole(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '8px' }} disabled={requestingWorker}>
                  {requestingWorker ? <Loader2 size={14} className="spin" /> : 'Submit Request'}
                </button>
              </form>
            </div>
          </div>
          
          <div className="card" style={{ background: 'var(--color-primary)', color: 'white' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Inventory Tip</div>
            <p style={{ fontSize: '12px', opacity: 0.9 }}>
              You can now manage your materials, tools, and usage records in the dedicated <strong>Inventory</strong> page from the sidebar.
            </p>
          </div>
        </div>
      </div>

      {/* Management Modal */}
      {updateModal && (
        <div className="modal-overlay" onClick={() => setUpdateModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Manage Issue # {updateModal.id}</h3>
              <button className="modal-close" onClick={() => setUpdateModal(null)}>✕</button>
            </div>
            
            <p style={{ fontWeight: '600', marginBottom: 'var(--space-4)' }}>{updateModal.title}</p>

            <div className="input-group">
              <label className="input-label">Assign to Approved Worker</label>
              <select className="input-field" value={assignedWorker} onChange={(e) => setAssignedWorker(e.target.value)}>
                <option value="">Select a worker...</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.role_type} - {w.status})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Execution Status</label>
              <select className="input-field" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Status Notes</label>
              <textarea 
                className="input-field" 
                placeholder="Log activity or resolution notes..." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={3} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setUpdateModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={updating}>
                {updating ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SupervisorDashboard;
