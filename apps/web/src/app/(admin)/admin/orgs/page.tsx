'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@inherenttech/ui';
import {
  Search,
  Plus,
  MoreHorizontal,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const MOCK_ORGS = [
  { id: 1, name: 'TechCorp Inc', slug: 'techcorp', plan: 'Professional', users: 18, status: 'Active', mrr: 149, createdAt: '2025-06-12' },
  { id: 2, name: 'StartupXYZ', slug: 'startupxyz', plan: 'Starter', users: 7, status: 'Active', mrr: 49, createdAt: '2025-08-23' },
  { id: 3, name: 'Enterprise Ltd', slug: 'enterprise-ltd', plan: 'Enterprise', users: 145, status: 'Active', mrr: 499, createdAt: '2025-01-05' },
  { id: 4, name: 'Creative Studios', slug: 'creative-studios', plan: 'Professional', users: 24, status: 'Active', mrr: 149, createdAt: '2025-09-14' },
  { id: 5, name: 'Growth Agency', slug: 'growth-agency', plan: 'Starter', users: 5, status: 'Active', mrr: 49, createdAt: '2025-11-02' },
  { id: 6, name: 'Digital Solutions', slug: 'digital-solutions', plan: 'Professional', users: 32, status: 'Suspended', mrr: 0, createdAt: '2025-04-18' },
  { id: 7, name: 'Consulting Group', slug: 'consulting-group', plan: 'Enterprise', users: 89, status: 'Active', mrr: 499, createdAt: '2025-02-28' },
  { id: 8, name: 'Local Business', slug: 'local-biz', plan: 'Free', users: 2, status: 'Active', mrr: 0, createdAt: '2026-01-10' },
  { id: 9, name: 'Innovation Labs', slug: 'innovation-labs', plan: 'Professional', users: 15, status: 'Trial', mrr: 0, createdAt: '2026-03-01' },
  { id: 10, name: 'Scale Ventures', slug: 'scale-ventures', plan: 'Starter', users: 11, status: 'Active', mrr: 49, createdAt: '2026-02-14' },
];

const planColors: Record<string, string> = {
  Free: 'bg-gray-100 text-gray-700',
  Starter: 'bg-blue-100 text-blue-700',
  Professional: 'bg-purple-100 text-purple-700',
  Enterprise: 'bg-amber-100 text-amber-700',
};

const statusColors: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Suspended: 'bg-red-100 text-red-700',
  Trial: 'bg-yellow-100 text-yellow-700',
};

export default function OrganizationsPage() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');

  const filtered = MOCK_ORGS.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === 'All' || org.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage all registered organizations on the platform.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
          <Plus className="h-4 w-4" />
          Add Organization
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Organizations', value: MOCK_ORGS.length.toString(), color: 'text-blue-600' },
          { label: 'Active', value: MOCK_ORGS.filter(o => o.status === 'Active').length.toString(), color: 'text-green-600' },
          { label: 'On Trial', value: MOCK_ORGS.filter(o => o.status === 'Trial').length.toString(), color: 'text-yellow-600' },
          { label: 'Total MRR', value: `$${MOCK_ORGS.reduce((s, o) => s + o.mrr, 0).toLocaleString()}`, color: 'text-purple-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizations..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="All">All Plans</option>
              <option value="Free">Free</option>
              <option value="Starter">Starter</option>
              <option value="Professional">Professional</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Organization</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Plan</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Users</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">MRR</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Created</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => (
                  <tr key={org.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{org.name}</p>
                          <p className="text-xs text-gray-500">{org.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${planColors[org.plan]}`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{org.users}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[org.status]}`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {org.mrr > 0 ? `$${org.mrr}` : '--'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{org.createdAt}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      No organizations found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Showing {filtered.length} of {MOCK_ORGS.length} organizations
            </p>
            <div className="flex items-center gap-1">
              <button className="p-1.5 border border-gray-300 rounded-lg text-gray-400 hover:text-gray-600">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg">
                1
              </button>
              <button className="p-1.5 border border-gray-300 rounded-lg text-gray-400 hover:text-gray-600">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
