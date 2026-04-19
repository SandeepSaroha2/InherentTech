'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  PenTool,
  Bell,
  Eye,
  TrendingUp,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// --- Types ---
type Signer = {
  name: string;
  email: string;
  status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'EXPIRED';
  signedAt: string | null;
};

type SignatureRequest = {
  id: string;
  documentName: string;
  documentId: string;
  signers: Signer[];
  status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'EXPIRED';
  requestedDate: string;
  expiryDate: string;
};

// --- Constants ---
const FILTERS = ['ALL', 'PENDING', 'SIGNED', 'DECLINED', 'EXPIRED'] as const;

const STATUS_CONFIG: Record<string, { badge: string; icon: React.ElementType; label: string }> = {
  PENDING: { badge: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
  SIGNED: { badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Signed' },
  DECLINED: { badge: 'bg-red-100 text-red-700', icon: XCircle, label: 'Declined' },
  EXPIRED: { badge: 'bg-gray-100 text-gray-600', icon: AlertTriangle, label: 'Expired' },
};

const PAGE_SIZE = 5;

// --- Mock Data ---
const MOCK_SIGNATURES: SignatureRequest[] = [
  {
    id: '1',
    documentName: 'Employment Agreement - John Smith',
    documentId: 'doc-1',
    signers: [
      { name: 'John Smith', email: 'john@example.com', status: 'PENDING', signedAt: null },
      { name: 'HR Manager', email: 'hr@inherenttech.com', status: 'SIGNED', signedAt: '2026-03-25T11:00:00Z' },
    ],
    status: 'PENDING',
    requestedDate: '2026-03-25',
    expiryDate: '2026-04-02',
  },
  {
    id: '2',
    documentName: 'NDA - Tech Consulting',
    documentId: 'doc-2',
    signers: [{ name: 'Client Rep', email: 'client@techconsulting.com', status: 'PENDING', signedAt: null }],
    status: 'PENDING',
    requestedDate: '2026-03-24',
    expiryDate: '2026-03-30',
  },
  {
    id: '3',
    documentName: 'Offer Letter - Sarah Johnson',
    documentId: 'doc-3',
    signers: [
      { name: 'Sarah Johnson', email: 'sarah@example.com', status: 'SIGNED', signedAt: '2026-03-21T14:00:00Z' },
      { name: 'CEO', email: 'ceo@inherenttech.com', status: 'SIGNED', signedAt: '2026-03-22T09:00:00Z' },
    ],
    status: 'SIGNED',
    requestedDate: '2026-03-20',
    expiryDate: '2026-04-05',
  },
  {
    id: '4',
    documentName: 'Statement of Work - Client ABC',
    documentId: 'doc-5',
    signers: [
      { name: 'Project Manager', email: 'pm@inherenttech.com', status: 'SIGNED', signedAt: '2026-03-20T10:00:00Z' },
      { name: 'Client Contact', email: 'contact@clientabc.com', status: 'PENDING', signedAt: null },
    ],
    status: 'PENDING',
    requestedDate: '2026-03-19',
    expiryDate: '2026-04-01',
  },
  {
    id: '5',
    documentName: 'W-4 Form - Mike Chen',
    documentId: 'doc-4',
    signers: [{ name: 'Mike Chen', email: 'mike@example.com', status: 'SIGNED', signedAt: '2026-03-16T15:30:00Z' }],
    status: 'SIGNED',
    requestedDate: '2026-03-15',
    expiryDate: '2026-04-15',
  },
  {
    id: '6',
    documentName: 'Direct Deposit - Alice Brown',
    documentId: 'doc-7',
    signers: [{ name: 'Alice Brown', email: 'alice@example.com', status: 'EXPIRED', signedAt: null }],
    status: 'EXPIRED',
    requestedDate: '2026-02-25',
    expiryDate: '2026-03-10',
  },
  {
    id: '7',
    documentName: 'Contractor Agreement - Vendor X',
    documentId: 'doc-8',
    signers: [
      { name: 'Vendor Rep', email: 'rep@vendorx.com', status: 'DECLINED', signedAt: null },
    ],
    status: 'DECLINED',
    requestedDate: '2026-03-10',
    expiryDate: '2026-03-25',
  },
  {
    id: '8',
    documentName: 'NDA - New Vendor Partnership',
    documentId: 'doc-9',
    signers: [
      { name: 'Legal Counsel', email: 'legal@newvendor.com', status: 'PENDING', signedAt: null },
      { name: 'VP Operations', email: 'vp@inherenttech.com', status: 'SIGNED', signedAt: '2026-03-26T08:00:00Z' },
    ],
    status: 'PENDING',
    requestedDate: '2026-03-25',
    expiryDate: '2026-04-10',
  },
];

export default function SignaturesPage() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return MOCK_SIGNATURES.filter((sig) => {
      const matchesFilter = selectedFilter === 'ALL' || sig.status === selectedFilter;
      const matchesSearch =
        !search ||
        sig.documentName.toLowerCase().includes(search.toLowerCase()) ||
        sig.signers.some((s) => s.name.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [selectedFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const pendingCount = MOCK_SIGNATURES.filter((s) => s.status === 'PENDING').length;
  const signedCount = MOCK_SIGNATURES.filter((s) => s.status === 'SIGNED').length;
  const declinedCount = MOCK_SIGNATURES.filter((s) => s.status === 'DECLINED').length;
  const expiredCount = MOCK_SIGNATURES.filter((s) => s.status === 'EXPIRED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Signatures</h1>
        <p className="text-sm text-gray-500 mt-1">Track and manage all signature requests.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending" value={pendingCount} icon={Clock} color="text-amber-600" bgColor="bg-amber-50" />
        <StatCard label="Signed" value={signedCount} icon={CheckCircle2} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard label="Declined" value={declinedCount} icon={XCircle} color="text-red-600" bgColor="bg-red-50" />
        <StatCard label="Avg. Completion" value="1.5 days" icon={TrendingUp} color="text-violet-600" bgColor="bg-violet-50" isText />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by document or signer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => { setSelectedFilter(filter); setPage(1); }}
              className={`
                px-3.5 py-2 rounded-lg text-xs font-medium transition-colors
                ${
                  selectedFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Signature Request Cards */}
      <div className="space-y-4">
        {paginated.map((sig) => {
          const config = STATUS_CONFIG[sig.status];
          const StatusIcon = config.icon;

          return (
            <div
              key={sig.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => router.push(`/documents/${sig.documentId}`)}
                      className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
                    >
                      {sig.documentName}
                    </button>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badge} flex-shrink-0`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>

                  {/* Signers */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Signers</p>
                    <div className="flex flex-wrap gap-3">
                      {sig.signers.map((signer, idx) => {
                        const signerConfig = STATUS_CONFIG[signer.status];
                        const SignerIcon = signerConfig.icon;
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {signer.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 leading-tight">{signer.name}</p>
                              <div className="flex items-center gap-1">
                                <SignerIcon className="w-3 h-3" style={{ color: signer.status === 'SIGNED' ? '#059669' : signer.status === 'PENDING' ? '#d97706' : '#dc2626' }} />
                                <span className="text-xs text-gray-500">
                                  {signer.status === 'SIGNED' && signer.signedAt
                                    ? `Signed ${new Date(signer.signedAt).toLocaleDateString()}`
                                    : signerConfig.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Requested: {sig.requestedDate}</span>
                    <span>Expires: {sig.expiryDate}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 sm:flex-col sm:items-end">
                  <button
                    onClick={() => router.push(`/documents/${sig.documentId}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  {sig.status === 'PENDING' && (
                    <>
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors">
                        <PenTool className="w-3.5 h-3.5" />
                        Sign
                      </button>
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        <Bell className="w-3.5 h-3.5" />
                        Remind
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {paginated.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No signature requests found.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
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
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  isText = false,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className={`text-xl font-bold ${color} mt-0.5`}>{isText ? value : value}</p>
      </div>
    </div>
  );
}
