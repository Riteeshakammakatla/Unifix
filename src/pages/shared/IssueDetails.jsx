import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { issuesAPI } from '../../services/api';
import { Loader2, ArrowLeft, MapPin, Calendar, User, Clock } from 'lucide-react';

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
    fetchIssue();
  }, [id]);

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

  if (error || !issue) {
    return (
      <div className="page-container">
        <div className="card empty-state">
          <p>{error || 'Issue not found'}</p>
          <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginTop: 'var(--space-4)' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Main Info */}
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
                <User size={16} /> Supervisor: {issue.assigned_supervisor_name}
              </div>
            )}
          </div>

          {issue.resolution_notes && (
            <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-2)' }}>Resolution Notes</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>{issue.resolution_notes}</p>
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
              {issue.llm_duplicate_score > 0 && (
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Duplicate Score</div>
                  <div style={{ fontWeight: '600' }}>{(issue.llm_duplicate_score * 100).toFixed(0)}%</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-title">SLA Info</div>
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Response Deadline</div>
                <div style={{ fontSize: 'var(--font-size-sm)' }}>
                  {issue.sla_response_deadline ? new Date(issue.sla_response_deadline).toLocaleString() : '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Resolution Deadline</div>
                <div style={{ fontSize: 'var(--font-size-sm)' }}>
                  {issue.sla_resolution_deadline ? new Date(issue.sla_resolution_deadline).toLocaleString() : '-'}
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
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      {entry.note && (
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>No timeline entries</p>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default IssueDetails;
