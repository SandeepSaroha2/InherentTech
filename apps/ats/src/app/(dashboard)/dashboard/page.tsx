'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  Send,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Plus,
  UserPlus,
  Clock,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@inherenttech/ui';

interface DashboardData {
  kpis: {
    activeCandidates: number;
    openJobs: number;
    pendingSubmissions: number;
    activePlacements: number;
  };
  upcomingInterviews: Array<{
    id: string;
    scheduledAt: string;
    type: string;
    candidate: { firstName: string; lastName: string };
    submission: { jobOrder: { title: string } };
  }>;
  recentSubmissions: Array<{
    id: string;
    status: string;
    submittedAt: string;
    candidate: { firstName: string; lastName: string };
    jobOrder: { title: string };
    submittedBy: { name: string | null } | null;
  }>;
}

const INTERVIEW_TYPE_STYLES: Record<string, string> = {
  PHONE:     'bg-green-100 text-green-700',
  VIDEO:     'bg-blue-100 text-blue-700',
  TECHNICAL: 'bg-violet-100 text-violet-700',
  ONSITE:    'bg-amber-100 text-amber-700',
};

const SUBMISSION_STATUS_STYLES: Record<string, string> = {
  SUBMITTED:     'bg-blue-100 text-blue-700',
  CLIENT_REVIEW: 'bg-amber-100 text-amber-700',
  INTERVIEW:     'bg-violet-100 text-violet-700',
  OFFERED:       'bg-orange-100 text-orange-700',
  PLACED:        'bg-green-100 text-green-700',
  REJECTED:      'bg-red-100 text-red-700',
};

function formatInterviewTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `${time} Today`;
  if (isTomorrow) return `${time} Tomorrow`;
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} ${time}`;
}

export default function ATSDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData>({
    kpis: { activeCandidates: 0, openJobs: 0, pendingSubmissions: 0, activePlacements: 0 },
    upcomingInterviews: [],
    recentSubmissions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);
  const [pollResult, setPollResult] = useState<{ totalMessages: number; totalJobs: number; totalCandidates: number } | null>(null);

  useEffect(() => {
    if (authLoading) return;          // wait for auth session
    if (!user?.orgId) {               // auth done but no orgId — stop spinner
      setLoading(false);
      return;
    }
    fetch('/api/dashboard', { headers: { 'x-org-id': user.orgId } })
      .then(r => r.json())
      .then(d => { if (d?.kpis) setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [user, authLoading]);

  const checkInbox = async () => {
    if (!user?.orgId || polling) return;
    setPolling(true);
    setPollResult(null);
    try {
      const res = await fetch('/api/email-poll', {
        method: 'POST',
        headers: { 'x-org-id': user.orgId },
      });
      const json = await res.json();
      if (json.summary) {
        setPollResult(json.summary);
        // Refresh dashboard data if new jobs/candidates were added
        if (json.summary.totalJobs > 0 || json.summary.totalCandidates > 0) {
          fetch('/api/dashboard', { headers: { 'x-org-id': user.orgId } })
            .then(r => r.json())
            .then(d => { if (d?.kpis) setData(d); });
        }
      }
    } catch (e: any) {
      console.error('Poll error:', e.message);
    } finally {
      setPolling(false);
    }
  };

  const kpis = [
    { title: 'Open Jobs',           value: data.kpis.openJobs,           icon: Briefcase,    iconBg: 'bg-amber-100',  iconColor: 'text-amber-600' },
    { title: 'Active Candidates',   value: data.kpis.activeCandidates,   icon: Users,        iconBg: 'bg-blue-100',   iconColor: 'text-blue-600' },
    { title: 'Pending Submissions', value: data.kpis.pendingSubmissions,  icon: Send,         iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
    { title: 'Active Placements',   value: data.kpis.activePlacements,   icon: CheckCircle2, iconBg: 'bg-green-100',  iconColor: 'text-green-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        Failed to load dashboard: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back{user?.name ? `, ${user.name}` : ''}. Here is your recruiting overview.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={checkInbox}
            disabled={polling}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {polling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {polling ? 'Checking...' : 'Check Inbox'}
          </button>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Post Job
          </Link>
          <Link
            href="/candidates"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Candidate
          </Link>
        </div>
      </div>

      {/* Poll result toast */}
      {pollResult && (
        <div className={`mb-4 p-4 rounded-lg border text-sm flex items-center justify-between ${
          pollResult.totalMessages > 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}>
          <span>
            {pollResult.totalMessages === 0
              ? 'No new emails found.'
              : `Processed ${pollResult.totalMessages} email(s) — ${pollResult.totalJobs} new job order(s), ${pollResult.totalCandidates} new candidate(s) added.`}
          </span>
          <button onClick={() => setPollResult(null)} className="text-gray-400 hover:text-gray-600 ml-4">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{kpi.title}</span>
                <div className={`w-10 h-10 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${kpi.iconColor}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Recent Submissions</h3>
            <Link href="/submissions" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {!data?.recentSubmissions?.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">No submissions yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentSubmissions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between gap-3">
                  <div className="flex gap-3 items-start min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      <Send className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sub.candidate.firstName} {sub.candidate.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{sub.jobOrder.title}</p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded ${SUBMISSION_STATUS_STYLES[sub.status] || 'bg-gray-100 text-gray-600'}`}>
                    {sub.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Upcoming Interviews</h3>
            <Link href="/interviews" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {!data?.upcomingInterviews?.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">No upcoming interviews</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingInterviews.map((iv) => (
                <div key={iv.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {iv.candidate.firstName} {iv.candidate.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{iv.submission?.jobOrder?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{formatInterviewTime(iv.scheduledAt)}</p>
                    <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded ${INTERVIEW_TYPE_STYLES[iv.type] || 'bg-gray-100 text-gray-600'}`}>
                      {iv.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
