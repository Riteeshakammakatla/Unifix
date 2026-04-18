import React, { useState, useEffect } from 'react';
import { materialRequestsAPI } from '../../services/api';
import { Loader2, Package, Check, X } from 'lucide-react';

const AdminMaterialRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await materialRequestsAPI.list();
      setRequests(res.data.results || res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    setUpdating(id);
    try {
      await materialRequestsAPI.update(id, { status });
      await fetchRequests();
    } catch (err) {
      alert('Failed to update request');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status) => {
    const cls = status?.toLowerCase() || 'pending';
    return <span className={`badge badge-${cls}`}>{status}</span>;
  };

  const getUrgencyBadge = (urgency) => {
    const cls = urgency?.toLowerCase() || 'medium';
    return <span className={`badge badge-${cls}`}>{urgency}</span>;
  };

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
        <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Material Requests</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Review and approve material requests from supervisors
        </p>
      </div>

      <div className="card">
        {requests.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <p>No material requests at this time.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Supervisor</th>
                  <th>Reason</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: '500' }}>{req.item_name}</td>
                    <td>{req.quantity}</td>
                    <td>{req.supervisor_name}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.reason}
                    </td>
                    <td>{getUrgencyBadge(req.urgency)}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {req.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleAction(req.id, 'Approved')}
                            disabled={updating === req.id}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleAction(req.id, 'Rejected')}
                            disabled={updating === req.id}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminMaterialRequests;
