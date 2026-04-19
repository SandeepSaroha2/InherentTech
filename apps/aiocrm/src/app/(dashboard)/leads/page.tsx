'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building2,
  User,
} from 'lucide-react';

// --- Types ---
type Lead = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  stage: string;
  value: number;
  source: string;
  owner: string;
  lastContact: string;
  createdAt: string;
};

// --- Constants ---
const STAGES = ['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as const;
const SOURCES = ['ALL', 'LinkedIn', 'Referral', 'Website', 'Cold Call', 'Conference'] as const;

const STAGE_BADGE: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-violet-100 text-violet-700',
  QUALIFIED: 'bg-amber-100 text-amber-700',
  PROPOSAL: 'bg-orange-100 text-orange-700',
  NEGOTIATION: 'bg-pink-100 text-pink-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
};

const STAGE_KANBAN_BORDER: Record<string, string> = {
  NEW: 'border-t-blue-500',
  CONTACTED: 'border-t-violet-500',
  QUALIFIED: 'border-t-amber-500',
  PROPOSAL: 'border-t-orange-500',
  NEGOTIATION: 'border-t-pink-500',
  WON: 'border-t-green-500',
  LOST: 'border-t-red-500',
};

const PAGE_SIZE = 8;

// --- Mock Data ---
const MOCK_LEADS: Lead[] = [
  { id: '1', companyName: 'TechCorp Solutions', contactName: 'Jennifer Smith', contactEmail: 'jsmith@techcorp.com', stage: 'QUALIFIED', value: 250000, source: 'LinkedIn', owner: 'Sarah', lastContact: '2026-03-26', createdAt: '2026-03-20T10:00:00Z' },
  { id: '2', companyName: 'FinanceHub Inc', contactName: 'Robert Chen', contactEmail: 'rchen@financehub.com', stage: 'PROPOSAL', value: 180000, source: 'Referral', owner: 'Admin', lastContact: '2026-03-25', createdAt: '2026-03-18T14:00:00Z' },
  { id: '3', companyName: 'DataSync Corp', contactName: 'Maria Garcia', contactEmail: 'mgarcia@datasync.com', stage: 'NEW', value: 120000, source: 'Website', owner: 'Sarah', lastContact: '2026-03-27', createdAt: '2026-03-25T09:00:00Z' },
  { id: '4', companyName: 'CloudBase', contactName: 'James Wilson', contactEmail: 'jwilson@cloudbase.com', stage: 'NEGOTIATION', value: 340000, source: 'LinkedIn', owner: 'Mike', lastContact: '2026-03-24', createdAt: '2026-03-15T11:00:00Z' },
  { id: '5', companyName: 'MedTech Labs', contactName: 'Dr. Emily Park', contactEmail: 'epark@medtech.com', stage: 'CONTACTED', value: 95000, source: 'Cold Call', owner: 'Sarah', lastContact: '2026-03-23', createdAt: '2026-03-22T16:00:00Z' },
  { id: '6', companyName: 'RetailFlow', contactName: 'Alex Turner', contactEmail: 'aturner@retailflow.com', stage: 'NEW', value: 75000, source: 'Conference', owner: 'Mike', lastContact: '2026-03-27', createdAt: '2026-03-26T08:00:00Z' },
  { id: '7', companyName: 'GreenEnergy Co', contactName: 'Lisa Zhang', contactEmail: 'lzhang@greenenergy.com', stage: 'WON', value: 420000, source: 'Referral', owner: 'Admin', lastContact: '2026-03-20', createdAt: '2026-02-10T09:00:00Z' },
  { id: '8', companyName: 'StartupXYZ', contactName: 'Kevin Brown', contactEmail: 'kbrown@startupxyz.com', stage: 'LOST', value: 50000, source: 'Website', owner: 'Sarah', lastContact: '2026-03-15', createdAt: '2026-03-01T12:00:00Z' },
  { id: '9', companyName: 'Acme Industries', contactName: 'Patricia Davis', contactEmail: 'pdavis@acme.com', stage: 'QUALIFIED', value: 310000, source: 'LinkedIn', owner: 'Mike', lastContact: '2026-03-26', createdAt: '2026-03-12T14:00:00Z' },
  { id: '10', companyName: 'Nova Systems', contactName: 'Daniel Lee', contactEmail: 'dlee@novasys.com', stage: 'CONTACTED', value: 145000, source: 'Cold Call', owner: 'Admin', lastContact: '2026-03-22', createdAt: '2026-03-19T10:00:00Z' },
];

// --- Page ---
export default function LeadsPage() {
  const router = useRouter();
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const filteredLeads = useMemo(() => {
    return MOCK_LEADS.filter((lead) => {
      if (stageFilter !== 'ALL' && lead.stage !== stageFilter) return false;
      if (sourceFilter !== 'ALL' && lead.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !lead.companyName.toLowerCase().includes(q) &&
          !lead.contactName.toLowerCase().includes(q) &&
          !lead.contactEmail.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [search, stageFilter, sourceFilter]);

  const totalPages = Math.ceil(filteredLeads.length / PAGE_SIZE);
  const paginatedLeads = filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Kanban groups
  const kanbanStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'];
  const kanbanGroups = useMemo(() => {
    const groups: Record<string, Lead[]> = {};
    kanbanStages.forEach((s) => (groups[s] = []));
    filteredLeads.forEach((l) => {
      if (groups[l.stage]) groups[l.stage].push(l);
    });
    return groups;
  }, [filteredLeads]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filteredLeads.length} leads found</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors self-start">
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>

        {/* Stage Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {STAGES.map((stage) => (
            <button
              key={stage}
              onClick={() => { setStageFilter(stage); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                stageFilter === stage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>

        {/* Source Filter */}
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'All Sources' : s}</option>
          ))}
        </select>

        {/* View Toggle */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden self-start">
          <button
            onClick={() => setView('table')}
            className={`p-2 ${view === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`p-2 ${view === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Company', 'Contact', 'Stage', 'Value', 'Source', 'Last Contact', 'Owner'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{lead.companyName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{lead.contactName}</p>
                        <p className="text-xs text-gray-400">{lead.contactEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STAGE_BADGE[lead.stage] || 'bg-gray-100 text-gray-600'}`}>
                          {lead.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ${(lead.value / 1000).toFixed(0)}K
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{lead.source}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(lead.lastContact).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">{lead.owner[0]}</span>
                          </div>
                          <span className="text-sm text-gray-600">{lead.owner}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {paginatedLeads.length === 0 && (
              <div className="py-16 text-center text-gray-400 text-sm">No leads match your filters.</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLeads.length)} of {filteredLeads.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanStages.map((stage) => (
            <div key={stage} className="flex-shrink-0 w-72">
              <div className={`bg-white rounded-xl border border-gray-200 border-t-2 ${STAGE_KANBAN_BORDER[stage]} overflow-hidden`}>
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">{stage}</h3>
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
                    {kanbanGroups[stage]?.length || 0}
                  </span>
                </div>
                <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                  {(kanbanGroups[stage] || []).map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      <p className="text-sm font-semibold text-gray-900">{lead.companyName}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{lead.contactName}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-gray-900">${(lead.value / 1000).toFixed(0)}K</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-white">{lead.owner[0]}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(kanbanGroups[stage] || []).length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6">No leads</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
