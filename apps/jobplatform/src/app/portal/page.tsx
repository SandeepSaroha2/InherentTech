'use client';

import { useState } from 'react';

interface KPICard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

export default function PortalDashboard() {
  const [activityItems] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'placement',
      description: 'Started placement at Tech Solutions Inc.',
      timestamp: '2 days ago',
      status: 'active',
    },
    {
      id: '2',
      type: 'document',
      description: 'Completed I-9 verification',
      timestamp: '5 days ago',
      status: 'completed',
    },
    {
      id: '3',
      type: 'timesheet',
      description: 'Submitted timesheet for week of Mar 24',
      timestamp: '1 week ago',
      status: 'submitted',
    },
    {
      id: '4',
      type: 'interview',
      description: 'Interview scheduled with Cloud Systems',
      timestamp: '1 week ago',
      status: 'scheduled',
    },
    {
      id: '5',
      type: 'document',
      description: 'W-4 form approved',
      timestamp: '2 weeks ago',
      status: 'completed',
    },
  ]);

  const kpiCards: KPICard[] = [
    {
      title: 'Active Placements',
      value: 2,
      subtitle: 'Currently placed',
      icon: '💼',
      color: '#4f46e5',
    },
    {
      title: 'Pending Timesheets',
      value: 1,
      subtitle: 'Awaiting submission',
      icon: '⏱️',
      color: '#f59e0b',
    },
    {
      title: 'Documents to Sign',
      value: 3,
      subtitle: 'Action required',
      icon: '📋',
      color: '#ef4444',
    },
    {
      title: 'Upcoming Interviews',
      value: 1,
      subtitle: 'In next 7 days',
      icon: '📅',
      color: '#10b981',
    },
  ];

  const getActivityIcon = (type: string): string => {
    const icons: Record<string, string> = {
      placement: '💼',
      document: '📄',
      timesheet: '⏱️',
      interview: '📞',
    };
    return icons[type] || '📌';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: '#10b981',
      completed: '#10b981',
      submitted: '#3b82f6',
      scheduled: '#f59e0b',
      pending: '#ef4444',
    };
    return colors[status] || '#64748b';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {kpiCards.map((card: typeof kpiCards[0]) => (
          <div
            key={card.title}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                  {card.title}
                </p>
                <p
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: card.color,
                  }}
                >
                  {card.value}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  {card.subtitle}
                </p>
              </div>
              <span style={{ fontSize: '32px' }}>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
            Recent Activity
          </h3>
        </div>

        <div>
          {activityItems.map((item: typeof activityItems[0]) => (
            <div
              key={item.id}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                gap: '12px',
                alignItems: 'start',
              }}
            >
              <span style={{ fontSize: '20px', marginTop: '2px' }}>
                {getActivityIcon(item.type)}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                  {item.description}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  {item.timestamp}
                </p>
              </div>
              <span
                style={{
                  padding: '4px 8px',
                  backgroundColor: getStatusColor(item.status) + '20',
                  color: getStatusColor(item.status),
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
          Quick Actions
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          <button
            style={{
              padding: '12px 16px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4338ca';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5';
            }}
          >
            📋 Submit Timesheet
          </button>
          <button
            style={{
              padding: '12px 16px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
            }}
          >
            📄 Review Documents
          </button>
          <button
            style={{
              padding: '12px 16px',
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#d97706';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f59e0b';
            }}
          >
            💼 View Placements
          </button>
        </div>
      </div>
    </div>
  );
}
