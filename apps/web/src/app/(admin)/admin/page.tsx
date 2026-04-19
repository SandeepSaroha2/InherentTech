'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@inherenttech/ui';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, CreditCard, TrendingUp, DollarSign } from 'lucide-react';

const PLAN_DATA = [
  { name: 'Free', value: 45, color: '#3b82f6' },
  { name: 'Starter', value: 30, color: '#8b5cf6' },
  { name: 'Professional', value: 20, color: '#ec4899' },
  { name: 'Enterprise', value: 5, color: '#f59e0b' },
];

const REVENUE_DATA = [
  { month: 'Jan', mrr: 12000 },
  { month: 'Feb', mrr: 15000 },
  { month: 'Mar', mrr: 18000 },
  { month: 'Apr', mrr: 21000 },
  { month: 'May', mrr: 25000 },
  { month: 'Jun', mrr: 28000 },
];

const RECENT_SIGNUPS = [
  { id: 1, company: 'TechCorp Inc', email: 'admin@techcorp.com', plan: 'Professional', date: '2026-03-27' },
  { id: 2, company: 'StartupXYZ', email: 'hello@startupxyz.com', plan: 'Starter', date: '2026-03-26' },
  { id: 3, company: 'Enterprise Ltd', email: 'sales@enterprise.com', plan: 'Enterprise', date: '2026-03-25' },
  { id: 4, company: 'Creative Studios', email: 'team@creative.io', plan: 'Professional', date: '2026-03-24' },
  { id: 5, company: 'Growth Agency', email: 'info@growth.co', plan: 'Starter', date: '2026-03-23' },
  { id: 6, company: 'Digital Solutions', email: 'contact@digital.com', plan: 'Professional', date: '2026-03-22' },
  { id: 7, company: 'Consulting Group', email: 'hello@consulting.com', plan: 'Enterprise', date: '2026-03-21' },
  { id: 8, company: 'Local Business', email: 'team@local.biz', plan: 'Free', date: '2026-03-20' },
  { id: 9, company: 'Innovation Labs', email: 'admin@innovation.io', plan: 'Professional', date: '2026-03-19' },
  { id: 10, company: 'Scale Ventures', email: 'contact@scale.vc', plan: 'Starter', date: '2026-03-18' },
];

const KPI_CARDS = [
  {
    title: 'Total Organizations',
    value: '2,847',
    change: '+12.5%',
    icon: Users,
    bg: 'bg-blue-50',
    color: 'text-blue-600',
  },
  {
    title: 'Active Subscriptions',
    value: '1,923',
    change: '+8.2%',
    icon: CreditCard,
    bg: 'bg-green-50',
    color: 'text-green-600',
  },
  {
    title: 'Monthly Recurring Revenue',
    value: '$284,500',
    change: '+15.3%',
    icon: DollarSign,
    bg: 'bg-purple-50',
    color: 'text-purple-600',
  },
  {
    title: 'Total Users',
    value: '8,392',
    change: '+22.1%',
    icon: TrendingUp,
    bg: 'bg-orange-50',
    color: 'text-orange-600',
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">SaaS platform analytics and management</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b">
          {['overview', 'organizations', 'plans', 'audit'].map((tab: string) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm capitalize border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {KPI_CARDS.map((card: typeof KPI_CARDS[0], idx: number) => {
                const Icon = card.icon;
                return (
                  <Card key={idx}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                      <p className="text-xs text-green-600 mt-1">{card.change} from last month</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* MRR Trend */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Monthly Recurring Revenue (MRR)</CardTitle>
                  <CardDescription>6-month revenue trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={REVENUE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={value => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="mrr"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        name="MRR"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Plan Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Plan Distribution</CardTitle>
                  <CardDescription>Active subscriptions by plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={PLAN_DATA} cx="50%" cy="50%" labelLine={false} label={{ fontSize: 12 }} dataKey="value">
                        {PLAN_DATA.map((entry: typeof PLAN_DATA[0], idx: number) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={value => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Signups */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Signups</CardTitle>
                <CardDescription>Last 10 organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Company</th>
                        <th className="text-left py-3 px-4 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 font-semibold">Plan</th>
                        <th className="text-left py-3 px-4 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RECENT_SIGNUPS.map((signup: typeof RECENT_SIGNUPS[0]) => (
                        <tr key={signup.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{signup.company}</td>
                          <td className="py-3 px-4 text-gray-600">{signup.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              signup.plan === 'Enterprise' ? 'bg-yellow-100 text-yellow-800' :
                              signup.plan === 'Professional' ? 'bg-purple-100 text-purple-800' :
                              signup.plan === 'Starter' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {signup.plan}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{signup.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Usage Metrics Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Metrics Overview</CardTitle>
                <CardDescription>Platform utilization statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'API Calls (Daily)', value: '2.3M' },
                    { label: 'Active Sessions', value: '12.4K' },
                    { label: 'Data Processed (GB)', value: '847' },
                    { label: 'Avg Response Time', value: '142ms' },
                  ].map((metric, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">{metric.label}</p>
                      <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'organizations' && (
          <Card>
            <CardHeader>
              <CardTitle>Organizations Management</CardTitle>
              <CardDescription>View and manage all organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Organizations management interface coming soon...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'plans' && (
          <Card>
            <CardHeader>
              <CardTitle>Plans & Billing</CardTitle>
              <CardDescription>Manage subscription plans and billing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Plans and billing interface coming soon...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'audit' && (
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>View system activity and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Audit log viewer interface coming soon...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
