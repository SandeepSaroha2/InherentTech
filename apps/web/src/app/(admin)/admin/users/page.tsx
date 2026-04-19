'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@inherenttech/ui';
import {
  Search,
  Plus,
  MoreHorizontal,
  User,
  ChevronLeft,
  ChevronRight,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

const MOCK_USERS = [
  { id: 1, name: 'Alice Johnson', email: 'alice@techcorp.com', org: 'TechCorp Inc', role: 'Admin', status: 'Active', lastLogin: '2026-03-28', avatar: 'AJ' },
  { id: 2, name: 'Bob Martinez', email: 'bob@startupxyz.com', org: 'StartupXYZ', role: 'Owner', status: 'Active', lastLogin: '2026-03-27', avatar: 'BM' },
  { id: 3, name: 'Carol Chen', email: 'carol@enterprise.com', org: 'Enterprise Ltd', role: 'Member', status: 'Active', lastLogin: '2026-03-26', avatar: 'CC' },
  { id: 4, name: 'David Wilson', email: 'david@creative.io', org: 'Creative Studios', role: 'Admin', status: 'Inactive', lastLogin: '2026-02-15', avatar: 'DW' },
  { id: 5, name: 'Emily Brown', email: 'emily@growth.co', org: 'Growth Agency', role: 'Member', status: 'Active', lastLogin: '2026-03-25', avatar: 'EB' },
  { id: 6, name: 'Frank Lee', email: 'frank@digital.com', org: 'Digital Solutions', role: 'Owner', status: 'Suspended', lastLogin: '2026-01-20', avatar: 'FL' },
  { id: 7, name: 'Grace Kim', email: 'grace@consulting.com', org: 'Consulting Group', role: 'Admin', status: 'Active', lastLogin: '2026-03-28', avatar: 'GK' },
  { id: 8, name: 'Henry Davis', email: 'henry@local.biz', org: 'Local Business', role: 'Owner', status: 'Active', lastLogin: '2026-03-24', avatar: 'HD' },
  { id: 9, name: 'Irene Patel', email: 'irene@innovation.io', org: 'Innovation Labs', role: 'Member', status: 'Invited', lastLogin: '--', avatar: 'IP' },
  { id: 10, name: 'Jack Thompson', email: 'jack@scale.vc', org: 'Scale Ventures', role: 'Admin', status: 'Active', lastLogin: '2026-03-27', avatar: 'JT' },
  { id: 11, name: 'Sarah Connor', email: 'sarah@inherenttech.com', org: 'InherentTech', role: 'Super Admin', status: 'Active', lastLogin: '2026-03-28', avatar: 'SC' },
  { id: 12, name: 'Mike Reynolds', email: 'mike@inherenttech.com', org: 'InherentTech', role: 'Super Admin', status: 'Active', lastLogin: '2026-03-28', avatar: 'MR' },
];

const roleConfig: Record<string, { color: string; icon: typeof Shield }> = {
  'Super Admin': { color: 'bg-red-100 text-red-700', icon: ShieldAlert },
  Owner: { color: 'bg-purple-100 text-purple-700', icon: ShieldCheck },
  Admin: { color: 'bg-blue-100 text-blue-700', icon: Shield },
  Member: { color: 'bg-gray-100 text-gray-700', icon: User },
};

const statusColors: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-gray-100 text-gray-600',
  Suspended: 'bg-red-100 text-red-700',
  Invited: 'bg-yellow-100 text-yellow-700',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = MOCK_USERS.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.org.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage users across all organizations.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
          <Plus className="h-4 w-4" />
          Invite User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: MOCK_USERS.length.toString(), color: 'text-blue-600' },
          { label: 'Active', value: MOCK_USERS.filter(u => u.status === 'Active').length.toString(), color: 'text-green-600' },
          { label: 'Admins', value: MOCK_USERS.filter(u => u.role === 'Admin' || u.role === 'Super Admin').length.toString(), color: 'text-purple-600' },
          { label: 'Pending Invites', value: MOCK_USERS.filter(u => u.status === 'Invited').length.toString(), color: 'text-yellow-600' },
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
                placeholder="Search by name, email, or organization..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="All">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Owner">Owner</option>
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="Invited">Invited</option>
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
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Organization</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Last Login</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const roleInfo = roleConfig[user.role] || roleConfig.Member;
                  const RoleIcon = roleInfo.icon;
                  return (
                    <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                            {user.avatar}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{user.org}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${roleInfo.color}`}>
                          <RoleIcon className="h-3 w-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[user.status]}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{user.lastLogin}</td>
                      <td className="py-3 px-4 text-right">
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      No users found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Showing {filtered.length} of {MOCK_USERS.length} users
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
