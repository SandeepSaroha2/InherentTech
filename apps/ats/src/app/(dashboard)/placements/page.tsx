'use client';

import React, { useState } from 'react';
import { CheckCircle2, DollarSign, TrendingUp, Users } from 'lucide-react';

type Placement = {
  id: string;
  candidate: string;
  job: string;
  client: string;
  status: string;
  startDate: string;
  endDate: string | null;
  billRate: number;
  payRate: number;
  recruiter: string;
};

const STATUSES = ['ALL', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'ON_HOLD'];
const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  TERMINATED: 'bg-red-100 text-red-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
};

const MOCK_PLACEMENTS: Placement[] = [
  { id: '1', candidate: 'James Brown', job: 'Data Engineer', client: 'MedTech', status: 'ACTIVE', startDate: '2026-01-15', endDate: '2026-07-15', billRate: 80, payRate: 52, recruiter: 'Sarah' },
  { id: '2', candidate: 'Priya Patel', job: 'React Developer', client: 'FinanceHub', status: 'ACTIVE', startDate: '2026-02-01', endDate: '2026-08-01', billRate: 75, payRate: 48, recruiter: 'Sarah' },
  { id: '3', candidate: 'Tom Wilson', job: 'Cloud Architect', client: 'TechCorp', status: 'ACTIVE', startDate: '2025-11-01', endDate: '2026-05-01', billRate: 110, payRate: 72, recruiter: 'Mike' },
  { id: '4', candidate: 'Anna Lee', job: 'BA/QA Lead', client: 'DataSync', status: 'COMPLETED', startDate: '2025-06-01', endDate: '2025-12-01', billRate: 70, payRate: 45, recruiter: 'Sarah' },
  { id: '5', candidate: 'Carlos Ruiz', job: 'Java Developer', client: 'RetailPro', status: 'TERMINATED', startDate: '2025-09-01', endDate: '2025-11-15', billRate: 85, payRate: 55, recruiter: 'Mike' },
  { id: '6', candidate: 'Emily Chen', job: 'DevOps Engineer', client: 'CloudBase', status: 'ON_HOLD', startDate: '2026-03-01', endDate: '2026-09-01', billRate: 95, payRate: 62, recruiter: 'Sarah' },
];

export default function PlacementsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const filtered = MOCK_PLACEMENTS.filter((p) => statusFilter === 'ALL' || p.status === statusFilter);

  const active = MOCK_PLACEMENTS.filter((p) => p.status === 'ACTIVE').length;
  const totalWeeklyRevenue = MOCK_PLACEMENTS.filter((p) => p.status === 'ACTIVE').reduce((sum, p) => sum + (p.billRate - p.payRate) * 40, 0);
  const avgBillRate = Math.round(MOCK_PLACEMENTS.reduce((s, p) => s + p.billRate, 0) / MOCK_PLACEMENTS.length);
  const avgMargin = Math.round(MOCK_PLACEMENTS.reduce((s, p) => s + ((p.billRate - p.payRate) / p.billRate) * 100, 0) / MOCK_PLACEMENTS.length);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Placements</h2>
        <p className="text-sm text-gray-500 mt-1">Manage active and past placements</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-500" />
            <p className="text-xs text-gray-500">Active Placements</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{active}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-500">Weekly Revenue</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">${totalWeeklyRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            <p className="text-xs text-gray-500">Avg Bill Rate</p>
          </div>
          <p className="text-2xl font-bold text-violet-600">${avgBillRate}/hr</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-gray-500">Avg Margin</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{avgMargin}%</p>
        </div>
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Candidate', 'Job Title', 'Client', 'Status', 'Start', 'End', 'Bill Rate', 'Pay Rate', 'Margin', 'Recruiter'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{p.candidate}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.job}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.client}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.endDate ? new Date(p.endDate).toLocaleDateString() : <span className="text-gray-300">&mdash;</span>}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">${p.billRate}/hr</td>
                  <td className="px-4 py-3 text-sm text-gray-700">${p.payRate}/hr</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                    ${p.billRate - p.payRate}/hr ({Math.round(((p.billRate - p.payRate) / p.billRate) * 100)}%)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.recruiter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
