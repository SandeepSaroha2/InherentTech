'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  BarChart3,
  Briefcase,
  Play,
  Settings,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  Shield,
} from 'lucide-react';

// --- Types ---
type Agent = {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'idle';
  autonomyLevel: 'SHADOW' | 'DRAFT' | 'ASSISTED' | 'FULL_AUTO';
  capabilities: string[];
  executions: number;
  successRate: number;
  avgResponseTime: number;
  icon: React.ReactNode;
  color: string;
  lastRun: string;
};

type Execution = {
  id: string;
  agentName: string;
  agentIcon: React.ReactNode;
  event: string;
  summary: string;
  status: 'completed' | 'failed' | 'pending_approval';
  timestamp: string;
};

// --- Constants ---
const AUTONOMY_LEVELS = ['SHADOW', 'DRAFT', 'ASSISTED', 'FULL_AUTO'];
const AUTONOMY_COLORS = ['bg-gray-400', 'bg-blue-500', 'bg-violet-500', 'bg-green-500'];

// --- Mock Data ---
const MOCK_AGENTS: Agent[] = [
  {
    id: 'bench-iq',
    name: 'BenchIQ',
    description: 'Resource allocation and bench management. Optimizes staffing utilization and identifies gaps.',
    status: 'active',
    autonomyLevel: 'ASSISTED',
    capabilities: ['Resource Planning', 'Availability Tracking', 'Skill Gap Analysis', 'Allocation Recommendations'],
    executions: 523,
    successRate: 91.5,
    avgResponseTime: 3400,
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'blue',
    lastRun: '5 min ago',
  },
  {
    id: 'client-iq',
    name: 'ClientIQ',
    description: 'Client relationship and proposal management. Generates proposals and reviews contracts.',
    status: 'active',
    autonomyLevel: 'DRAFT',
    capabilities: ['Proposal Generation', 'Client Communication', 'Contract Review', 'Pricing Optimization'],
    executions: 234,
    successRate: 88.3,
    avgResponseTime: 5200,
    icon: <Briefcase className="w-6 h-6" />,
    color: 'violet',
    lastRun: '30 min ago',
  },
  {
    id: 'recruiter-iq',
    name: 'RecruiterIQ',
    description: 'Intelligent candidate screening and matching. Automates resume analysis and interview scheduling.',
    status: 'active',
    autonomyLevel: 'FULL_AUTO',
    capabilities: ['Candidate Screening', 'Resume Analysis', 'Skill Matching', 'Interview Scheduling', 'Follow-ups'],
    executions: 847,
    successRate: 96.2,
    avgResponseTime: 2100,
    icon: <Bot className="w-6 h-6" />,
    color: 'green',
    lastRun: '2 min ago',
  },
];

const MOCK_EXECUTIONS: Execution[] = [
  { id: '1', agentName: 'RecruiterIQ', agentIcon: <Bot className="w-4 h-4" />, event: 'Candidate Screened', summary: 'Screened and ranked 12 candidates for Senior React Developer', status: 'completed', timestamp: '5 min ago' },
  { id: '2', agentName: 'BenchIQ', agentIcon: <BarChart3 className="w-4 h-4" />, event: 'Resource Allocation', summary: 'Allocated 3 engineers to CloudBase project', status: 'pending_approval', timestamp: '10 min ago' },
  { id: '3', agentName: 'ClientIQ', agentIcon: <Briefcase className="w-4 h-4" />, event: 'Proposal Generated', summary: 'Generated proposal for TechCorp Solutions engagement', status: 'completed', timestamp: '30 min ago' },
  { id: '4', agentName: 'RecruiterIQ', agentIcon: <Bot className="w-4 h-4" />, event: 'Interview Scheduled', summary: 'Scheduled 4 interviews for Q2 hiring plan', status: 'completed', timestamp: '1 hr ago' },
  { id: '5', agentName: 'BenchIQ', agentIcon: <BarChart3 className="w-4 h-4" />, event: 'Availability Updated', summary: 'Updated availability for 8 bench resources', status: 'failed', timestamp: '1.5 hrs ago' },
  { id: '6', agentName: 'ClientIQ', agentIcon: <Briefcase className="w-4 h-4" />, event: 'Contract Review', summary: 'Reviewed and flagged 2 items in FinanceHub contract', status: 'pending_approval', timestamp: '2 hrs ago' },
];

const AGENT_COLOR_MAP: Record<string, { bg: string; icon: string; border: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-200' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' },
};

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  completed: { bg: 'bg-green-50', text: 'text-green-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  failed: { bg: 'bg-red-50', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
  pending_approval: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

// --- Page ---
export default function AgentsPage() {
  const router = useRouter();

  const totalExecutions = MOCK_AGENTS.reduce((s, a) => s + a.executions, 0);
  const avgSuccess = (MOCK_AGENTS.reduce((s, a) => s + a.successRate, 0) / MOCK_AGENTS.length).toFixed(1);
  const pendingCount = MOCK_EXECUTIONS.filter((e) => e.status === 'pending_approval').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage and monitor your AI-powered agents</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Active Agents', value: MOCK_AGENTS.filter((a) => a.status === 'active').length, icon: <Zap className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
          { title: 'Total Executions', value: totalExecutions.toLocaleString(), icon: <TrendingUp className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
          { title: 'Pending Approvals', value: pendingCount, icon: <AlertCircle className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
          { title: 'Avg Success Rate', value: `${avgSuccess}%`, icon: <Shield className="w-5 h-5" />, color: 'bg-violet-50 text-violet-600' },
        ].map((kpi) => (
          <div key={kpi.title} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                {kpi.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.title}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Agents + Activity Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Agent Cards */}
        <div className="xl:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">All Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_AGENTS.map((agent) => {
              const colors = AGENT_COLOR_MAP[agent.color];
              const levelIdx = AUTONOMY_LEVELS.indexOf(agent.autonomyLevel);
              return (
                <div
                  key={agent.id}
                  className={`bg-white rounded-xl border-2 p-5 flex flex-col gap-4 transition-shadow hover:shadow-md ${
                    agent.status === 'active' ? 'border-green-200' : 'border-gray-200'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.bg} ${colors.icon}`}>
                        {agent.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{agent.name}</h3>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          agent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {agent.status === 'active' ? 'Active' : 'Idle'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Autonomy Level */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Autonomy</p>
                    <div className="flex gap-1.5">
                      {AUTONOMY_LEVELS.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full ${idx <= levelIdx ? AUTONOMY_COLORS[idx] : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{agent.autonomyLevel.replace('_', ' ')}</p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 leading-relaxed">{agent.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] text-gray-400">Runs</p>
                      <p className="text-sm font-bold text-gray-900">{agent.executions}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Success</p>
                      <p className="text-sm font-bold text-green-600">{agent.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Avg Time</p>
                      <p className="text-sm font-bold text-gray-900">{(agent.avgResponseTime / 1000).toFixed(1)}s</p>
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((cap) => (
                      <span key={cap} className="px-2 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600 font-medium">
                        {cap}
                      </span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span className="px-2 py-0.5 bg-blue-50 rounded text-[10px] text-blue-600 font-semibold">
                        +{agent.capabilities.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Last run */}
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    Last run: {agent.lastRun}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => router.push(`/agents/${agent.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      Run Agent
                    </button>
                    <button
                      onClick={() => router.push(`/agents/${agent.id}`)}
                      className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Executions */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Executions</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {MOCK_EXECUTIONS.map((exec) => {
              const statusStyle = STATUS_STYLE[exec.status];
              return (
                <div key={exec.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                      {exec.agentIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                          {exec.agentName}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.icon}
                          {exec.status === 'pending_approval' ? 'Pending' : exec.status === 'completed' ? 'Done' : 'Failed'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 mt-0.5">{exec.event}</p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{exec.summary}</p>

                      {exec.status === 'pending_approval' && (
                        <div className="flex gap-2 mt-2">
                          <button className="flex-1 px-2 py-1 text-[10px] font-semibold bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors">
                            Approve
                          </button>
                          <button className="flex-1 px-2 py-1 text-[10px] font-semibold bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors">
                            Reject
                          </button>
                        </div>
                      )}

                      <p className="text-[10px] text-gray-400 mt-1.5">{exec.timestamp}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
