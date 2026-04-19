'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@inherenttech/ui';

type Submission = {
  id: string;
  status: string;
  billRate: number | null;
  payRate: number | null;
  submittedAt: string;
  candidate: { id: string; firstName: string; lastName: string; email: string };
  jobOrder: { id: string; title: string };
  submittedBy: { id: string; name: string | null } | null;
};

const STATUSES = ['ALL', 'SUBMITTED', 'CLIENT_REVIEW', 'INTERVIEW', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'];
const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-700',
  CLIENT_REVIEW: 'bg-amber-100 text-amber-700',
  INTERVIEW: 'bg-violet-100 text-violet-700',
  OFFERED: 'bg-emerald-100 text-emerald-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-600',
};

const WORKFLOW_STEPS = ['SUBMITTED', 'CLIENT_REVIEW', 'INTERVIEW', 'OFFERED', 'ACCEPTED'];

function ProgressTracker({ currentStatus }: { currentStatus: string }) {
  const currentIdx = WORKFLOW_STEPS.indexOf(currentStatus);
  const isTerminal = currentStatus === 'REJECTED' || currentStatus === 'WITHDRAWN';

  return (
    <div className="flex items-center gap-1 mt-3">
      {WORKFLOW_STEPS.map((step, i) => {
        const isCompleted = !isTerminal && currentIdx >= i;
        const isCurrent = currentIdx === i;
        return (
          <React.Fragment key={step}>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0
                ${isTerminal ? 'bg-red-100 text-red-500' : isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}
                ${isCurrent && !isTerminal ? 'ring-2 ring-blue-300' : ''}
              `}
            >
              {isCompleted ? '✓' : i + 1}
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 max-w-[32px] ${!isTerminal && currentIdx > i ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function SubmissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubmissions = useCallback(async () => {
    if (!user?.orgId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/submissions?${params}`, {
        headers: { 'x-org-id': user.orgId },
      });
      const json = await res.json();
      setSubmissions(json.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.orgId, statusFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.orgId) { setLoading(false); return; }
    fetchSubmissions();
  }, [authLoading, user?.orgId, fetchSubmissions]);

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${s.candidate.firstName} ${s.candidate.lastName}`.toLowerCase().includes(q) ||
      s.jobOrder.title.toLowerCase().includes(q)
    );
  });

  if (authLoading || (loading && submissions.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        Failed to load submissions: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Submissions</h2>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} submissions</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          New Submission
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search candidate or job..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Submission Cards */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
          No submissions found
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => {
            const bill = sub.billRate ?? 0;
            const pay = sub.payRate ?? 0;
            const margin = bill - pay;
            const marginPct = bill > 0 ? Math.round((margin / bill) * 100) : 0;
            return (
              <div
                key={sub.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {sub.candidate.firstName} {sub.candidate.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{sub.jobOrder.title}</p>
                  </div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[sub.status] || 'bg-gray-100 text-gray-600'}`}>
                    {sub.status.replace('_', ' ')}
                  </span>
                </div>

                <ProgressTracker currentStatus={sub.status} />

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-3 text-sm text-gray-500">
                  {bill > 0 && (
                    <span>Bill: <strong className="text-green-600">${bill}/hr</strong></span>
                  )}
                  {pay > 0 && (
                    <span>Pay: <strong className="text-gray-700">${pay}/hr</strong></span>
                  )}
                  {bill > 0 && pay > 0 && (
                    <span>Margin: <strong className="text-blue-600">${margin}/hr ({marginPct}%)</strong></span>
                  )}
                  {sub.submittedBy?.name && <span>By: {sub.submittedBy.name}</span>}
                  <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
