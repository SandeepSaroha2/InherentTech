'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  PenTool,
  CheckCircle2,
  FolderOpen,
  Plus,
  Upload,
  Send,
  BookOpen,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

// --- Mock Data ---
const MOCK_RECENT_DOCUMENTS = [
  { id: '1', name: 'Employment Agreement - John Smith', status: 'SIGNED', createdDate: '2026-03-25', creator: 'HR Manager' },
  { id: '2', name: 'NDA - Tech Consulting', status: 'PENDING', createdDate: '2026-03-24', creator: 'Legal Team' },
  { id: '3', name: 'Offer Letter - Sarah Johnson', status: 'DRAFT', createdDate: '2026-03-23', creator: 'Recruiting' },
  { id: '4', name: 'W-4 Form - Mike Chen', status: 'SIGNED', createdDate: '2026-03-22', creator: 'Payroll' },
  { id: '5', name: 'Statement of Work - Client ABC', status: 'PENDING', createdDate: '2026-03-21', creator: 'Project Manager' },
  { id: '6', name: 'I-9 Verification', status: 'SIGNED', createdDate: '2026-03-20', creator: 'Compliance' },
];

const MOCK_SIGNATURE_REQUESTS = [
  { id: '1', document: 'Employment Agreement - John Smith', signers: ['John Smith', 'HR Manager'], status: 'PENDING', expiry: '2026-04-02' },
  { id: '2', document: 'NDA - Tech Consulting', signers: ['Client Rep'], status: 'PENDING', expiry: '2026-03-30' },
  { id: '3', document: 'Offer Letter - Sarah Johnson', signers: ['Sarah Johnson'], status: 'PENDING', expiry: '2026-04-05' },
];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-100 text-amber-700',
  SIGNED: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-red-100 text-red-700',
};

// --- Status Distribution Data ---
const STATUS_DISTRIBUTION = [
  { label: 'Draft', count: 23, color: 'bg-gray-400', pct: 15 },
  { label: 'Pending', count: 34, color: 'bg-amber-400', pct: 22 },
  { label: 'Partially Signed', count: 18, color: 'bg-blue-400', pct: 12 },
  { label: 'Completed', count: 67, color: 'bg-emerald-500', pct: 43 },
  { label: 'Expired', count: 14, color: 'bg-red-400', pct: 8 },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back! Here is an overview of your documents and signatures.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Documents"
          value="156"
          change="+12 this week"
          trend="up"
          icon={FileText}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <KPICard
          label="Pending Signatures"
          value="12"
          change="3 due today"
          trend="down"
          icon={PenTool}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KPICard
          label="Completed"
          value="98"
          change="+8 this week"
          trend="up"
          icon={CheckCircle2}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KPICard
          label="Templates"
          value="24"
          change="4 categories"
          trend="up"
          icon={FolderOpen}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            label="New Document"
            icon={Plus}
            onClick={() => router.push('/documents/new')}
            variant="primary"
          />
          <QuickAction
            label="New Template"
            icon={FolderOpen}
            onClick={() => router.push('/templates')}
            variant="secondary"
          />
          <QuickAction
            label="Upload Document"
            icon={Upload}
            onClick={() => {}}
            variant="secondary"
          />
          <QuickAction
            label="Request Signature"
            icon={Send}
            onClick={() => router.push('/signatures')}
            variant="secondary"
          />
        </div>
      </div>

      {/* Document Status Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Document Status Breakdown</h2>
        {/* Stacked bar */}
        <div className="flex h-4 rounded-full overflow-hidden mb-4">
          {STATUS_DISTRIBUTION.map((item) => (
            <div
              key={item.label}
              className={`${item.color} transition-all`}
              style={{ width: `${item.pct}%` }}
              title={`${item.label}: ${item.count}`}
            />
          ))}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {STATUS_DISTRIBUTION.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <span className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-gray-600">{item.label}</span>
              <span className="font-semibold text-gray-900">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: Recent Docs + Pending Signatures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents - wider */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Documents</h2>
            <button
              onClick={() => router.push('/documents')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Created</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Creator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MOCK_RECENT_DOCUMENTS.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/documents/${doc.id}`)}
                  >
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[doc.status]}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 hidden sm:table-cell">{doc.createdDate}</td>
                    <td className="px-5 py-3 text-sm text-gray-500 hidden md:table-cell">{doc.creator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Signatures */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Pending Signatures</h2>
            <button
              onClick={() => router.push('/signatures')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {MOCK_SIGNATURE_REQUESTS.map((req) => (
              <div key={req.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{req.document}</h3>
                <p className="text-xs text-gray-500 mb-2">
                  Signers: {req.signers.join(', ')}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expires {req.expiry}</span>
                  </div>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors">
                    Remind
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function KPICard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
      <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <div className="flex items-center gap-1 mt-1">
          {trend === 'up' ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span className="text-xs text-gray-500">{change}</span>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  label,
  icon: Icon,
  onClick,
  variant,
}: {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant: 'primary' | 'secondary';
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold
        transition-colors duration-150
        ${
          variant === 'primary'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
