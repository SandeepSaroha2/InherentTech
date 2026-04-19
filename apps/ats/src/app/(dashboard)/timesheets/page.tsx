'use client';

import React, { useState } from 'react';
import { Plus, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

type Timesheet = {
  id: string;
  consultant: string;
  client: string;
  weekEnding: string;
  regularHrs: number;
  otHrs: number;
  totalHrs: number;
  billRate: number;
  billAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
};

const MOCK_TIMESHEETS: Timesheet[] = [
  { id: 'TS001', consultant: 'Alex Johnson', client: 'TechCorp Solutions', weekEnding: '2026-03-27', regularHrs: 40, otHrs: 4, totalHrs: 44, billRate: 85, billAmount: 3740, status: 'APPROVED' },
  { id: 'TS002', consultant: 'Priya Patel', client: 'CloudBase Inc', weekEnding: '2026-03-27', regularHrs: 40, otHrs: 0, totalHrs: 40, billRate: 70, billAmount: 2800, status: 'SUBMITTED' },
  { id: 'TS003', consultant: 'David Kim', client: 'SecureNet Systems', weekEnding: '2026-03-27', regularHrs: 40, otHrs: 5, totalHrs: 45, billRate: 90, billAmount: 4275, status: 'SUBMITTED' },
  { id: 'TS004', consultant: 'Sarah Martinez', client: 'DataFlow Analytics', weekEnding: '2026-03-20', regularHrs: 32, otHrs: 0, totalHrs: 32, billRate: 65, billAmount: 2080, status: 'APPROVED' },
  { id: 'TS005', consultant: 'James Brown', client: 'TechCorp Solutions', weekEnding: '2026-03-27', regularHrs: 40, otHrs: 8, totalHrs: 48, billRate: 110, billAmount: 5280, status: 'DRAFT' },
  { id: 'TS006', consultant: 'Emma Wilson', client: 'CloudBase Inc', weekEnding: '2026-03-20', regularHrs: 40, otHrs: 2, totalHrs: 42, billRate: 75, billAmount: 3150, status: 'REJECTED' },
];

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function TimesheetsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = MOCK_TIMESHEETS.filter((ts) => statusFilter === 'ALL' || ts.status === statusFilter);

  const stats = {
    totalHours: filtered.reduce((sum, ts) => sum + ts.totalHrs, 0),
    pendingApproval: MOCK_TIMESHEETS.filter((ts) => ts.status === 'SUBMITTED').length,
    approved: MOCK_TIMESHEETS.filter((ts) => ts.status === 'APPROVED').length,
    totalBilled: MOCK_TIMESHEETS.filter((ts) => ts.status === 'APPROVED').reduce((sum, ts) => sum + ts.billAmount, 0),
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Timesheets</h2>
          <p className="text-sm text-gray-500 mt-1">Manage weekly timesheets and approvals</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          New Timesheet
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Hours', value: `${stats.totalHours}`, sub: 'hrs', color: 'text-gray-900' },
          { label: 'Pending Approval', value: `${stats.pendingApproval}`, sub: '', color: 'text-amber-600' },
          { label: 'Approved', value: `${stats.approved}`, sub: '', color: 'text-green-600' },
          { label: 'Total Billed', value: `$${(stats.totalBilled / 1000).toFixed(1)}k`, sub: '', color: 'text-blue-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>
              {kpi.value}
              {kpi.sub && <span className="text-base font-normal text-gray-400 ml-1">{kpi.sub}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Consultant', 'Client', 'Week Ending', 'Regular', 'OT', 'Total', 'Bill Amount', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((ts) => (
                <tr key={ts.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{ts.consultant}</p>
                    <p className="text-xs text-gray-400">{ts.id}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{ts.client}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(ts.weekEnding).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{ts.regularHrs}</td>
                  <td className="px-4 py-3 text-sm">
                    {ts.otHrs > 0 ? (
                      <span className="text-red-600 font-medium">+{ts.otHrs}</span>
                    ) : (
                      <span className="text-gray-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{ts.totalHrs}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">${ts.billAmount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[ts.status]}`}>
                      {ts.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {ts.status === 'SUBMITTED' ? (
                        <>
                          <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-xs font-semibold hover:bg-green-100 transition-colors">
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-xs font-semibold hover:bg-red-100 transition-colors">
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors">
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
