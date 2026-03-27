import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home,
  FileText,
  Package,
  ClipboardList,
  BarChart3,
  Bell,
  LogOut,
  Briefcase,
  PlusCircle,
  Settings,
  Wrench,
} from 'lucide-react';
import './Layout.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'student';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = {
    student: [
      { path: '/student/dashboard', label: 'Dashboard', icon: <Home size={18} /> },
      { path: '/student/report', label: 'Report Issue', icon: <PlusCircle size={18} /> },
      { path: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
    ],
    admin: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: <Home size={18} /> },
      { path: '/admin/issues', label: 'All Issues', icon: <FileText size={18} /> },
      { path: '/admin/material-requests', label: 'Material Requests', icon: <Package size={18} /> },
      { path: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
    ],
    supervisor: [
      { path: '/supervisor/dashboard', label: 'My Issues', icon: <Briefcase size={18} /> },
      { path: '/supervisor/materials', label: 'Material Usage', icon: <ClipboardList size={18} /> },
      { path: '/supervisor/request-material', label: 'Request Material', icon: <Package size={18} /> },
      { path: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
    ],
  };

  const navLinks = links[role] || links.student;

  return (
    <aside className="layout-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--color-accent), #d4817f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(229, 159, 158, 0.3)',
          }}>
            <Wrench color="#fff" size={18} />
          </div>
          <span>UniFix</span>
        </div>
        <div className="sidebar-role">
          {role === 'student' ? 'STUDENT/FACULTY' : role.toUpperCase()} PANEL
        </div>
      </div>

      <nav className="sidebar-nav">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className="sidebar-link"
          style={{ width: '100%', color: 'var(--color-error)' }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
