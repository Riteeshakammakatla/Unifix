import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI } from '../../services/api';
import { Activity, AlertOctagon, CheckCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CHART_COLORS = ['#F7CBCA', '#BEE3F8', '#C6F6D5', '#FEEBC8', '#E9D8FD', '#FAF089'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, issuesRes] = await Promise.all([
          issuesAPI.analytics(),
          issuesAPI.list(),
        ]);
        setAnalytics(analyticsRes.data);
        setIssues(issuesRes.data.results || issuesRes.data);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
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
