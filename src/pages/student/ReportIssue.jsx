import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI } from '../../services/api';
import { Send, Loader2, CheckCircle, Upload } from 'lucide-react';

const ReportIssue = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', location: '' });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [llmResult, setLlmResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.location) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('location', form.location);
      if (image) formData.append('image', image);

      const res = await issuesAPI.create(formData);
      const issue = res.data;

      setLlmResult({
        category: issue.category || issue.llm_category,
        priority: issue.priority || issue.llm_priority,
        duplicate_score: issue.llm_duplicate_score,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'var(--color-success-bg)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-6)' }}>
            <CheckCircle size={40} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', marginBottom: 'var(--space-3)' }}>
            Report Submitted!
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>
            Your maintenance request has been recorded and classified by UniFix.
          </p>

          {llmResult && (
            <div style={{
              display: 'inline-flex',
              gap: 'var(--space-8)',
              backgroundColor: 'var(--color-background)',
              padding: 'var(--space-5) var(--space-8)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-8)',
              border: '1px solid var(--color-border-light)',
            }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.05em', marginBottom: '4px' }}>Category</div>
                <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{llmResult.category}</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-8)' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.05em', marginBottom: '4px' }}>Priority</div>
                <div style={{ fontWeight: '600' }}>
                  <span className={`badge badge-${llmResult.priority?.toLowerCase()}`}>{llmResult.priority}</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <button className="btn btn-secondary" style={{ padding: '12px 24px' }} onClick={() => navigate('/student/dashboard')}>
              Back to Dashboard
            </button>
            <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => { setSuccess(false); setForm({ title: '', description: '', location: '' }); setImage(null); setLlmResult(null); }}>
              Report Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>Report an Issue</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
          Describe the problem — UniFix AI will classify and route it to the right team.
        </p>
      </div>

      <div className="card" style={{ maxWidth: '640px' }}>
        {error && (
          <div style={{
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--font-size-sm)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Title *</label>
            <input
              type="text"
              name="title"
              className="input-field"
              placeholder="Brief title of the issue"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Description *</label>
            <textarea
              name="description"
              className="input-field"
              placeholder="Describe the problem in detail. The AI will analyze this to classify the issue."
              value={form.description}
              onChange={handleChange}
              rows={5}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Location *</label>
            <input
              type="text"
              name="location"
              className="input-field"
              placeholder="e.g. Hostel A, 3rd Floor, Room 301"
              value={form.location}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Photo (Optional)</label>
            <div style={{
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => document.getElementById('file-input').click()}
            >
              <Upload size={24} style={{ margin: '0 auto var(--space-2)', color: 'var(--color-text-secondary)' }} />
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                {image ? image.name : 'Click to upload a photo'}
              </p>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setImage(e.target.files[0])}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: 'var(--space-3)', marginTop: 'var(--space-2)' }}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            {loading ? 'Submitting & Classifying...' : 'Submit Issue'}
          </button>
        </form>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ReportIssue;
