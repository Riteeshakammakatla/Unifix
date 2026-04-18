import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { CheckCircle, XCircle, Clock, Search, Filter, MessageSquare } from 'lucide-react';

const AdminWorkerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await authAPI.getWorkerRequests();
      setRequests(res.data.results || res.data);
    } catch (err) {
      setError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    let reason = '';
    if (action === 'reject') {
      reason = prompt('Enter rejection reason:');
      if (reason === null) return;
    }

    try {
      await authAPI.approveWorkerRequest(id, action, reason);
      fetchRequests();
    } catch (err) {
      alert('Action failed');
    }
  };

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>Worker Requests</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Approve or reject personnel addition requests from supervisors.
          </p>
        </div>
        
        <div className="badge-group">
          <button 
            className={`badge ${filter === 'pending' ? 'badge-high' : 'badge-open'}`} 
            onClick={() => setFilter('pending')}
            style={{ cursor: 'pointer', border: 'none' }}
          >Pending</button>
          <button 
            className={`badge ${filter === 'approved' ? 'badge-low' : 'badge-open'}`}
            onClick={() => setFilter('approved')}
            style={{ cursor: 'pointer', border: 'none' }}
          >Approved</button>
          <button 
            className={`badge ${filter === 'rejected' ? 'badge-critical' : 'badge-open'}`}
            onClick={() => setFilter('rejected')}
            style={{ cursor: 'pointer', border: 'none' }}
          >Rejected</button>
          <button 
            className={`badge ${filter === 'all' ? 'badge-assigned' : 'badge-open'}`}
            onClick={() => setFilter('all')}
            style={{ cursor: 'pointer', border: 'none' }}
          >All</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Worker Name</th>
                <th>Role / Type</th>
                <th>Requested By</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Loading...</td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>No requests found for the selected filter.</td></tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: '600' }}>{req.name}</td>
                    <td>{req.role}</td>
                    <td>{req.supervisor_name}</td>
                    <td>
                      <span className={`badge ${
                        req.status === 'pending' ? 'badge-high' : 
                        req.status === 'approved' ? 'badge-low' : 'badge-critical'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {new Date(req.timestamp).toLocaleString()}
                    </td>
                    <td>
                      {req.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-sm btn-success" 
                            style={{ padding: '6px 12px' }}
                            onClick={() => handleAction(req.id, 'approve')}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button 
                            className="btn btn-sm btn-outline" 
                            style={{ padding: '6px 12px', color: 'var(--color-critical)' }}
                            onClick={() => handleAction(req.id, 'reject')}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      ) : req.status === 'rejected' && req.rejection_reason ? (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-critical)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MessageSquare size={12} /> {req.rejection_reason}
                        </div>
                      ) : (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>No action available</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminWorkerRequests;
