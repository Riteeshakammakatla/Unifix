import React, { useState, useEffect } from 'react';
import { materialRequestsAPI } from '../../services/api';
import { Send, Loader2, Package, CheckCircle } from 'lucide-react';

const MaterialRequestForm = () => {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ item_name: '', quantity: 1, reason: '', urgency: 'Medium' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_name || !form.reason) return;
    setSubmitting(true);
    try {
      await materialRequestsAPI.create(form);
      await fetchRequests();
      setForm({ item_name: '', quantity: 1, reason: '', urgency: 'Medium' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const cls = status?.toLowerCase() || 'pending';
    return <span className={`badge badge-${cls}`}>{status}</span>;
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Request Material</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Submit a request for unavailable materials
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div className="card">
          <div className="card-title">New Request</div>

          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)',
              padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)',
            }}>
              <CheckCircle size={16} /> Request submitted successfully!
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Item Name</label>
              <input className="input-field" placeholder="e.g. High-pressure Pump" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Quantity</label>
                <input type="number" className="input-field" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })} />
              </div>
              <div className="input-group">
                <label className="input-label">Urgency</label>
                <select className="input-field" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Reason</label>
              <textarea className="input-field" placeholder="Why is this material needed?" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">My Requests</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <Package size={48} />
              <p>No requests submitted yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Urgency</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: '500' }}>{r.item_name}</td>
                      <td>{r.quantity}</td>
                      <td><span className={`badge badge-${r.urgency?.toLowerCase()}`}>{r.urgency}</span></td>
                      <td>{getStatusBadge(r.status)}</td>
                      <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MaterialRequestForm;
