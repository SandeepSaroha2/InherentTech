'use client';

import React, { useState } from 'react';
import {
  Plus,
  Phone,
  Monitor,
  Users,
  Building2,
  Target,
  ClipboardList,
  Video,
} from 'lucide-react';

type Interview = {
  id: string;
  candidate: string;
  job: string;
  client: string;
  type: string;
  status: string;
  scheduledAt: string;
  interviewer: string;
  feedback: string | null;
};

const TYPES = ['ALL', 'PHONE_SCREEN', 'TECHNICAL', 'PANEL', 'CLIENT', 'FINAL'];
const STATUSES = ['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-gray-100 text-gray-500',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  PHONE_SCREEN: Phone,
  TECHNICAL: Monitor,
  PANEL: Users,
  CLIENT: Building2,
  FINAL: Target,
};

const TYPE_COLORS: Record<string, string> = {
  PHONE_SCREEN: 'bg-green-50 text-green-600',
  TECHNICAL: 'bg-blue-50 text-blue-600',
  PANEL: 'bg-violet-50 text-violet-600',
  CLIENT: 'bg-amber-50 text-amber-600',
  FINAL: 'bg-red-50 text-red-600',
};

const MOCK_INTERVIEWS: Interview[] = [
  { id: '1', candidate: 'Alex Johnson', job: 'Senior Java Developer', client: 'TechCorp', type: 'TECHNICAL', status: 'SCHEDULED', scheduledAt: '2026-03-29T10:00:00Z', interviewer: 'John Smith', feedback: null },
  { id: '2', candidate: 'Priya Patel', job: 'React Developer', client: 'FinanceHub', type: 'CLIENT', status: 'SCHEDULED', scheduledAt: '2026-03-29T14:00:00Z', interviewer: 'Client Team', feedback: null },
  { id: '3', candidate: 'David Kim', job: 'DevOps Engineer', client: 'CloudBase', type: 'PHONE_SCREEN', status: 'COMPLETED', scheduledAt: '2026-03-26T09:00:00Z', interviewer: 'Sarah Davis', feedback: 'Strong Linux skills, good communication. Moving to technical round.' },
  { id: '4', candidate: 'Lisa Wang', job: 'QA Engineer', client: 'DataSync', type: 'PANEL', status: 'COMPLETED', scheduledAt: '2026-03-25T11:00:00Z', interviewer: 'Panel (3)', feedback: 'Excellent test automation knowledge. Recommend for offer.' },
  { id: '5', candidate: 'James Brown', job: 'Data Engineer', client: 'MedTech', type: 'FINAL', status: 'CANCELLED', scheduledAt: '2026-03-24T15:00:00Z', interviewer: 'VP Engineering', feedback: null },
  { id: '6', candidate: 'Maria Garcia', job: 'Full Stack Developer', client: 'RetailPro', type: 'TECHNICAL', status: 'COMPLETED', scheduledAt: '2026-03-23T13:00:00Z', interviewer: 'Mike Chen', feedback: 'Average performance on coding challenge. Needs improvement in system design.' },
];

export default function InterviewsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filtered = MOCK_INTERVIEWS.filter(
    (i) =>
      (statusFilter === 'ALL' || i.status === statusFilter) &&
      (typeFilter === 'ALL' || i.type === typeFilter)
  );

  const upcoming = MOCK_INTERVIEWS.filter((i) => i.status === 'SCHEDULED').length;
  const completed = MOCK_INTERVIEWS.filter((i) => i.status === 'COMPLETED').length;
  const today = MOCK_INTERVIEWS.filter((i) => {
    const d = new Date(i.scheduledAt);
    const now = new Date();
    return d.toDateString() === now.toDateString() && i.status === 'SCHEDULED';
  }).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Interviews</h2>
          <p className="text-sm text-gray-500 mt-1">
            {upcoming} upcoming &middot; {today} today &middot; {completed} completed
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Schedule Interview
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Today', value: today, color: 'text-blue-600' },
          { label: 'This Week', value: upcoming, color: 'text-violet-600' },
          { label: 'Completed', value: completed, color: 'text-green-600' },
          { label: 'Pass Rate', value: '67%', color: 'text-amber-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 w-12">Status:</span>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 w-12">Type:</span>
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Interview Cards */}
      <div className="space-y-3">
        {filtered.map((interview) => {
          const dt = new Date(interview.scheduledAt);
          const Icon = TYPE_ICONS[interview.type] || ClipboardList;
          const typeColor = TYPE_COLORS[interview.type] || 'bg-gray-50 text-gray-600';
          return (
            <div
              key={interview.id}
              className={`bg-white rounded-xl border border-gray-200 p-5 border-l-4 hover:shadow-sm transition-shadow
                ${interview.status === 'SCHEDULED' ? 'border-l-blue-500' : interview.status === 'COMPLETED' ? 'border-l-green-500' : interview.status === 'CANCELLED' ? 'border-l-red-400' : 'border-l-gray-300'}
              `}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-lg ${typeColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{interview.candidate}</h3>
                    <p className="text-sm text-gray-500">
                      {interview.job} at {interview.client}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {interview.type.replace('_', ' ')} &middot; Interviewer: {interview.interviewer}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 sm:text-right">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[interview.status] || 'bg-gray-100 text-gray-500'}`}>
                    {interview.status.replace('_', ' ')}
                  </span>
                  <p className="text-sm font-medium text-gray-700 mt-1.5">
                    {dt.toLocaleDateString()} at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {interview.status === 'SCHEDULED' && (
                    <div className="flex gap-2 mt-2 justify-end">
                      <button className="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors">
                        Confirm
                      </button>
                      <button className="px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 transition-colors">
                        Reschedule
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {interview.feedback && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Feedback:</span> {interview.feedback}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
