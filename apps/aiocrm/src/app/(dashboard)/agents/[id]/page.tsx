'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@inherenttech/ui';

type AgentExecution = {
  id: string;
  timestamp: string;
  eventType: string;
  status: 'completed' | 'pending' | 'failed';
  summary: string;
  tokensUsed: number;
  duration: number; // in ms
  details?: string;
};

type Agent = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  status: 'active' | 'inactive';
  autonomyLevel: 'SHADOW' | 'DRAFT' | 'ASSISTED' | 'FULL_AUTO';
  stats: {
    totalExecutions: number;
    successRate: number;
    tokensUsed: number;
    avgTime: number;
  };
  capabilities: string[];
  executions: AgentExecution[];
  config: {
    model: 'claude-sonnet' | 'claude-opus';
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  };
  triggers: Array<{
    id: string;
    name: string;
    enabled: boolean;
    condition?: string;
  }>;
};

const MOCK_AGENTS: Record<string, Agent> = {
  'recruiter-iq': {
    id: 'recruiter-iq',
    name: 'RecruiterIQ',
    displayName: 'RecruiterIQ',
    description: 'Intelligent candidate screening and matching for efficient recruitment',
    icon: '🤖',
    status: 'active',
    autonomyLevel: 'FULL_AUTO',
    stats: {
      totalExecutions: 847,
      successRate: 96.2,
      tokensUsed: 285340,
      avgTime: 2100,
    },
    capabilities: [
      'Candidate Screening',
      'Resume Analysis',
      'Skill Matching',
      'Interview Scheduling',
      'Follow-ups',
      'Ranking & Scoring',
    ],
    executions: [
      {
        id: '1',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        eventType: 'Candidate Screened',
        status: 'completed',
        summary: 'Screened 12 candidates for Senior React Developer',
        tokensUsed: 45200,
        duration: 2100,
        details: 'Analyzed resumes, evaluated skills against JD, ranked candidates by fit score.',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        eventType: 'Interview Scheduled',
        status: 'completed',
        summary: 'Scheduled 4 interviews for Q2 hiring',
        tokensUsed: 32100,
        duration: 1800,
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        eventType: 'Follow-up Sent',
        status: 'completed',
        summary: 'Sent follow-up emails to 8 candidates',
        tokensUsed: 28900,
        duration: 3200,
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        eventType: 'Candidate Screened',
        status: 'completed',
        summary: 'Screened 9 candidates for Product Manager role',
        tokensUsed: 38500,
        duration: 2400,
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        eventType: 'Skill Assessment',
        status: 'failed',
        summary: 'Failed to parse resume format for 1 candidate',
        tokensUsed: 12300,
        duration: 1200,
      },
    ],
    config: {
      model: 'claude-opus',
      temperature: 0.2,
      maxTokens: 2048,
      systemPrompt:
        'You are an expert recruiter assistant. Your role is to screen candidates based on job requirements, analyze resumes for key skills and experience, and make intelligent recommendations. Be objective and thorough in your assessments.',
    },
    triggers: [
      { id: 't1', name: 'New Job Posted', enabled: true },
      { id: 't2', name: 'Resume Uploaded', enabled: true },
      { id: 't3', name: 'Weekly Batch Process', enabled: true, condition: 'cron: 0 9 * * 1' },
    ],
  },
  'bench-iq': {
    id: 'bench-iq',
    name: 'BenchIQ',
    displayName: 'BenchIQ',
    description: 'Resource allocation and bench management optimization',
    icon: '📊',
    status: 'active',
    autonomyLevel: 'ASSISTED',
    stats: {
      totalExecutions: 523,
      successRate: 91.5,
      tokensUsed: 167240,
      avgTime: 3400,
    },
    capabilities: ['Resource Planning', 'Availability Tracking', 'Skill Gap Analysis', 'Allocation Recommendations'],
    executions: [
      {
        id: '1',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        eventType: 'Resource Allocated',
        status: 'pending',
        summary: 'Allocated 3 engineers to CloudBase project',
        tokensUsed: 32500,
        duration: 3200,
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        eventType: 'Availability Updated',
        status: 'completed',
        summary: 'Updated availability for 12 team members',
        tokensUsed: 28900,
        duration: 4100,
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 4200000).toISOString(),
        eventType: 'Gap Analysis',
        status: 'completed',
        summary: 'Identified skill gaps across current projects',
        tokensUsed: 41200,
        duration: 3800,
      },
    ],
    config: {
      model: 'claude-sonnet',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt:
        'You are a resource management expert. Analyze team capabilities, project requirements, and constraints to recommend optimal resource allocations. Always consider team member preferences and skill development goals.',
    },
    triggers: [
      { id: 't1', name: 'New Project', enabled: true },
      { id: 't2', name: 'Availability Changed', enabled: true },
      { id: 't3', name: 'Monthly Review', enabled: false, condition: 'cron: 0 9 1 * *' },
    ],
  },
  'client-iq': {
    id: 'client-iq',
    name: 'ClientIQ',
    displayName: 'ClientIQ',
    description: 'Client relationship and proposal management',
    icon: '💼',
    status: 'active',
    autonomyLevel: 'DRAFT',
    stats: {
      totalExecutions: 234,
      successRate: 88.3,
      tokensUsed: 95670,
      avgTime: 5200,
    },
    capabilities: ['Proposal Generation', 'Client Communication', 'Contract Review'],
    executions: [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        eventType: 'Proposal Generated',
        status: 'completed',
        summary: 'Generated proposal for TechCorp Solutions',
        tokensUsed: 52300,
        duration: 5100,
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        eventType: 'Contract Review',
        status: 'completed',
        summary: 'Reviewed FinanceHub contract - flagged 2 items',
        tokensUsed: 38900,
        duration: 4900,
      },
    ],
    config: {
      model: 'claude-sonnet',
      temperature: 0.5,
      maxTokens: 4096,
      systemPrompt:
        'You are a skilled business development professional. Generate professional proposals, communicate clearly with clients, and identify important contract clauses. Always maintain a professional and client-friendly tone.',
    },
    triggers: [
      { id: 't1', name: 'Lead Qualified', enabled: true },
      { id: 't2', name: 'Contract Uploaded', enabled: true },
    ],
  },
};

function getRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffMs / 86400000)}d ago`;
}

function AutonomyProgressBar({ current }: { current: 'SHADOW' | 'DRAFT' | 'ASSISTED' | 'FULL_AUTO' }) {
  const levels = [
    { key: 'SHADOW', label: 'Shadow Mode', color: '#9ca3af', description: 'View-only, no actions' },
    { key: 'DRAFT', label: 'Draft', color: '#3b82f6', description: 'Review before execution' },
    { key: 'ASSISTED', label: 'Assisted', color: '#a855f7', description: 'Suggest, human approves' },
    { key: 'FULL_AUTO', label: 'Full Auto', color: '#22c55e', description: 'Execute autonomously' },
  ];

  const currentIndex = levels.findIndex(l => l.key === current);

  return (
    <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#111827' }}>Autonomy Level Progression</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: currentIndex > 0 ? '#fff1f2' : '#f3f4f6',
              color: currentIndex > 0 ? '#be185d' : '#9ca3af',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: currentIndex > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            ↓ Downgrade
          </button>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: currentIndex < 3 ? '#f0fdf4' : '#f3f4f6',
              color: currentIndex < 3 ? '#15803d' : '#9ca3af',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: currentIndex < 3 ? 'pointer' : 'not-allowed',
            }}
          >
            ↑ Upgrade
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {levels.map((level, idx) => (
          <div
            key={level.key}
            style={{
              backgroundColor: idx <= currentIndex ? '#f0f9ff' : '#f9fafb',
              borderRadius: 8,
              border: `2px solid ${idx <= currentIndex ? level.color : '#e5e7eb'}`,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: idx <= currentIndex ? level.color : '#e5e7eb',
                }}
              />
              <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: '#111827' }}>{level.label}</p>
            </div>
            <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.3 }}>{level.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const agentId = (params?.id as string) || 'recruiter-iq';

  const agent = MOCK_AGENTS[agentId] || MOCK_AGENTS['recruiter-iq'];

  const [activeTab, setActiveTab] = useState<'overview' | 'execution' | 'config' | 'triggers'>('overview');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [expandedExecution, setExpandedExecution] = useState<string | null>(null);
  const [configModel, setConfigModel] = useState<'claude-sonnet' | 'claude-opus'>(agent.config.model);
  const [configTemp, setConfigTemp] = useState(agent.config.temperature);
  const [configMaxTokens, setConfigMaxTokens] = useState(agent.config.maxTokens);
  const [configPrompt, setConfigPrompt] = useState(agent.config.systemPrompt);

  const filteredExecutions = agent.executions.filter(exec =>
    statusFilter === 'all' ? true : exec.status === statusFilter,
  );

  const handleSaveConfig = () => {
    alert('Configuration saved! (mock)');
  };

  const handleTestTrigger = (triggerId: string) => {
    alert(`Testing trigger: ${triggerId}`);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 56 }}>{agent.icon}</div>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#111827' }}>{agent.displayName}</h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '8px 0 12px' }}>{agent.description}</p>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: agent.status === 'active' ? '#dcfce7' : '#f3f4f6',
                color: agent.status === 'active' ? '#15803d' : '#6b7280',
              }}
            >
              {agent.status === 'active' ? '● Active' : '● Inactive'}
            </span>
          </div>
        </div>

        {/* Status Toggle */}
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: agent.status === 'active' ? '#fee2e2' : '#f0fdf4',
            color: agent.status === 'active' ? '#b91c1c' : '#15803d',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {agent.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {/* Autonomy Progression */}
      <AutonomyProgressBar current={agent.autonomyLevel} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {(['overview', 'execution', 'config', 'triggers'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid #3b82f6' : '3px solid transparent',
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === tab ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'execution' ? 'Execution History' : tab === 'config' ? 'Configuration' : tab === 'triggers' ? 'Triggers' : 'Overview'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Executions', value: agent.stats.totalExecutions, color: '#3b82f6' },
              { label: 'Success Rate', value: `${agent.stats.successRate}%`, color: '#22c55e' },
              { label: 'Tokens Used', value: agent.stats.tokensUsed.toLocaleString(), color: '#a855f7' },
              { label: 'Avg Time', value: `${(agent.stats.avgTime / 1000).toFixed(1)}s`, color: '#f59e0b' },
            ].map((stat, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 20,
                  border: `1px solid #e5e7eb`,
                  borderTop: `3px solid ${stat.color}`,
                }}
              >
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0, fontWeight: 500 }}>{stat.label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, margin: '8px 0 0', color: '#111827' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Capabilities */}
          <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#111827' }}>Capabilities</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {agent.capabilities.map((cap, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#eff6ff',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#1d4ed8',
                    fontWeight: 500,
                  }}
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Recent Executions */}
          <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#111827' }}>Recent Executions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {agent.executions.slice(0, 5).map(exec => (
                <div
                  key={exec.id}
                  style={{
                    padding: 12,
                    backgroundColor: '#f9fafb',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: '1px solid #f3f4f6',
                  }}
                  onClick={() => setExpandedExecution(expandedExecution === exec.id ? null : exec.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#111827' }}>{exec.eventType}</p>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{exec.summary}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          backgroundColor:
                            exec.status === 'completed'
                              ? '#dcfce7'
                              : exec.status === 'pending'
                                ? '#fef3c7'
                                : '#fee2e2',
                          color:
                            exec.status === 'completed'
                              ? '#15803d'
                              : exec.status === 'pending'
                                ? '#b45309'
                                : '#b91c1c',
                        }}
                      >
                        {exec.status.toUpperCase()}
                      </span>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{getRelativeTime(exec.timestamp)}</p>
                    </div>
                  </div>

                  {expandedExecution === exec.id && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, fontWeight: 500 }}>Tokens Used</p>
                          <p style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 0', color: '#111827' }}>
                            {exec.tokensUsed.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, fontWeight: 500 }}>Duration</p>
                          <p style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 0', color: '#111827' }}>
                            {(exec.duration / 1000).toFixed(2)}s
                          </p>
                        </div>
                      </div>
                      {exec.details && (
                        <div>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, fontWeight: 500, marginBottom: 4 }}>Details</p>
                          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>{exec.details}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'execution' && (
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
          {/* Filter */}
          <div style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
            {(['all', 'completed', 'pending', 'failed'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: statusFilter === status ? '#3b82f6' : '#f3f4f6',
                  color: statusFilter === status ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Time', 'Event', 'Status', 'Tokens', 'Duration'].map((h, idx) => (
                    <th
                      key={idx}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6b7280',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredExecutions.map(exec => (
                  <tr
                    key={exec.id}
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => setExpandedExecution(expandedExecution === exec.id ? null : exec.id)}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{getRelativeTime(exec.timestamp)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#111827', fontWeight: 500 }}>{exec.eventType}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor:
                            exec.status === 'completed'
                              ? '#dcfce7'
                              : exec.status === 'pending'
                                ? '#fef3c7'
                                : '#fee2e2',
                          color:
                            exec.status === 'completed'
                              ? '#15803d'
                              : exec.status === 'pending'
                                ? '#b45309'
                                : '#b91c1c',
                        }}
                      >
                        {exec.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{exec.tokensUsed.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                      {(exec.duration / 1000).toFixed(2)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredExecutions.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
              No {statusFilter !== 'all' ? statusFilter : ''} executions found
            </div>
          )}
        </div>
      )}

      {activeTab === 'config' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 24px', color: '#111827' }}>Model Configuration</h3>

            {/* Model Selection */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                Model
              </label>
              <select
                value={configModel}
                onChange={e => setConfigModel(e.target.value as 'claude-sonnet' | 'claude-opus')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              >
                <option value="claude-sonnet">Claude Sonnet</option>
                <option value="claude-opus">Claude Opus</option>
              </select>
            </div>

            {/* Temperature */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                Temperature <span>{configTemp.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={configTemp}
                onChange={e => setConfigTemp(parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <p style={{ fontSize: 11, color: '#6b7280', margin: '8px 0 0' }}>Controls randomness: 0 = deterministic, 1 = creative</p>
            </div>

            {/* Max Tokens */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                Max Tokens
              </label>
              <input
                type="number"
                min="256"
                max="4096"
                value={configMaxTokens}
                onChange={e => setConfigMaxTokens(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* System Prompt */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                System Prompt
              </label>
              <textarea
                value={configPrompt}
                onChange={e => setConfigPrompt(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 120,
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleSaveConfig}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save Configuration
            </button>
          </div>

          {/* Config Reference */}
          <div style={{ backgroundColor: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px', color: '#111827' }}>Configuration Guide</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12, lineHeight: 1.5, color: '#6b7280' }}>
              <div>
                <p style={{ fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Temperature</p>
                <p style={{ margin: 0 }}>Lower values produce consistent results. Higher values introduce creativity and variety.</p>
              </div>
              <div>
                <p style={{ fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Max Tokens</p>
                <p style={{ margin: 0 }}>Limits response length. More tokens allow longer responses but increase latency and cost.</p>
              </div>
              <div>
                <p style={{ fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>System Prompt</p>
                <p style={{ margin: 0 }}>Controls agent behavior and instructions. Be specific about role and constraints.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'triggers' && (
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 24px', color: '#111827' }}>Event Triggers</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {agent.triggers.map(trigger => (
              <div
                key={trigger.id}
                style={{
                  padding: 16,
                  backgroundColor: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#111827' }}>{trigger.name}</p>
                  {trigger.condition && (
                    <p style={{ fontSize: 11, color: '#6b7280', margin: '6px 0 0', fontFamily: 'monospace' }}>{trigger.condition}</p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16 }}>
                  {/* Toggle */}
                  <button
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      border: 'none',
                      backgroundColor: trigger.enabled ? '#22c55e' : '#e5e7eb',
                      cursor: 'pointer',
                      padding: 0,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        top: 2,
                        left: trigger.enabled ? 22 : 2,
                        transition: 'left 0.3s ease',
                      }}
                    />
                  </button>

                  {/* Test Button */}
                  <button
                    onClick={() => handleTestTrigger(trigger.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
