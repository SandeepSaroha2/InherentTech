'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@inherenttech/ui';

type DashboardData = {
  kpis: { totalLeads: number; pipelineValue: number; newLeadsThisMonth: number; wonThisMonth: number };
  pipeline: Array<{ stage: string; count: number; value: number }>;
  recentActivities: Array<{ id: string; type: string; subject: string; createdAt: string; user: { name: string }; lead?: { companyName: string } }>;
};

const STAGE_COLORS: Record<string, string> = {
  NEW: '#3b82f6', CONTACTED: '#8b5cf6', QUALIFIED: '#f59e0b',
  PROPOSAL: '#f97316', NEGOTIATION: '#ec4899', WON: '#22c55e', LOST: '#ef4444',
};

const STAGE_ORDER = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

function KPICard({ title, value, subtitle, color = '#3b82f6' }: { title: string; value: string | number; subtitle?: string; color?: string }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 24,
      border: '1px solid #e5e7eb',
      borderTop: `3px solid ${color}`,
    }}>
      <p style={{ fontSize: 13, color: '#6b7280', margin: 0, fontWeight: 500 }}>{title}</p>
      <p style={{ fontSize: 28, fontWeight: 700, margin: '8px 0 4px', color: '#111827' }}>{value}</p>
      {subtitle && <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data for now — replace with API call when DB is connected
    setData({
      kpis: { totalLeads: 47, pipelineValue: 1250000, newLeadsThisMonth: 12, wonThisMonth: 3 },
      pipeline: [
        { stage: 'NEW', count: 15, value: 375000 },
        { stage: 'CONTACTED', count: 10, value: 250000 },
        { stage: 'QUALIFIED', count: 8, value: 200000 },
        { stage: 'PROPOSAL', count: 6, value: 180000 },
        { stage: 'NEGOTIATION', count: 4, value: 120000 },
        { stage: 'WON', count: 3, value: 100000 },
        { stage: 'LOST', count: 1, value: 25000 },
      ],
      recentActivities: [
        { id: '1', type: 'CALL', subject: 'Discovery call with TechCorp', createdAt: new Date().toISOString(), user: { name: 'Sarah' }, lead: { companyName: 'TechCorp Solutions' } },
        { id: '2', type: 'EMAIL', subject: 'Sent proposal to FinanceHub', createdAt: new Date(Date.now() - 3600000).toISOString(), user: { name: 'Admin' }, lead: { companyName: 'FinanceHub Inc' } },
        { id: '3', type: 'MEETING', subject: 'Rate negotiation', createdAt: new Date(Date.now() - 7200000).toISOString(), user: { name: 'Mike' }, lead: { companyName: 'DataSync Corp' } },
        { id: '4', type: 'NOTE', subject: 'Client wants 5 React devs by Q3', createdAt: new Date(Date.now() - 14400000).toISOString(), user: { name: 'Sarah' }, lead: { companyName: 'CloudBase' } },
      ],
    });
    setLoading(false);
  }, []);

  if (loading || !data) return <div style={{ padding: 24 }}>{t('common.loadingDashboard')}</div>;

  const maxCount = Math.max(...data.pipeline.map(p => p.count));

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 24px', color: '#111827' }}>{t('dashboard.title')}</h2>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <KPICard title={t('dashboard.totalLeads')} value={data.kpis.totalLeads} subtitle={t('dashboard.activeInPipeline')} />
        <KPICard title={t('dashboard.pipelineValue')} value={`$${(data.kpis.pipelineValue / 1000).toFixed(0)}K`} subtitle={t('dashboard.estimatedRevenue')} color="#22c55e" />
        <KPICard title={t('dashboard.newThisMonth')} value={data.kpis.newLeadsThisMonth} subtitle={t('dashboard.leadsAdded')} color="#f59e0b" />
        <KPICard title={t('dashboard.wonThisMonth')} value={data.kpis.wonThisMonth} subtitle={t('dashboard.dealsClosed')} color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Pipeline Chart */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: '#111827' }}>{t('dashboard.salesPipeline')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STAGE_ORDER.map(stage => {
              const item = data.pipeline.find(p => p.stage === stage);
              if (!item) return null;
              return (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 100, fontSize: 12, fontWeight: 500, color: '#6b7280' }}>{stage}</div>
                  <div style={{ flex: 1, height: 24, backgroundColor: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(item.count / maxCount) * 100}%`,
                      height: '100%',
                      backgroundColor: STAGE_COLORS[stage] || '#94a3b8',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 8,
                      transition: 'width 0.5s ease',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'white' }}>{item.count}</span>
                    </div>
                  </div>
                  <div style={{ width: 70, fontSize: 12, color: '#6b7280', textAlign: 'right' }}>
                    ${(item.value / 1000).toFixed(0)}K
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: '#111827' }}>{t('dashboard.recentActivity')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {data.recentActivities.map(activity => (
              <div key={activity.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: activity.type === 'CALL' ? '#dbeafe' : activity.type === 'EMAIL' ? '#fef3c7' : activity.type === 'MEETING' ? '#fce7f3' : '#e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>
                  {activity.type === 'CALL' ? '📞' : activity.type === 'EMAIL' ? '📧' : activity.type === 'MEETING' ? '🤝' : '📝'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, margin: 0, fontWeight: 500, color: '#111827' }}>{activity.subject}</p>
                  <p style={{ fontSize: 12, margin: '2px 0 0', color: '#9ca3af' }}>
                    {activity.user.name} {activity.lead ? `· ${activity.lead.companyName}` : ''}
                  </p>
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                  {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
