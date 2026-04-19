'use client';

import React, { useState, useEffect } from 'react';

export interface AgentActivity {
  id: string;
  agentName: string;
  agentIcon: string;
  event: string;
  summary: string;
  status: 'completed' | 'pending_approval' | 'failed' | 'in_progress';
  timestamp: string;
  actions?: {
    id: string;
    type: string;
    description: string;
    status: string;
  }[];
}

interface AgentActivityFeedProps {
  activities?: AgentActivity[];
  maxItems?: number;
  showApprovalButtons?: boolean;
  onApprove?: (actionId: string) => void;
  onReject?: (actionId: string) => void;
  compact?: boolean;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: '#dcfce7', text: '#15803d', label: 'Completed' },
  pending_approval: { bg: '#fef3c7', text: '#b45309', label: 'Needs Approval' },
  failed: { bg: '#fee2e2', text: '#b91c1c', label: 'Failed' },
  in_progress: { bg: '#dbeafe', text: '#1d4ed8', label: 'Running' },
};

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

const MOCK_ACTIVITIES: AgentActivity[] = [
  {
    id: 'af_1', agentName: 'RecruiterIQ', agentIcon: '🎯',
    event: 'job_order.created', summary: 'Found 8 matching candidates for Senior Java Developer at TechCorp. Top match: Alex Johnson (92% fit).',
    status: 'completed', timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'af_2', agentName: 'RecruiterIQ', agentIcon: '🎯',
    event: 'submission.rejected', summary: 'David Kim rejected for DevOps role. Found 5 alternatives. Recommends Maria Garcia (88% fit).',
    status: 'pending_approval', timestamp: new Date(Date.now() - 900000).toISOString(),
    actions: [
      { id: 'act_1', type: 'create_submission', description: 'Submit Maria Garcia for DevOps Engineer at CloudBase ($95/hr)', status: 'pending_approval' },
      { id: 'act_2', type: 'send_email', description: 'Send outreach email to Maria Garcia about the opportunity', status: 'pending_approval' },
    ],
  },
  {
    id: 'af_3', agentName: 'BenchIQ', agentIcon: '📊',
    event: 'placement.ending_soon', summary: 'Tom Wilson assignment at TechCorp ends Apr 30. Found 4 redeployment options. Sent check-in email.',
    status: 'completed', timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'af_4', agentName: 'ClientIQ', agentIcon: '🏢',
    event: 'lead.stage_changed', summary: 'TechCorp moved to NEGOTIATION. Scheduled follow-up and prepared competitive pricing analysis.',
    status: 'completed', timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'af_5', agentName: 'ClientIQ', agentIcon: '🏢',
    event: 'invoice.overdue', summary: '⚠️ DataSync invoice #INV-2026-00042 ($12,400) overdue 15 days. Churn risk detected. Alerted AR team.',
    status: 'completed', timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'af_6', agentName: 'RecruiterIQ', agentIcon: '🎯',
    event: 'candidate.resume_parsed', summary: 'Parsed resume for Emily Chen. Skills: React, TypeScript, Node.js, AWS. Matched to 2 open positions.',
    status: 'completed', timestamp: new Date(Date.now() - 21600000).toISOString(),
  },
];

export function AgentActivityFeed({
  activities,
  maxItems = 10,
  showApprovalButtons = true,
  onApprove,
  onReject,
  compact = false,
}: AgentActivityFeedProps) {
  const items = (activities || MOCK_ACTIVITIES).slice(0, maxItems);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12 }}>
      {items.map(activity => {
        const statusStyle = STATUS_STYLES[activity.status];
        const isExpanded = expandedId === activity.id;

        return (
          <div
            key={activity.id}
            onClick={() => setExpandedId(isExpanded ? null : activity.id)}
            style={{
              backgroundColor: 'white',
              borderRadius: 10,
              padding: compact ? '10px 14px' : '14px 18px',
              border: `1px solid ${activity.status === 'pending_approval' ? '#fbbf24' : '#e5e7eb'}`,
              cursor: 'pointer',
              transition: 'box-shadow 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                <span style={{ fontSize: compact ? 18 : 22 }}>{activity.agentIcon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: compact ? 13 : 14 }}>{activity.agentName}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>· {activity.event.replace(/_/g, ' ')}</span>
                  </div>
                  <p style={{ fontSize: compact ? 12 : 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{activity.summary}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                  backgroundColor: statusStyle.bg, color: statusStyle.text,
                }}>{statusStyle.label}</span>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>{timeAgo(activity.timestamp)}</p>
              </div>
            </div>

            {/* Expandable actions */}
            {isExpanded && activity.actions && activity.actions.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', margin: '0 0 8px', textTransform: 'uppercase' }}>Planned Actions</p>
                {activity.actions.map(action => (
                  <div key={action.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                    <div>
                      <span style={{ fontSize: 12, color: '#374151' }}>{action.description}</span>
                    </div>
                    {showApprovalButtons && action.status === 'pending_approval' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); onApprove?.(action.id); }}
                          style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >Approve</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onReject?.(action.id); }}
                          style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
