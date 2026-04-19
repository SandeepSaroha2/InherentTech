'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Send,
  Eye,
  MessageSquare,
  Filter,
  TrendingUp,
  BarChart3,
  Zap,
} from 'lucide-react';

// --- Types ---
type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  sentCount: number;
  openCount: number;
  replyCount: number;
  createdAt: string;
};

// --- Constants ---
const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

const STATUSES = ['ALL', 'DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const;

// --- Mock Data ---
const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Q2 Java Developer Outreach', channel: 'EMAIL', status: 'ACTIVE', sentCount: 450, openCount: 180, replyCount: 23, createdAt: '2026-03-20T10:00:00Z' },
  { id: '2', name: 'IT Staffing Decision Makers', channel: 'EMAIL', status: 'ACTIVE', sentCount: 320, openCount: 128, replyCount: 15, createdAt: '2026-03-18T14:00:00Z' },
  { id: '3', name: 'Cloud Migration Leads', channel: 'EMAIL', status: 'COMPLETED', sentCount: 200, openCount: 92, replyCount: 11, createdAt: '2026-03-10T09:00:00Z' },
  { id: '4', name: 'React Dev Candidate Outreach', channel: 'EMAIL', status: 'DRAFT', sentCount: 0, openCount: 0, replyCount: 0, createdAt: '2026-03-26T11:00:00Z' },
  { id: '5', name: 'DevOps Hiring Pipeline', channel: 'EMAIL', status: 'PAUSED', sentCount: 150, openCount: 55, replyCount: 8, createdAt: '2026-03-05T08:00:00Z' },
];

// --- Page ---
export default function OutreachPage() {
  const [filter, setFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return MOCK_CAMPAIGNS.filter((c) => filter === 'ALL' || c.status === filter);
  }, [filter]);

  const totalSent = MOCK_CAMPAIGNS.reduce((s, c) => s + c.sentCount, 0);
  const totalOpens = MOCK_CAMPAIGNS.reduce((s, c) => s + c.openCount, 0);
  const totalReplies = MOCK_CAMPAIGNS.reduce((s, c) => s + c.replyCount, 0);
  const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : '0';
  const replyRate = totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(1) : '0';
  const activeCampaigns = MOCK_CAMPAIGNS.filter((c) => c.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outreach</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Powered by eCafy &middot; Mass email campaigns for clients and candidates
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors self-start">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Sent', value: totalSent.toLocaleString(), icon: <Send className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
          { title: 'Open Rate', value: `${openRate}%`, icon: <Eye className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
          { title: 'Reply Rate', value: `${replyRate}%`, icon: <MessageSquare className="w-5 h-5" />, color: 'bg-violet-50 text-violet-600' },
          { title: 'Active Campaigns', value: activeCampaigns, icon: <Zap className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
        ].map((kpi) => (
          <div key={kpi.title} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                {kpi.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.title}</p>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Campaign Cards */}
      <div className="space-y-4">
        {filtered.map((campaign) => {
          const openPct = campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0;
          const replyPct = campaign.sentCount > 0 ? (campaign.replyCount / campaign.sentCount) * 100 : 0;

          return (
            <div
              key={campaign.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Campaign Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{campaign.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {campaign.channel} &middot; Created {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[campaign.status]}`}>
                  {campaign.status}
                </span>
              </div>

              {/* Metrics */}
              {campaign.sentCount > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Opens */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Opens
                      </span>
                      <span className="text-xs font-semibold text-green-600">{openPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${openPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{campaign.openCount} / {campaign.sentCount}</p>
                  </div>

                  {/* Replies */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Replies
                      </span>
                      <span className="text-xs font-semibold text-blue-600">{replyPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${replyPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{campaign.replyCount} / {campaign.sentCount}</p>
                  </div>

                  {/* Sent Count */}
                  <div className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4 text-gray-400" />
                    <span className="text-xl font-bold text-gray-900">{campaign.sentCount}</span>
                    <span className="text-xs text-gray-400">sent</span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-gray-400">
                  Campaign not yet launched
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">
            No campaigns match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
