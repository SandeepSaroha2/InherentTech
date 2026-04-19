'use client';

import React from 'react';
import { useTranslation } from '@inherenttech/ui';

type ReportCard = {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
};

const REPORT_CATEGORIES: ReportCard[] = [
  {
    id: 'sales',
    icon: '📊',
    title: 'Sales Performance',
    description: 'Pipeline value, conversion rates, avg deal size',
    color: '#3b82f6',
  },
  {
    id: 'leads',
    icon: '🎯',
    title: 'Lead Analytics',
    description: 'Source breakdown, stage funnel, time in stage',
    color: '#8b5cf6',
  },
  {
    id: 'activity',
    icon: '📞',
    title: 'Activity Reports',
    description: 'Call volume, email stats, meeting frequency',
    color: '#f59e0b',
  },
  {
    id: 'revenue',
    icon: '💰',
    title: 'Revenue Reports',
    description: 'MRR, ARR, growth trends',
    color: '#22c55e',
  },
  {
    id: 'team',
    icon: '👥',
    title: 'Team Performance',
    description: 'Leaderboard by deals, activities, revenue',
    color: '#ec4899',
  },
  {
    id: 'custom',
    icon: '⚙️',
    title: 'Custom Reports',
    description: 'Build your own report with custom filters',
    color: '#6b7280',
  },
];

function KPICard({ title, value, subtitle, color = '#3b82f6' }: { title: string; value: string | number; subtitle?: string; color?: string }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 20,
      border: '1px solid #e5e7eb',
      borderTop: `3px solid ${color}`,
    }}>
      <p style={{ fontSize: 13, color: '#6b7280', margin: 0, fontWeight: 500 }}>{title}</p>
      <p style={{ fontSize: 28, fontWeight: 700, margin: '8px 0 4px', color: '#111827' }}>{value}</p>
      {subtitle && <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

function ReportCategoryCard({ report }: { report: ReportCard }) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ fontSize: 32 }}>{report.icon}</div>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>{report.title}</h3>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 0' }}>{report.description}</p>
      </div>
      <button
        style={{
          marginTop: 'auto',
          padding: '8px 12px',
          backgroundColor: report.color,
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          textAlign: 'center',
        }}
      >
        View Report →
      </button>
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 24px', color: '#111827' }}>Reports & Analytics</h2>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <KPICard
          title="Total Pipeline"
          value="$450K"
          subtitle="All active deals"
          color="#3b82f6"
        />
        <KPICard
          title="Win Rate"
          value="32%"
          subtitle="Last 12 months"
          color="#22c55e"
        />
        <KPICard
          title="Avg Deal Size"
          value="$18K"
          subtitle="Current year"
          color="#f59e0b"
        />
        <KPICard
          title="Monthly Revenue"
          value="$42K"
          subtitle="This month (projected)"
          color="#8b5cf6"
        />
      </div>

      {/* Report Categories Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
      }}>
        {REPORT_CATEGORIES.map(report => (
          <ReportCategoryCard key={report.id} report={report} />
        ))}
      </div>

      {/* Additional Info */}
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        border: '1px solid #bfdbfe',
        padding: 20,
        marginTop: 32,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
      }}>
        <div style={{ fontSize: 24 }}>ℹ️</div>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 6px', color: '#1e40af' }}>Real-time Data</h4>
          <p style={{ fontSize: 13, margin: 0, color: '#1e3a8a' }}>
            All reports update in real-time as new activities and transactions are recorded. Export reports as PDF or CSV for sharing with your team.
          </p>
        </div>
      </div>
    </div>
  );
}
