import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LogIn, 
  AlertCircle, 
  Loader2, 
  Wrench, 
  ShieldCheck, 
  Briefcase, 
  GraduationCap,
  ArrowLeft
} from 'lucide-react';

const Login = () => {
  const [step, setStep] = useState(0); // 0: role selection, 1: login form
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  if (isAuthenticated && user) {
    const dashboardMap = {
      admin: '/admin/dashboard',
      supervisor: '/supervisor/dashboard',
      student: '/student/dashboard',
    };
    return <Navigate to={dashboardMap[user.role] || '/student/dashboard'} replace />;
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep(1);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = await login(email, password);
      const dashboardMap = {
        admin: '/admin/dashboard',
        supervisor: '/supervisor/dashboard',
        student: '/student/dashboard',
      };
      navigate(dashboardMap[userData.role] || '/student/dashboard');
    } catch (err) {
      setError(err.detail || 'Invalid credentials for this role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { 
      id: 'admin', 
      title: 'Administrator', 
      icon: <ShieldCheck size={32} />, 
      desc: 'System management & analytics',
      color: '#4F46E5' 
    },
    { 
      id: 'supervisor', 
      title: 'Supervisor', 
      icon: <Briefcase size={32} />, 
      desc: 'Issue assignment & monitoring',
      color: '#10B981' 
    },
    { 
      id: 'student', 
      title: 'Student/Faculty', 
      icon: <GraduationCap size={32} />, 
      desc: 'Report and track maintenance issues',
      color: '#F59E0B' 
    },
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-background)',
      padding: 'var(--space-4)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: step === 0 ? '800px' : '420px',
        transition: 'max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 'var(--space-4)',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-accent), #d4817f)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(229, 159, 158, 0.3)',
            }}>
              <Wrench color="#fff" size={24} />
            </div>
          </div>
          <h1 style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: '800',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-1)',
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.02em',
          }}>
            UniFix
          </h1>
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500',
          }}>
            Campus Issue Management System
          </p>
        </div>

        {step === 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-6)',
            animation: 'fadeIn 0.5s ease-out',
          }}>
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className="role-card"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '24px',
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  outline: 'none',
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  backgroundColor: `${role.color}10`,
                  color: role.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-2)',
                }}>
                  {role.icon}
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: 'var(--font-size-lg)', 
                    fontWeight: '700',
                    color: 'var(--color-text-primary)',
                    marginBottom: '4px'
                  }}>{role.title}</h3>
                  <p style={{ 
                    fontSize: 'var(--font-size-xs)', 
                    color: 'var(--color-text-secondary)',
                    fontWeight: '500'
                  }}>{role.desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '24px',
            padding: 'var(--space-10)',
            boxShadow: 'var(--shadow-xl)',
            animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <button 
              onClick={() => setStep(0)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: '600',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginBottom: 'var(--space-6)',
                padding: '4px 0',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-accent)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
            >
              <ArrowLeft size={14} /> Back to selection
            </button>

            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', marginBottom: '4px' }}>
                {roles.find(r => r.id === selectedRole)?.title} Login
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Enter your authorized credentials below.
              </p>
            </div>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                backgroundColor: '#FFF1F2',
                color: '#E11D48',
                padding: 'var(--space-4)',
                borderRadius: '16px',
                marginBottom: 'var(--space-6)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: '500',
                border: '1px solid #FFE4E6',
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: '600', fontSize: '13px' }}>Institutional Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="name@unifix.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  style={{ 
                    backgroundColor: '#F9FAFB',
                    height: '50px',
                    borderRadius: '14px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontWeight: '600', fontSize: '13px' }}>Security Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ 
                    backgroundColor: '#F9FAFB',
                    height: '50px',
                    borderRadius: '14px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '16px',
                  marginTop: 'var(--space-4)',
                  fontSize: '15px',
                  fontWeight: '700',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 20px rgba(247, 203, 202, 0.4)',
                }}
              >
                {loading ? (
                  <Loader2 size={20} className="spin" />
                ) : (
                  <>Sign In <LogIn size={18} /></>
                )}
              </button>
            </form>
          </div>
        )}

        <p style={{
          marginTop: 'var(--space-12)',
          fontSize: '11px',
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
          letterSpacing: '0.02em',
          opacity: 0.6,
        }}>
          &copy; {new Date().getFullYear()} UNIFIX SYSTEM. ALL RIGHTS RESERVED.
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .role-card:hover {
          transform: translateY(-8px);
          border-color: var(--color-accent) !important;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08) !important;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
