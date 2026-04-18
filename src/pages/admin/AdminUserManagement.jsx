import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { ShieldCheck, UserPlus, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import PasswordInput from '../../components/ui/PasswordInput';

const AdminUserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [resetPasswordModal, setResetPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    first_name: '',
    last_name: '',
    department: '',
    phone: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.list();
      setUsers(res.data.results || res.data);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await usersAPI.create(formData);
      setSuccess('User created successfully');
      setShowModal(false);
      setFormData({
        email: '', password: '', role: 'student', 
        first_name: '', last_name: '', department: '', phone: ''
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.email?.[0] || err.detail || 'Failed to create user');
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) {
      setError("You cannot delete your own account");
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await usersAPI.delete(id);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return;
    try {
      await usersAPI.resetPassword(resetPasswordModal.id, newPassword);
      setSuccess(`Password reset successfully for ${resetPasswordModal.email}`);
      setResetPasswordModal(null);
      setNewPassword('');
    } catch (err) {
      setError('Failed to reset password');
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'badge-critical',
      supervisor: 'badge-high',
      student: 'badge-medium'
    };
    return <span className={`badge ${colors[role] || 'badge-open'}`}>{role}</span>;
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck className="text-primary" /> User Management
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Create and manage system access for Supervisors and Students.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#FEF2F2', color: '#B91C1C', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}
      
      {success && (
        <div style={{ padding: '16px', backgroundColor: '#F0FDF4', color: '#15803D', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={20} /> {success}
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="card-title">System Users</div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: '500' }}>{user.name || `${user.first_name} ${user.last_name}`}</td>
                    <td>{user.email}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{user.department || '—'}</td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          setResetPasswordModal(user);
                          setNewPassword('');
                        }}
                      >
                        Reset Password
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px 12px', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === currentUser.id}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create New User</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field" required />
              </div>
              
              <div className="input-group">
                <label className="input-label">Password * (min 6 chars)</label>
                <PasswordInput 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  className="input-field" 
                  required 
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Role *</label>
                <select name="role" value={formData.role} onChange={handleInputChange} className="input-field" required>
                  <option value="student">Student / Faculty</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">First Name</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} className="input-field" />
                </div>
                <div className="input-group">
                  <label className="input-label">Last Name</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} className="input-field" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Department (Supervisors only)</label>
                <input type="text" name="department" value={formData.department} onChange={handleInputChange} className="input-field" placeholder="e.g. Plumbing, Electrical" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Reset Password</h2>
              <button onClick={() => setResetPasswordModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            
            <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Resetting password for <strong>{resetPasswordModal.email}</strong>.
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="input-group">
                <label className="input-label">New Password * (min 6 chars)</label>
                <PasswordInput 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="input-field" 
                  required 
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setResetPasswordModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
