'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@inherenttech/ui';

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentTitle: string | null;
  visaStatus: string;
  skills: string[];
  yearsOfExperience: number | null;
  expectedRate: number | null;
  location: string | null;
  status: string;
  updatedAt: string;
};

const VISA_DISPLAY: Record<string, string> = {
  US_CITIZEN: 'US Citizen',
  GREEN_CARD: 'Green Card',
  H1B: 'H-1B',
  H1B_TRANSFER: 'H-1B Transfer',
  OPT: 'OPT',
  CPT: 'CPT',
  L1: 'L-1',
  TN: 'TN',
  OTHER: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PLACED: 'bg-blue-100 text-blue-700',
  INACTIVE: 'bg-red-100 text-red-700',
};

const PER_PAGE = 20;

export default function CandidatesPage() {
  const { user, loading: authLoading } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCandidates = useCallback(async () => {
    if (!user?.orgId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(PER_PAGE));
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/candidates?${params}`, {
        headers: { 'x-org-id': user.orgId },
      });
      const json = await res.json();
      setCandidates(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.orgId, currentPage, statusFilter, search]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.orgId) { setLoading(false); return; }
    fetchCandidates();
  }, [authLoading, user?.orgId, fetchCandidates]);

  const totalPages = Math.ceil(total / PER_PAGE);

  if (authLoading || (loading && candidates.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        Failed to load candidates: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
          <p className="text-sm text-gray-500 mt-1">{total} total candidates</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Candidate
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, title, or skills..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {['', 'ACTIVE', 'PLACED', 'INACTIVE'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {candidates.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No candidates found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Name', 'Title', 'Skills', 'Visa', 'Exp', 'Rate', 'Location', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/candidates/${c.id}`} className="block">
                        <p className="text-sm font-semibold text-gray-900 hover:text-blue-600">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.currentTitle || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{s}</span>
                        ))}
                        {c.skills.length > 3 && <span className="text-xs text-gray-400">+{c.skills.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{VISA_DISPLAY[c.visaStatus] || c.visaStatus}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.yearsOfExperience != null ? `${c.yearsOfExperience}yr` : '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">{c.expectedRate != null ? `$${c.expectedRate}/hr` : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.location || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
