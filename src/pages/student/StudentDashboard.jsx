import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { issuesAPI } from '../../services/api';
import { PlusCircle, Activity, CheckCircle, Clock, AlertTriangle, Loader2, FileText } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await issuesAPI.list();
        setIssues(res.data.results || res.data);
      } catch (err) {
        console.error('Error fetching issues:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const stats = {
    total: issues.length,
    inProgress: issues.filter(i => i.status === 'In Progress').length,
    resolved: issues.filter(i => i.status === 'Resolved').length,
    pending: issues.filter(i => ['Open', 'Assigned'].includes(i.status)).length,
  };

  const statCards = [
    { label: 'Total Reported', value: stats.total, icon: <Activity size={22} />, bg: 'rgba(0,0,0,0.03)', color: 'var(--color-text-primary)' },
    { label: 'Pending', value: stats.pending, icon: <Clock size={22} />, bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    { label: 'In Progress', value: stats.inProgress, icon: <AlertTriangle size={22} />, bg: 'rgba(250, 240, 137, 0.3)', color: '#D69E2E' },
    { label: 'Resolved', value: stats.resolved, icon: <CheckCircle size={22} />, bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  ];

  const getStatusBadge = (status) => {
    const cls = status?.toLowerCase().replace(/\s+/g, '') || 'open';
    return <span className={`badge badge-${cls}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-accent)' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>My Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Welcome back, {user?.name}
          </p>
        </div>
        <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => navigate('/student/report')}>
          <PlusCircle size={18} /> Report Issue
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="card">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">My Issues</div>
        {issues.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No issues reported yet. Click "Report Issue" to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id} onClick={() => navigate(`/issue/${issue.id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: '500' }}>{issue.title}</td>
                    <td>{issue.location}</td>
                    <td>{issue.category || '-'}</td>
                    <td><span className={`badge badge-${issue.priority?.toLowerCase()}`}>{issue.priority}</span></td>
                    <td>{getStatusBadge(issue.status)}</td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {new Date(issue.created_at).toLocaleDateString()}
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

export default StudentDashboard;
