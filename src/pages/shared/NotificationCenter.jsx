import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../../services/api';
import { Loader2, Bell, CheckCheck, Mail, MailOpen } from 'lucide-react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.list();
      setNotifications(res.data.results || res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Notifications</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead}>
            <CheckCheck size={16} /> Mark All Read
          </button>
        )}
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} />
            <p>No notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: notif.is_read ? 'transparent' : 'rgba(74,159,229,0.05)',
                  cursor: notif.is_read ? 'default' : 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                <div style={{
                  color: notif.is_read ? 'var(--color-text-secondary)' : 'var(--color-primary)',
                  flexShrink: 0,
                }}>
                  {notif.is_read ? <MailOpen size={20} /> : <Mail size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: notif.is_read ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                    fontWeight: notif.is_read ? '400' : '500',
                  }}>
                    {notif.message}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent)', marginTop: '4px' }}>
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
                {!notif.is_read && (
                  <div style={{
                    width: '8px', height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    flexShrink: 0,
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default NotificationCenter;
