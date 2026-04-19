'use client';

import React, { useState } from 'react';

type PipelineLead = {
  id: string;
  companyName: string;
  contactName: string;
  value: number;
  daysInStage: number;
};

const PIPELINE_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'];
const STAGE_COLORS: Record<string, string> = {
  NEW: '#3b82f6', CONTACTED: '#8b5cf6', QUALIFIED: '#f59e0b',
  PROPOSAL: '#f97316', NEGOTIATION: '#ec4899', WON: '#22c55e',
};

// Mock data
const MOCK_PIPELINE: Record<string, PipelineLead[]> = {
  NEW: [
    { id: '1', companyName: 'DataSync Corp', contactName: 'Maria Garcia', value: 120000, daysInStage: 2 },
    { id: '2', companyName: 'AI Ventures', contactName: 'Tom Lee', value: 80000, daysInStage: 5 },
  ],
  CONTACTED: [
    { id: '3', companyName: 'MedTech Labs', contactName: 'Dr. Emily Park', value: 95000, daysInStage: 3 },
  ],
  QUALIFIED: [
    { id: '4', companyName: 'TechCorp Solutions', contactName: 'Jennifer Smith', value: 250000, daysInStage: 7 },
    { id: '5', companyName: 'Acme Software', contactName: 'Steve Brown', value: 150000, daysInStage: 4 },
  ],
  PROPOSAL: [
    { id: '6', companyName: 'FinanceHub Inc', contactName: 'Robert Chen', value: 180000, daysInStage: 10 },
  ],
  NEGOTIATION: [
    { id: '7', companyName: 'CloudBase', contactName: 'James Wilson', value: 340000, daysInStage: 14 },
  ],
  WON: [
    { id: '8', companyName: 'RetailMax', contactName: 'Lisa Anderson', value: 100000, daysInStage: 0 },
  ],
};

export default function PipelinePage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#111827' }}>Pipeline</h2>
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          Total: <strong>${(Object.values(MOCK_PIPELINE).flat().reduce((s, l) => s + l.value, 0) / 1000).toFixed(0)}K</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {PIPELINE_STAGES.map(stage => {
          const leads = MOCK_PIPELINE[stage] || [];
          const stageValue = leads.reduce((s, l) => s + l.value, 0);
          return (
            <div key={stage} style={{ minWidth: 280, flex: 1 }}>
              {/* Column Header */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: '12px 12px 0 0',
                borderBottom: `3px solid ${STAGE_COLORS[stage]}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{stage}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: 10, color: '#6b7280' }}>
                    {leads.length}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>${(stageValue / 1000).toFixed(0)}K</span>
              </div>

              {/* Cards */}
              <div style={{
                backgroundColor: '#f1f5f9',
                borderRadius: '0 0 12px 12px',
                padding: 8,
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                {leads.map(lead => (
                  <div key={lead.id} style={{
                    backgroundColor: 'white',
                    borderRadius: 8,
                    padding: 14,
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>{lead.companyName}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>{lead.contactName}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>${(lead.value / 1000).toFixed(0)}K</span>
                      <span style={{
                        fontSize: 11, color: lead.daysInStage > 10 ? '#ef4444' : '#9ca3af',
                        fontWeight: lead.daysInStage > 10 ? 600 : 400,
                      }}>
                        {lead.daysInStage}d
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
