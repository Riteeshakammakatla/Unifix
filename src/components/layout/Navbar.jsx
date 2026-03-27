import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bell, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { notificationsAPI } from '../../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await notificationsAPI.list();
        const data = res.data.results || res.data;
        const unread = Array.isArray(data) ? data.filter(n => !n.is_read).length : 0;
        setUnreadCount(unread);
      } catch (err) {
        // silently fail
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="layout-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Link
          to="/notifications"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            padding: 'var(--space-2)',
            color: 'var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            transition: 'all 0.2s',
          }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '0px',
              minWidth: '18px',
              height: '18px',
              backgroundColor: 'var(--color-error)',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '700',
              color: '#fff',
              padding: '0 4px',
            }}>
              {unreadCount}
            </span>
          )}
        </Link>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          borderLeft: '1px solid var(--color-border)',
          paddingLeft: 'var(--space-4)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-secondary))',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '700',
            color: '#fff'
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: '600',
              color: 'var(--color-primary)'
            }}>
              {user?.name || 'Guest'}
            </span>
            <span style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              textTransform: 'capitalize'
            }}>
              {user?.role || 'Guest'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
