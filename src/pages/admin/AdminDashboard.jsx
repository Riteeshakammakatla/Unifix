import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI, authAPI } from '../../services/api';
import { Activity, AlertOctagon, CheckCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CHART_COLORS = ['#F7CBCA', '#BEE3F8', '#C6F6D5', '#FEEBC8', '#E9D8FD', '#FAF089'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [issues, setIssues] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [additionLogs, setAdditionLogs] = useState([]);
  const [workerRequests, setWorkerRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Core Issues & Analytics
      try {
        const analyticsReq = issuesAPI.analytics().catch(err => {
          console.error('[ADMIN] Analytics fetch failed:', err);
          return { data: { total: 0, priority_distribution: {}, categories: [], statuses: [] } };
        });
        
        const issuesReq = issuesAPI.list().catch(err => {
          console.error('[ADMIN] Issues fetch failed:', err);
          return { data: { results: [] } };
        });

        const [aRes, iRes] = await Promise.all([analyticsReq, issuesReq]);
        
        setAnalytics(aRes.data || null);
        const issueData = iRes.data?.results || iRes.data || [];
        setIssues(Array.isArray(issueData) ? issueData : []);
      } catch (err) {
        console.error('[ADMIN] Core fetch block failed:', err);
      }

      // Hierarchy Data
      try {
        const supReq = authAPI.getSupervisors().catch(err => {
          console.error('[ADMIN] Supervisors fetch failed:', err);
          return { data: [] };
        });
        
        const logsReq = authAPI.getAdditionLogs().catch(err => {
          console.error('[ADMIN] Logs fetch failed:', err);
          return { data: [] };
        });

        const [sRes, lRes] = await Promise.all([supReq, logsReq]);
        
        setSupervisors(Array.isArray(sRes.data) ? sRes.data : (sRes.data?.results || []));
        setAdditionLogs(Array.isArray(lRes.data) ? lRes.data : (lRes.data?.results || []));

        // Worker Requests
        const wrRes = await authAPI.getWorkerRequests();
        setWorkerRequests(wrRes.data.results || wrRes.data || []);
      } catch (err) {
        console.error('[ADMIN] Hierarchy/Worker fetch block failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const statCards = [
    { label: 'Total Issues', value: analytics?.total || 0, icon: <Activity size={22} />, bg: 'var(--color-border-light)', color: 'var(--color-primary)' },
    { label: 'Active', value: issues.filter(i => ['Open', 'Assigned', 'In Progress'].includes(i.status)).length, icon: <Clock size={22} />, bg: 'rgba(247, 203, 202, 0.2)', color: 'var(--color-accent)' },
    { label: 'SLA Violations', value: analytics?.sla_violations || 0, icon: <AlertOctagon size={22} />, bg: 'var(--color-error-bg)', color: 'var(--color-error)' },
    { label: 'Resolved', value: issues.filter(i => i.status === 'Resolved').length, icon: <CheckCircle size={22} />, bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  ];

  const categoryData = analytics?.categories || [];
  const statusData = analytics?.statuses || [];

  const customTooltipStyle = {
    backgroundColor: 'var(--color-surface)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 16px',
    color: 'var(--color-text-primary)',
    fontSize: '13px',
    boxShadow: 'var(--shadow-md)',
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Monitor campus maintenance — Avg Resolution: {analytics?.avg_resolution_hours || 0}h
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

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-title">Issues by Category</div>
          <div className="chart-container">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={65}
                    paddingAngle={3}
                    label={({ name }) => `${name}`}
                  >
                    {categoryData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No category data yet</p></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Issues by Status</div>
          <div className="chart-container">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} barSize={40}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {statusData.map((entry, idx) => {
                      const colorMap = { Open: '#F7CBCA', Assigned: '#BEE3F8', 'In Progress': '#FAF089', Resolved: '#C6F6D5', Escalated: '#FED7D7' };
                      return <Cell key={idx} fill={colorMap[entry.name] || CHART_COLORS[idx % CHART_COLORS.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No status data yet</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Team Growth & Audit Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-title">Supervisor Management</div>
          <div className="table-container">
            <table className="table" style={{ fontSize: '13px' }}>
              <thead><tr><th>Supervisor</th><th>Email</th><th>Dept</th><th>Workers (Count)</th><th>Workers List</th></tr></thead>
              <tbody>
                {supervisors.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: '600' }}>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.department || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ backgroundColor: 'var(--color-border-light)', color: 'var(--color-primary)', minWidth: '30px', textAlign: 'center' }}>
                        {s.workers_count || 0}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {s.workers_list?.length > 0 ? s.workers_list.map(w => w.name).join(', ') : 'No workers'}
                    </td>
                  </tr>
                ))}
                {supervisors.length === 0 && (
                  <tr style={{ color: 'var(--color-text-secondary)' }}><td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>No supervisors found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Pending Worker Requests</div>
          <div className="table-container">
            <table className="table" style={{ fontSize: '12px' }}>
              <thead><tr><th>Worker Name</th><th>Role</th><th>Requested By</th><th>Action</th></tr></thead>
              <tbody>
                {workerRequests.filter(r => r.status === 'pending').map(req => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: '600' }}>{req.name}</td>
                    <td><span className="badge badge-assigned">{req.role}</span></td>
                    <td>{req.supervisor_name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          className="btn btn-sm btn-success" 
                          style={{ padding: '4px 8px', fontSize: '10px' }}
                          onClick={async () => {
                            try {
                              await authAPI.approveWorkerRequest(req.id, 'approve');
                              window.location.reload();
                            } catch (err) { alert('Approval failed'); }
                          }}
                        >Approve</button>
                        <button 
                          className="btn btn-sm btn-outline" 
                          style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--color-error)' }}
                          onClick={async () => {
                            const reason = prompt('Reason for rejection?');
                            if (reason) {
                              try {
                                await authAPI.approveWorkerRequest(req.id, 'reject', reason);
                                window.location.reload();
                              } catch (err) { alert('Rejection failed'); }
                            }
                          }}
                        >Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {workerRequests.filter(r => r.status === 'pending').length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No pending requests.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Issues Table */}
      <div className="card">
        <div className="card-title">Recent Issues</div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Supervisor</th>
                <th>Matches</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {issues.slice(0, 10).map((issue) => (
                <tr key={issue.id} onClick={() => navigate(`/issue/${issue.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: '500' }}>{issue.title}</td>
                  <td>{issue.location}</td>
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
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {new Date(issue.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminDashboard;
