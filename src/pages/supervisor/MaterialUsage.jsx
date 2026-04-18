import React, { useState, useEffect } from 'react';
import { materialUsageAPI, issuesAPI } from '../../services/api';
import { Loader2, Plus, ClipboardList } from 'lucide-react';

const MaterialUsage = () => {
  const [usages, setUsages] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ issue: '', item_name: '', quantity: 1, material_type: 'Consumable', status: 'Consumed' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usageRes, issueRes] = await Promise.all([
        materialUsageAPI.list(),
        issuesAPI.list(),
      ]);
      setUsages(usageRes.data.results || usageRes.data);
      setIssues(issueRes.data.results || issueRes.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.issue || !form.item_name) return;
    setSubmitting(true);
    try {
      await materialUsageAPI.create(form);
      await fetchData();
      setForm({ issue: '', item_name: '', quantity: 1, material_type: 'Consumable', status: 'Consumed' });
      setShowForm(false);
    } catch (err) {
      alert('Failed to record material usage');
    } finally {
      setSubmitting(false);
    }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Material Usage</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Record materials used during repairs
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Record Usage
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 'var(--space-6)', maxWidth: '560px' }}>
          <div className="card-title">Record Material Usage</div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Issue</label>
              <select className="input-field" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })}>
                <option value="">Select issue...</option>
                {issues.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Item Name</label>
              <input className="input-field" placeholder="e.g. PVC Pipe" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Quantity</label>
                <input type="number" className="input-field" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })} />
              </div>
              <div className="input-group">
                <label className="input-label">Type</label>
                <select className="input-field" value={form.material_type} onChange={(e) => setForm({ ...form, material_type: e.target.value })}>
                  <option value="Consumable">Consumable</option>
                  <option value="Reusable">Reusable</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Status</label>
                <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="Consumed">Consumed</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-title">Usage History</div>
        {usages.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} />
            <p>No material usage recorded yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Issue</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {usages.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: '500' }}>{u.item_name}</td>
                    <td>{u.quantity}</td>
                    <td><span className={`badge badge-${u.material_type === 'Consumable' ? 'medium' : 'low'}`}>{u.material_type}</span></td>
                    <td><span className={`badge badge-${u.status === 'Consumed' ? 'escalated' : 'resolved'}`}>{u.status}</span></td>
                    <td>Issue #{u.issue}</td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
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

export default MaterialUsage;
