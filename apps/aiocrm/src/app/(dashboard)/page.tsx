'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Users,
  DollarSign,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Mail,
  Calendar,
  FileText,
  Plus,
  ChevronRight,
  Target,
  Zap,
} from 'lucide-react';

// --- Mock Data ---

const KPI_DATA = [
  { title: 'Total Leads', value: '47', change: '+12%', up: true, icon: <Users className="w-5 h-5" />, color: 'blue' },
  { title: 'Qualified Leads', value: '18', change: '+8%', up: true, icon: <Target className="w-5 h-5" />, color: 'amber' },
  { title: 'Revenue Pipeline', value: '$1.25M', change: '+23%', up: true, icon: <DollarSign className="w-5 h-5" />, color: 'green' },
  { title: 'Won Deals', value: '3', change: '-1', up: false, icon: <Trophy className="w-5 h-5" />, color: 'purple' },
];

const PIPELINE_STAGES = [
  { stage: 'New', count: 15, value: 375000, color: 'bg-blue-500' },
  { stage: 'Contacted', count: 10, value: 250000, color: 'bg-violet-500' },
  { stage: 'Qualified', count: 8, value: 200000, color: 'bg-amber-500' },
  { stage: 'Proposal', count: 6, value: 180000, color: 'bg-orange-500' },
  { stage: 'Won', count: 3, value: 100000, color: 'bg-green-500' },
];

const RECENT_ACTIVITIES = [
  { id: '1', type: 'call' as const, description: 'Discovery call with TechCorp', user: 'Sarah', lead: 'TechCorp Solutions', time: '10 min ago' },
  { id: '2', type: 'email' as const, description: 'Sent staffing proposal to FinanceHub', user: 'Admin', lead: 'FinanceHub Inc', time: '1 hr ago' },
  { id: '3', type: 'meeting' as const, description: 'Rate negotiation with DataSync', user: 'Mike', lead: 'DataSync Corp', time: '2 hrs ago' },
  { id: '4', type: 'note' as const, description: 'Client wants 5 React devs by Q3', user: 'Sarah', lead: 'CloudBase', time: '4 hrs ago' },
  { id: '5', type: 'email' as const, description: 'Follow-up on Q1 invoice', user: 'Admin', lead: 'MedTech Labs', time: '6 hrs ago' },
];

const TOP_LEADS = [
  { id: '1', company: 'CloudBase', contact: 'James Wilson', stage: 'Negotiation', value: 340000, lastContact: '2 days ago' },
  { id: '2', company: 'TechCorp Solutions', contact: 'Jennifer Smith', stage: 'Qualified', value: 250000, lastContact: '1 day ago' },
  { id: '3', company: 'FinanceHub Inc', contact: 'Robert Chen', stage: 'Proposal', value: 180000, lastContact: '3 days ago' },
  { id: '4', company: 'DataSync Corp', contact: 'Maria Garcia', stage: 'New', value: 120000, lastContact: 'Today' },
  { id: '5', company: 'MedTech Labs', contact: 'Dr. Emily Park', stage: 'Contacted', value: 95000, lastContact: '5 days ago' },
];

const STAGE_BADGE: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700',
  Contacted: 'bg-violet-100 text-violet-700',
  Qualified: 'bg-amber-100 text-amber-700',
  Proposal: 'bg-orange-100 text-orange-700',
  Negotiation: 'bg-pink-100 text-pink-700',
  Won: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-700',
};

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  call: <Phone className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  meeting: <Calendar className="w-3.5 h-3.5" />,
  note: <FileText className="w-3.5 h-3.5" />,
};

const ACTIVITY_COLOR: Record<string, string> = {
  call: 'bg-blue-100 text-blue-600',
  email: 'bg-amber-100 text-amber-600',
  meeting: 'bg-pink-100 text-pink-600',
  note: 'bg-gray-100 text-gray-600',
};

const KPI_BG: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
};

// --- Components ---

export default function DashboardPage() {
  const router = useRouter();
  const totalPipelineCount = PIPELINE_STAGES.reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back. Here is your CRM overview.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/leads')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
          <button
            onClick={() => router.push('/activities')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Log Activity
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_DATA.map((kpi) => (
          <div
            key={kpi.title}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${KPI_BG[kpi.color]}`}>
                {kpi.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
                {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.title}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Funnel + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Funnel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-gray-900">Pipeline Funnel</h2>
            <button
              onClick={() => router.push('/pipeline')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {PIPELINE_STAGES.map((stage) => {
              const pct = totalPipelineCount > 0 ? (stage.count / totalPipelineCount) * 100 : 0;
              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-medium text-gray-600 shrink-0">{stage.stage}</span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-lg flex items-center pl-3 transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    >
                      <span className="text-xs font-semibold text-white">{stage.count}</span>
                    </div>
                  </div>
                  <span className="w-16 text-xs text-gray-500 text-right shrink-0">
                    ${(stage.value / 1000).toFixed(0)}K
                  </span>
                </div>
              );
            })}
          </div>
          {/* Funnel summary */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{totalPipelineCount} total leads in pipeline</span>
            <span className="font-semibold text-gray-900">
              ${(PIPELINE_STAGES.reduce((s, p) => s + p.value, 0) / 1000).toFixed(0)}K total value
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Add New Lead', href: '/leads', icon: <Target className="w-4 h-4" /> },
              { label: 'Log Activity', href: '/activities', icon: <FileText className="w-4 h-4" /> },
              { label: 'Send Email', href: '/email', icon: <Mail className="w-4 h-4" /> },
              { label: 'Run AI Agent', href: '/agents', icon: <Zap className="w-4 h-4" /> },
              { label: 'Create Campaign', href: '/outreach', icon: <TrendingUp className="w-4 h-4" /> },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <span className="text-blue-600">{action.icon}</span>
                <span className="flex-1 text-left font-medium">{action.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities + Top Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Activities</h2>
            <button
              onClick={() => router.push('/activities')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-4">
            {RECENT_ACTIVITIES.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ACTIVITY_COLOR[activity.type]}`}>
                  {ACTIVITY_ICON[activity.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {activity.user} &middot; {activity.lead}
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Leads */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-0">
            <h2 className="text-base font-semibold text-gray-900">Top Leads</h2>
            <button
              onClick={() => router.push('/leads')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-2">Company</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">Stage</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-6 py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {TOP_LEADS.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/leads/${lead.id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-gray-900">{lead.company}</p>
                      <p className="text-xs text-gray-500">{lead.contact}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${STAGE_BADGE[lead.stage] || 'bg-gray-100 text-gray-600'}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        ${(lead.value / 1000).toFixed(0)}K
                      </span>
                      <p className="text-[11px] text-gray-400">{lead.lastContact}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
