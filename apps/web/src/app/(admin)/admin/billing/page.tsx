'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@inherenttech/ui';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const REVENUE_DATA = [
  { month: 'Oct 2025', mrr: 198000, subscribers: 1650, churn: 2.1 },
  { month: 'Nov 2025', mrr: 218000, subscribers: 1730, churn: 1.8 },
  { month: 'Dec 2025', mrr: 235000, subscribers: 1810, churn: 2.3 },
  { month: 'Jan 2026', mrr: 252000, subscribers: 1860, churn: 1.9 },
  { month: 'Feb 2026', mrr: 268000, subscribers: 1900, churn: 1.5 },
  { month: 'Mar 2026', mrr: 284500, subscribers: 1923, churn: 1.4 },
];

const PLAN_BREAKDOWN = [
  { plan: 'Free', subscribers: 864, revenue: 0, pct: 30.3 },
  { plan: 'Starter', subscribers: 578, revenue: 28322, pct: 20.3 },
  { plan: 'Professional', subscribers: 384, revenue: 57216, pct: 13.5 },
  { plan: 'Enterprise', subscribers: 97, revenue: 198962, pct: 3.4 },
];

const RECENT_TRANSACTIONS = [
  { id: 1, org: 'TechCorp Inc', type: 'Renewal', amount: 149, date: '2026-03-28', status: 'Paid' },
  { id: 2, org: 'Consulting Group', type: 'Upgrade', amount: 499, date: '2026-03-27', status: 'Paid' },
  { id: 3, org: 'Growth Agency', type: 'Renewal', amount: 49, date: '2026-03-27', status: 'Paid' },
  { id: 4, org: 'Innovation Labs', type: 'New', amount: 149, date: '2026-03-26', status: 'Paid' },
  { id: 5, org: 'Digital Solutions', type: 'Refund', amount: -149, date: '2026-03-25', status: 'Refunded' },
  { id: 6, org: 'Scale Ventures', type: 'Renewal', amount: 49, date: '2026-03-24', status: 'Failed' },
  { id: 7, org: 'Enterprise Ltd', type: 'Renewal', amount: 499, date: '2026-03-23', status: 'Paid' },
  { id: 8, org: 'Creative Studios', type: 'Upgrade', amount: 149, date: '2026-03-22', status: 'Paid' },
];

const statusColors: Record<string, string> = {
  Paid: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
  Refunded: 'bg-yellow-100 text-yellow-700',
};

const typeColors: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700',
  Renewal: 'bg-gray-100 text-gray-700',
  Upgrade: 'bg-purple-100 text-purple-700',
  Refund: 'bg-red-100 text-red-700',
};

export default function AdminBillingPage() {
  const latestMonth = REVENUE_DATA[REVENUE_DATA.length - 1];
  const prevMonth = REVENUE_DATA[REVENUE_DATA.length - 2];
  const mrrGrowth = ((latestMonth.mrr - prevMonth.mrr) / prevMonth.mrr * 100).toFixed(1);
  const subsGrowth = ((latestMonth.subscribers - prevMonth.subscribers) / prevMonth.subscribers * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Billing</h1>
        <p className="text-gray-600 text-sm mt-1">
          Revenue overview, MRR trends, and subscription analytics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${latestMonth.mrr.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-medium text-green-600">+{mrrGrowth}%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Annual Run Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${(latestMonth.mrr * 12).toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-medium text-green-600">+{mrrGrowth}%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Subscribers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {latestMonth.subscribers.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-medium text-green-600">+{subsGrowth}%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Churn Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {latestMonth.churn}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowDownRight className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-medium text-green-600">Improving</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MRR Trend + Plan Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>MRR Trend</CardTitle>
            <CardDescription>6-month revenue history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {REVENUE_DATA.map((d, idx) => {
                const maxMrr = Math.max(...REVENUE_DATA.map(r => r.mrr));
                const pct = (d.mrr / maxMrr) * 100;
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 w-20 flex-shrink-0">{d.month.split(' ')[0]}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${pct}%` }}
                      >
                        <span className="text-xs font-medium text-white">
                          ${(d.mrr / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Breakdown</CardTitle>
            <CardDescription>Revenue by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PLAN_BREAKDOWN.map((plan, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{plan.plan}</span>
                    <span className="text-sm text-gray-500">
                      {plan.subscribers} orgs
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${plan.pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">
                      ${(plan.revenue / 1000).toFixed(0)}k/mo
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Total MRR</span>
                <span className="text-lg font-bold text-blue-600">
                  ${latestMonth.mrr.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest billing events</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Organization</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_TRANSACTIONS.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">{tx.org}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${typeColors[tx.type]}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{tx.date}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[tx.status]}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
