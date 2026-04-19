'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Download,
  Trash2,
  Eye,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
} from 'lucide-react';

// --- Types ---
type Document = {
  id: string;
  name: string;
  template: string;
  status: string;
  signers: number;
  totalSigners: number;
  createdBy: string;
  createdDate: string;
  lastUpdated: string;
};

// --- Constants ---
const STATUSES = ['ALL', 'DRAFT', 'PENDING_SIGNATURE', 'PARTIALLY_SIGNED', 'COMPLETED', 'EXPIRED'] as const;

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING_SIGNATURE: 'bg-amber-100 text-amber-700',
  PARTIALLY_SIGNED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_SIGNATURE: 'Pending Signature',
  PARTIALLY_SIGNED: 'Partially Signed',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
};

const PAGE_SIZE = 6;

// --- Mock Data ---
const MOCK_DOCUMENTS: Document[] = [
  { id: '1', name: 'Employment Agreement - John Smith', template: 'Employment Agreement', status: 'COMPLETED', signers: 2, totalSigners: 2, createdBy: 'HR Manager', createdDate: '2026-03-25', lastUpdated: '2026-03-26' },
  { id: '2', name: 'NDA - Tech Consulting', template: 'Non-Disclosure Agreement', status: 'PENDING_SIGNATURE', signers: 0, totalSigners: 1, createdBy: 'Legal Team', createdDate: '2026-03-24', lastUpdated: '2026-03-24' },
  { id: '3', name: 'Offer Letter - Sarah Johnson', template: 'Offer Letter', status: 'DRAFT', signers: 0, totalSigners: 2, createdBy: 'Recruiting', createdDate: '2026-03-23', lastUpdated: '2026-03-23' },
  { id: '4', name: 'W-4 Form - Mike Chen', template: 'W-4 Form', status: 'COMPLETED', signers: 1, totalSigners: 1, createdBy: 'Payroll', createdDate: '2026-03-22', lastUpdated: '2026-03-23' },
  { id: '5', name: 'Statement of Work - Client ABC', template: 'Statement of Work', status: 'PARTIALLY_SIGNED', signers: 1, totalSigners: 2, createdBy: 'Project Manager', createdDate: '2026-03-21', lastUpdated: '2026-03-22' },
  { id: '6', name: 'I-9 Verification - Tom Lee', template: 'I-9 Verification', status: 'COMPLETED', signers: 1, totalSigners: 1, createdBy: 'Compliance', createdDate: '2026-03-20', lastUpdated: '2026-03-21' },
  { id: '7', name: 'Direct Deposit - Alice Brown', template: 'Direct Deposit Form', status: 'EXPIRED', signers: 0, totalSigners: 1, createdBy: 'Payroll', createdDate: '2026-03-19', lastUpdated: '2026-03-19' },
  { id: '8', name: 'Contractor Agreement - Vendor X', template: 'Contractor Agreement', status: 'DRAFT', signers: 0, totalSigners: 3, createdBy: 'Legal Team', createdDate: '2026-03-18', lastUpdated: '2026-03-18' },
  { id: '9', name: 'NDA - New Vendor', template: 'Non-Disclosure Agreement', status: 'PENDING_SIGNATURE', signers: 0, totalSigners: 2, createdBy: 'Legal Team', createdDate: '2026-03-17', lastUpdated: '2026-03-17' },
  { id: '10', name: 'Employment Agreement - Lisa Wang', template: 'Employment Agreement', status: 'PARTIALLY_SIGNED', signers: 1, totalSigners: 2, createdBy: 'HR Manager', createdDate: '2026-03-16', lastUpdated: '2026-03-18' },
];

export default function DocumentsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return MOCK_DOCUMENTS.filter((doc) => {
      const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
      const matchesSearch =
        !search || doc.name.toLowerCase().includes(search.toLowerCase()) || doc.template.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selected.length === paginated.length) {
      setSelected([]);
    } else {
      setSelected(paginated.map((d) => d.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} documents</p>
        </div>
        <button
          onClick={() => router.push('/documents/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Document
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`
                px-3 py-2 rounded-lg text-xs font-medium transition-colors
                ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              {s === 'ALL' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-blue-700">
            {selected.length} document{selected.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === paginated.length && paginated.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Document Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Template</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Signers</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Created</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Updated</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => router.push(`/documents/${doc.id}`)}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
                    >
                      {doc.name}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 hidden md:table-cell">{doc.template}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[doc.status]}`}>
                      {STATUS_LABEL[doc.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {doc.signers}/{doc.totalSigners}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 hidden sm:table-cell">{doc.createdDate}</td>
                  <td className="px-5 py-3 text-sm text-gray-500 hidden xl:table-cell">{doc.lastUpdated}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 justify-center">
                      <button
                        onClick={() => router.push(`/documents/${doc.id}`)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-emerald-600 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {(doc.status === 'DRAFT' || doc.status === 'PENDING_SIGNATURE') && (
                        <button
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors"
                          title="Sign"
                        >
                          <PenTool className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginated.length === 0 && (
          <div className="px-5 py-12 text-center">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No documents found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}--{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                    page === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
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
