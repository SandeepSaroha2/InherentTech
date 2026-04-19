'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@inherenttech/ui';
import {
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  CreditCard,
  Shield,
  FileText,
  LogIn,
  LogOut,
  Trash2,
  Edit,
  Plus,
  Calendar,
} from 'lucide-react';

type AuditAction = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'export' | 'billing' | 'settings' | 'invite' | 'role_change';

const actionConfig: Record<AuditAction, { label: string; icon: typeof User; color: string }> = {
  login: { label: 'Login', icon: LogIn, color: 'bg-green-100 text-green-700' },
  logout: { label: 'Logout', icon: LogOut, color: 'bg-gray-100 text-gray-700' },
  create: { label: 'Create', icon: Plus, color: 'bg-blue-100 text-blue-700' },
  update: { label: 'Update', icon: Edit, color: 'bg-yellow-100 text-yellow-700' },
  delete: { label: 'Delete', icon: Trash2, color: 'bg-red-100 text-red-700' },
  export: { label: 'Export', icon: Download, color: 'bg-purple-100 text-purple-700' },
  billing: { label: 'Billing', icon: CreditCard, color: 'bg-emerald-100 text-emerald-700' },
  settings: { label: 'Settings', icon: Settings, color: 'bg-orange-100 text-orange-700' },
  invite: { label: 'Invite', icon: User, color: 'bg-indigo-100 text-indigo-700' },
  role_change: { label: 'Role Change', icon: Shield, color: 'bg-pink-100 text-pink-700' },
};

const MOCK_AUDIT_LOG = [
  { id: 1, user: 'Sarah Connor', email: 'sarah@inherenttech.com', action: 'login' as AuditAction, resource: 'Auth', details: 'Logged in from 192.168.1.1', timestamp: '2026-03-28 14:32:00', ip: '192.168.1.1' },
  { id: 2, user: 'Sarah Connor', email: 'sarah@inherenttech.com', action: 'update' as AuditAction, resource: 'Organization: TechCorp Inc', details: 'Updated plan from Starter to Professional', timestamp: '2026-03-28 14:25:00', ip: '192.168.1.1' },
  { id: 3, user: 'Mike Reynolds', email: 'mike@inherenttech.com', action: 'create' as AuditAction, resource: 'User: irene@innovation.io', details: 'Invited new user to Innovation Labs', timestamp: '2026-03-28 13:48:00', ip: '10.0.0.42' },
  { id: 4, user: 'Alice Johnson', email: 'alice@techcorp.com', action: 'billing' as AuditAction, resource: 'Subscription', details: 'Renewed Professional plan ($149/mo)', timestamp: '2026-03-28 12:00:00', ip: '172.16.0.5' },
  { id: 5, user: 'Bob Martinez', email: 'bob@startupxyz.com', action: 'export' as AuditAction, resource: 'Candidates', details: 'Exported 245 candidate records to CSV', timestamp: '2026-03-28 11:30:00', ip: '192.168.2.10' },
  { id: 6, user: 'Sarah Connor', email: 'sarah@inherenttech.com', action: 'role_change' as AuditAction, resource: 'User: grace@consulting.com', details: 'Changed role from Member to Admin', timestamp: '2026-03-28 10:15:00', ip: '192.168.1.1' },
  { id: 7, user: 'Mike Reynolds', email: 'mike@inherenttech.com', action: 'delete' as AuditAction, resource: 'Organization: Old Corp', details: 'Deleted organization and all associated data', timestamp: '2026-03-27 16:45:00', ip: '10.0.0.42' },
  { id: 8, user: 'Frank Lee', email: 'frank@digital.com', action: 'settings' as AuditAction, resource: 'Organization Settings', details: 'Updated organization name and logo', timestamp: '2026-03-27 15:20:00', ip: '203.0.113.1' },
  { id: 9, user: 'Grace Kim', email: 'grace@consulting.com', action: 'login' as AuditAction, resource: 'Auth', details: 'Logged in from 172.16.0.8', timestamp: '2026-03-27 14:10:00', ip: '172.16.0.8' },
  { id: 10, user: 'Sarah Connor', email: 'sarah@inherenttech.com', action: 'invite' as AuditAction, resource: 'User: jack@scale.vc', details: 'Sent invitation email to Scale Ventures admin', timestamp: '2026-03-27 11:00:00', ip: '192.168.1.1' },
  { id: 11, user: 'Mike Reynolds', email: 'mike@inherenttech.com', action: 'settings' as AuditAction, resource: 'Platform Settings', details: 'Updated email notification templates', timestamp: '2026-03-27 09:30:00', ip: '10.0.0.42' },
  { id: 12, user: 'Alice Johnson', email: 'alice@techcorp.com', action: 'create' as AuditAction, resource: 'Job Order', details: 'Created new job order: Senior React Developer', timestamp: '2026-03-26 17:00:00', ip: '172.16.0.5' },
];

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = MOCK_AUDIT_LOG.filter((entry) => {
    const matchesSearch =
      entry.user.toLowerCase().includes(search.toLowerCase()) ||
      entry.email.toLowerCase().includes(search.toLowerCase()) ||
      entry.details.toLowerCase().includes(search.toLowerCase()) ||
      entry.resource.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'All' || entry.action === actionFilter;
    const matchesDateFrom = !dateFrom || entry.timestamp >= dateFrom;
    const matchesDateTo = !dateTo || entry.timestamp <= dateTo + ' 23:59:59';
    return matchesSearch && matchesAction && matchesDateFrom && matchesDateTo;
  });

  const handleExportCSV = () => {
    const headers = ['User', 'Email', 'Action', 'Resource', 'Details', 'Timestamp', 'IP Address'];
    const rows = filtered.map((e) => [
      e.user, e.email, actionConfig[e.action].label, e.resource, e.details, e.timestamp, e.ip,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-600 text-sm mt-1">
            Track all platform activity and security events.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user, email, resource, or details..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="All">All Actions</option>
              {Object.entries(actionConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="From"
                />
              </div>
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="To"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Timestamp</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Resource</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Details</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => {
                  const config = actionConfig[entry.action];
                  const ActionIcon = config.icon;
                  return (
                    <tr key={entry.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap text-xs">
                        {entry.timestamp}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{entry.user}</p>
                          <p className="text-xs text-gray-500">{entry.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                          <ActionIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 text-xs max-w-[180px] truncate">
                        {entry.resource}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs max-w-[280px] truncate">
                        {entry.details}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs font-mono">
                        {entry.ip}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      No audit log entries found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Showing {filtered.length} of {MOCK_AUDIT_LOG.length} entries
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
