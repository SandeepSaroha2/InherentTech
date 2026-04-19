'use client';

import { useState } from 'react';

interface Placement {
  id: string;
  clientName: string;
  role: string;
  startDate: string;
  endDate: string | null;
  billRate: number;
  status: 'Active' | 'Completed' | 'On Hold';
  location: string;
}

export default function PlacementsPage() {
  const [placements] = useState<Placement[]>([
    {
      id: '1',
      clientName: 'Tech Solutions Inc.',
      role: 'Senior Software Engineer',
      startDate: '2026-03-01',
      endDate: null,
      billRate: 85,
      status: 'Active',
      location: 'San Francisco, CA',
    },
    {
      id: '2',
      clientName: 'Cloud Systems Corp',
      role: 'DevOps Engineer',
      startDate: '2026-02-15',
      endDate: null,
      billRate: 95,
      status: 'Active',
      location: 'Remote',
    },
    {
      id: '3',
      clientName: 'Digital Innovations',
      role: 'Full Stack Developer',
      startDate: '2025-11-01',
      endDate: '2026-02-28',
      billRate: 75,
      status: 'Completed',
      location: 'Austin, TX',
    },
    {
      id: '4',
      clientName: 'Data Analytics Plus',
      role: 'Data Engineer',
      startDate: '2026-01-15',
      endDate: null,
      billRate: 80,
      status: 'On Hold',
      location: 'New York, NY',
    },
  ]);

  const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      Active: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
      Completed: { bg: '#dbeafe', text: '#0c4a6e', border: '#7dd3fc' },
      'On Hold': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    };
    return colors[status] || { bg: '#f3f4f6', text: '#1f2937', border: '#d1d5db' };
  };

  const calculateDuration = (startDate: string, endDate: string | null): string => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;

    if (months > 0) {
      return `${months}m ${days}d`;
    }
    return `${days}d`;
  };

  const handleViewDetails = (placementId: string): void => {
    console.log('View placement details:', placementId);
    alert('Placement details modal would open here');
  };

  const handleContact = (placementId: string): void => {
    console.log('Contact about placement:', placementId);
    alert('Contact form would open here');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
          Placements
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
          View your current and past placements
        </p>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {placements.filter((p) => p.status === 'Active').length}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Active</p>
        </div>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            {placements.filter((p) => p.status === 'Completed').length}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Completed</p>
        </div>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            ${placements.reduce((sum, p) => (p.status === 'Active' ? sum + p.billRate : sum), 0)}/hr
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Avg Bill Rate</p>
        </div>
      </div>

      {/* Placements Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Client & Role
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Location
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Duration
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Bill Rate
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {placements.map((placement: typeof placements[0]) => {
                const statusColor = getStatusColor(placement.status);
                return (
                  <tr
                    key={placement.id}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        'transparent';
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>
                        {placement.clientName}
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                        {placement.role}
                      </p>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {placement.location}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {calculateDuration(placement.startDate, placement.endDate)}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a' }}>
                      ${placement.billRate}/hr
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: `1px solid ${statusColor.border}`,
                        }}
                      >
                        {placement.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleViewDetails(placement.id)}
                        style={{
                          padding: '4px 8px',
                          marginRight: '4px',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            '#3b82f6';
                        }}
                      >
                        Details
                      </button>
                      {placement.status === 'Active' && (
                        <button
                          onClick={() => handleContact(placement.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              '#059669';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              '#10b981';
                          }}
                        >
                          Contact
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
