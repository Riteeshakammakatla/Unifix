import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { Users, UserMinus, UserCheck, Shield, Filter, RefreshCw } from 'lucide-react';

const AdminWorkerManagement = () => {
  const [workers, setWorkers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingWorker, setEditingWorker] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedWorkerForLogs, setSelectedWorkerForLogs] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [workersRes, supervisorsRes, logsRes] = await Promise.all([
        authAPI.getWorkers(),
        authAPI.getSupervisors(),
        authAPI.getWorkerAuditLogs().catch(() => ({ data: [] }))
      ]);
      setWorkers(workersRes.data.results || workersRes.data);
      setSupervisors(supervisorsRes.data.results || supervisorsRes.data);
      setAuditLogs(logsRes.data.results || logsRes.data || []);
    } catch (err) {
      console.error('Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (worker) => {
    try {
      await authAPI.updateWorker(worker.id, { is_active: !worker.is_active });
      fetchData();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleReassign = async (id, supervisorId) => {
    try {
      await authAPI.updateWorker(id, { supervisor: supervisorId });
      setEditingWorker(null);
      fetchData();
    } catch (err) {
      alert('Reassignment failed');
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>Worker Management</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Manage all active workers, change assignments, or adjust availability.
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role / Type</th>
                <th>Current Supervisor</th>
                <th>Status</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Loading...</td></tr>
              ) : workers.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>No workers managed yet.</td></tr>
              ) : (
                workers.map(worker => (
                  <tr key={worker.id}>
                    <td style={{ fontWeight: '600' }}>{worker.name}</td>
                    <td><span className="badge badge-open">{worker.role_type}</span></td>
                    <td>
                      {editingWorker === worker.id ? (
                        <select 
                          className="input-field" 
                          style={{ fontSize: '12px', padding: '4px' }}
                          onChange={(e) => handleReassign(worker.id, e.target.value)}
                          onBlur={() => setEditingWorker(null)}
                          autoFocus
                          defaultValue={worker.supervisor}
                        >
                          {supervisors.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {worker.supervisor_name}
                          <button 
                            className="btn btn-sm btn-ghost" 
                            style={{ padding: '2px', color: 'var(--color-primary)' }}
                            onClick={() => setEditingWorker(worker.id)}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${worker.status === 'free' ? 'badge-low' : 'badge-high'}`}>
                        {worker.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => handleToggleActive(worker)}
                      >
                        {worker.is_active ? 
                          <UserCheck className="text-success" size={20} /> : 
                          <UserMinus className="text-error" size={20} />
                        }
                      </button>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => setSelectedWorkerForLogs(worker)}
                      >View Logs</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedWorkerForLogs && (
        <div className="modal-overlay" onClick={() => setSelectedWorkerForLogs(null)}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>Logs for {selectedWorkerForLogs.name}</h3>
            {auditLogs.filter(log => log.target_worker === selectedWorkerForLogs.id).length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px' }}>No logs found for this worker.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {auditLogs.filter(log => log.target_worker === selectedWorkerForLogs.id).map(log => (
                  <div key={log.id} style={{ padding: '12px', borderLeft: '3px solid var(--color-primary)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '0 8px 8px 0' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>{log.action}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>By: {log.performed_by_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{new Date(log.timestamp).toLocaleString()}</div>
                    {log.details && <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--color-text-primary)' }}>{log.details}</div>}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="btn btn-outline" onClick={() => setSelectedWorkerForLogs(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkerManagement;
