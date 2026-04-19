'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, MapPin, DollarSign, Users, Loader2 } from 'lucide-react';
import { useAuth } from '@inherenttech/ui';

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100 text-red-700',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  FILLED: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
  DRAFT: 'bg-gray-100 text-gray-600',
};

type RateRange = { min?: number; max?: number; type?: string } | null;

type Job = {
  id: string;
  jobNumber: number;
  title: string;
  location: string | null;
  rateRange: RateRange | string | null;
  openings: number;
  filled: number;
  priority: string;
  status: string;
  createdAt: string;
  ceipalJobId: string | null;
  client: { id: string; companyName: string } | null;
  assignedTo: { id: string; name: string | null } | null;
  _count: { submissions: number };
};

function jobId(n: number) {
  return `INH-${String(n).padStart(4, '0')}`;
}

function formatRate(rateRange: RateRange | string | null): string {
  if (!rateRange) return '—';
  if (typeof rateRange === 'string') return rateRange;
  const { min, max } = rateRange;
  if (min && max && min !== max) return `$${min}–$${max}/hr`;
  if (min) return `$${min}/hr`;
  return '—';
}

export default function JobsPage() {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = useCallback(async () => {
    if (!user?.orgId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/jobs?${params}`, {
        headers: { 'x-org-id': user.orgId },
      });
      const json = await res.json();
      setJobs(json.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.orgId, statusFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.orgId) { setLoading(false); return; }
    fetchJobs();
  }, [authLoading, user?.orgId, fetchJobs]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        Failed to load jobs: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Orders</h2>
          <p className="text-sm text-gray-500 mt-1">
            {jobs.length} jobs {statusFilter ? `(${statusFilter.toLowerCase().replace('_', ' ')})` : ''}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          New Job Order
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['', 'OPEN', 'FILLED', 'ON_HOLD', 'CANCELLED', 'DRAFT'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {/* Job Cards Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {jobs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No job orders found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Job ID', 'Job Title', 'Client', 'Location', 'Rate', 'Status', 'Submissions', 'Progress'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    {/* Job ID */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link href={`/jobs/${job.id}`}>
                        <span className="inline-block font-mono text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                          {jobId(job.jobNumber)}
                        </span>
                        {job.ceipalJobId && (
                          <p className="text-xs text-emerald-600 mt-1">✓ On Ceipal</p>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/jobs/${job.id}`} className="block">
                        <p className="text-sm font-semibold text-gray-900 hover:text-blue-600">{job.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${PRIORITY_STYLES[job.priority] || 'bg-gray-100 text-gray-600'}`}>
                            {job.priority}
                          </span>
                          {job.assignedTo?.name && (
                            <span className="text-xs text-gray-400">Assigned: {job.assignedTo.name}</span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{job.client?.companyName || '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatRate(job.rateRange)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[job.status] || 'bg-gray-100 text-gray-600'}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {job._count.submissions}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className={`h-full rounded-full transition-all ${job.filled >= job.openings ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(100, (job.filled / job.openings) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{job.filled}/{job.openings}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
