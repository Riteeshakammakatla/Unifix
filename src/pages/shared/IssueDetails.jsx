import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, MapPin, Calendar, User, Clock, ShieldCheck, ChevronRight, Package } from 'lucide-react';
import { issuesAPI, authAPI, materialsAPI, materialUsageAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Assignment State
  const [supervisors, setSupervisors] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSup, setSelectedSup] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Material Usage State
  const [userInventory, setUserInventory] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [useQty, setUseQty] = useState(1);
  const [loggingUsage, setLoggingUsage] = useState(false);

  useEffect(() => {
    fetchIssue();
    if (currentUser?.role === 'admin') {
      fetchSupervisors();
    }
    if (currentUser?.role === 'supervisor' || currentUser?.role === 'staff') {
      fetchInventory();
    }
  }, [id, currentUser]);

  const fetchIssue = async () => {
    try {
      const res = await issuesAPI.get(id);
      setIssue(res.data);
    } catch (err) {
      setError('Issue not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await authAPI.getSupervisors();
      setSupervisors(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch supervisors');
    }
  };
  const fetchInventory = async () => {
    try {
      const res = await materialsAPI.list();
      setUserInventory(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch inventory');
    }
  };

  const handleLogUsage = async () => {
    if (!selectedMaterial) return;
    const item = userInventory.find(i => i.id === parseInt(selectedMaterial));
    if (!item) return;

    if (item.available_quantity < useQty) {
      alert(`Insufficient stock. Only ${item.available_quantity} available.`);
      return;
    }

    setLoggingUsage(true);
    try {
      await materialUsageAPI.create({
        issue: id,
        material: selectedMaterial,
        quantity: useQty
      });
      await fetchIssue();
      await fetchInventory();
      setSelectedMaterial('');
      setUseQty(1);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to log usage');
    } finally {
      setLoggingUsage(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedSup) return;
    setAssigning(true);
    try {
      await issuesAPI.assign(id, selectedSup);
      await fetchIssue();
      setSelectedSup('');
      alert('Supervisor assigned successfully');
    } catch (err) {
      alert('Failed to assign supervisor');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusBadge = (status) => {
    const cls = status?.toLowerCase().replace(/\s+/g, '') || 'open';
    return <span className={`badge badge-${cls}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    );
  }

  const departments = [...new Set(supervisors.map(s => s.department).filter(Boolean))];
  const filteredSupervisors = selectedDept 
    ? supervisors.filter(s => s.department === selectedDept)
    : supervisors;

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Main Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-4)' }}>
              <h1 style={{ fontSize: 'var(--font-size-xl)' }}>{issue.title}</h1>
              {getStatusBadge(issue.status)}
            </div>

            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', lineHeight: '1.7' }}>
              {issue.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                <MapPin size={16} /> {issue.location}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                <Calendar size={16} /> {new Date(issue.created_at).toLocaleString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                <User size={16} /> Reported by: {issue.created_by_name}
              </div>
              {issue.assigned_supervisor_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  <ShieldCheck size={16} /> Supervisor: {issue.assigned_supervisor_name}
                </div>
              )}
            </div>

            {issue.completed_by_name && (
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-success)', fontWeight: '500', fontSize: 'var(--font-size-sm)' }}>
                <User size={16} /> Assigned Staff: {issue.completed_by_name}
              </div>
            )}
          </div>

          {/* Admin Assignment Portal */}
          {currentUser?.role === 'admin' && (
            <div className="card" style={{ border: '1px solid var(--color-primary-light)', backgroundColor: 'rgba(74, 159, 229, 0.05)' }}>
              <div className="card-title">Assign Supervisor</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--space-3)', alignItems: 'end' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ fontSize: '11px' }}>Department</label>
                  <select className="input-field" value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setSelectedSup(''); }}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ fontSize: '11px' }}>Supervisor</label>
                  <select className="input-field" value={selectedSup} onChange={(e) => setSelectedSup(e.target.value)}>
                    <option value="">Select Supervisor...</option>
                    {filteredSupervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedSup || assigning}>
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          )}

          {issue.resolution_notes && (
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-2)' }}>Resolution Details</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>{issue.resolution_notes}</p>
            </div>
          )}

          {/* Material Usage Section (Supervisor/Staff) */}
          {(currentUser?.role === 'supervisor' || currentUser?.role === 'staff') && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: 'var(--font-size-base)' }}>Materials Used</h3>
                <Package size={18} color="var(--color-primary)" />
              </div>

              <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ fontSize: '11px' }}>Select Material</label>
                    <select 
                      className="input-field" 
                      id="material-select"
                      value={selectedMaterial} 
                      onChange={(e) => setSelectedMaterial(e.target.value)}
                    >
                      <option value="">-- Choose from Inventory --</option>
                      {userInventory.map(item => (
                        <option key={item.id} value={item.id} disabled={item.available_quantity <= 0}>
                          {item.material_name} ({item.available_quantity} avail)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ fontSize: '11px' }}>Qty</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      min="1"
                      value={useQty}
                      onChange={(e) => setUseQty(parseInt(e.target.value))}
                    />
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleLogUsage}
                    disabled={!selectedMaterial || loggingUsage}
                  >
                    {loggingUsage ? '...' : 'Add'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {issue.material_usage?.map((usage, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                    <span>{usage.material_name} x {usage.quantity}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{usage.material_type}</span>
                  </div>
                ))}
                {(!issue.material_usage || issue.material_usage.length === 0) && (
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>No materials logged for this issue.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card">
            <div className="card-title">Classification</div>
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Category</div>
                <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{issue.category || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Priority</div>
                <span className={`badge badge-${issue.priority?.toLowerCase()}`}>{issue.priority}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">SLA Status</div>
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Deadline</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: issue.is_escalated ? 'var(--color-error)' : 'inherit' }}>
                  {issue.deadline_time ? new Date(issue.deadline_time).toLocaleString() : '-'}
                  {issue.is_escalated && ' (ESCALATED)'}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-title">Timeline</div>
            {issue.timeline && issue.timeline.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {issue.timeline.map((entry, idx) => (
                  <div key={idx} style={{
                    display: 'flex', gap: 'var(--space-3)', alignItems: 'start',
                    paddingLeft: 'var(--space-4)', borderLeft: '2px solid var(--color-border)',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {getStatusBadge(entry.status)}
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {entry.note && (
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>No activity logged</p>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default IssueDetails;
