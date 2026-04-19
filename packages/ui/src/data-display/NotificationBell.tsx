'use client';

import React, { useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'agent_action' | 'system' | 'alert';
  isRead: boolean;
  timestamp: string;
  actionUrl?: string;
}

interface NotificationBellProps {
  notifications?: Notification[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'RecruiterIQ needs approval', message: 'Submit Maria Garcia for DevOps Engineer role', type: 'agent_action', isRead: false, timestamp: new Date(Date.now() - 300000).toISOString(), actionUrl: '/agents/recruiter-iq' },
  { id: 'n2', title: 'BenchIQ alert', message: 'Tom Wilson assignment ending in 30 days', type: 'alert', isRead: false, timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'n3', title: 'ClientIQ churn risk', message: 'DataSync invoice overdue 15 days', type: 'alert', isRead: false, timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 'n4', title: 'RecruiterIQ completed', message: 'Found 8 candidates for Java Developer', type: 'agent_action', isRead: true, timestamp: new Date(Date.now() - 14400000).toISOString() },
];

export function NotificationBell({ notifications, onMarkRead, onMarkAllRead }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const items = notifications || MOCK_NOTIFICATIONS;
  const unreadCount = items.filter(n => !n.isRead).length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, padding: 4,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            backgroundColor: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700,
            width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 8,
          width: 360, maxHeight: 400, overflow: 'auto',
          backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={onMarkAllRead} style={{ fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>
          {items.map(n => (
            <div
              key={n.id}
              onClick={() => onMarkRead?.(n.id)}
              style={{
                padding: '10px 16px', borderBottom: '1px solid #f9fafb', cursor: 'pointer',
                backgroundColor: n.isRead ? 'transparent' : '#f0f9ff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: n.isRead ? 400 : 600, fontSize: 13 }}>{n.title}</span>
                <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
