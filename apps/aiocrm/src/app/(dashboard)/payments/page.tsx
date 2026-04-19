'use client';

import React, { useState } from 'react';
import { useTranslation } from '@inherenttech/ui';

type Transaction = {
  id: string;
  date: string;
  description: string;
  client: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed';
};

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2026-03-27', description: 'Invoice #INV-2026-052: Monthly staffing services', client: 'TechCorp Solutions', amount: 12500, status: 'Paid' },
  { id: '2', date: '2026-03-26', description: 'Invoice #INV-2026-051: Q2 contract extension', client: 'CloudBase', amount: 8750, status: 'Pending' },
  { id: '3', date: '2026-03-25', description: 'Invoice #INV-2026-050: Senior developer placement (3 months)', client: 'FinanceHub Inc', amount: 15000, status: 'Paid' },
  { id: '4', date: '2026-03-24', description: 'Invoice #INV-2026-049: Support and maintenance services', client: 'MedTech Labs', amount: 3500, status: 'Paid' },
  { id: '5', date: '2026-03-23', description: 'Invoice #INV-2026-048: Contract developer placement', client: 'DataSync Corp', amount: 6200, status: 'Failed' },
  { id: '6', date: '2026-03-22', description: 'Invoice #INV-2026-047: Technical staffing renewal', client: 'TechCorp Solutions', amount: 9800, status: 'Paid' },
  { id: '7', date: '2026-03-20', description: 'Invoice #INV-2026-046: Two React developers (6 weeks)', client: 'CloudBase', amount: 11000, status: 'Paid' },
  { id: '8', date: '2026-03-19', description: 'Invoice #INV-2026-045: DevOps specialist contract', client: 'FinanceHub Inc', amount: 14250, status: 'Pending' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Paid: { bg: '#dcfce7', text: '#15803d' },
  Pending: { bg: '#fef3c7', text: '#b45309' },
  Failed: { bg: '#fee2e2', text: '#b91c1c' },
};

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

export default function PaymentsPage() {
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState('All');

  const totalInvoiced = MOCK_TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0);
  const totalPaid = MOCK_TRANSACTIONS.filter(t => t.status === 'Paid').reduce((sum, t) => sum + t.amount, 0);
  const outstanding = totalInvoiced - totalPaid;
  const overdue = MOCK_TRANSACTIONS.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);

  const filteredTransactions = selectedStatus === 'All'
    ? MOCK_TRANSACTIONS
    : MOCK_TRANSACTIONS.filter(t => t.status === selectedStatus);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#111827' }}>Payments & Invoicing</h2>
        <button style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          + Create Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <KPICard
          title="Total Invoiced"
          value={`$${(totalInvoiced / 1000).toFixed(0)}K`}
          subtitle="All invoices"
          color="#3b82f6"
        />
        <KPICard
          title="Total Paid"
          value={`$${(totalPaid / 1000).toFixed(0)}K`}
          subtitle="Completed payments"
          color="#22c55e"
        />
        <KPICard
          title="Outstanding"
          value={`$${(outstanding / 1000).toFixed(1)}K`}
          subtitle="Pending + failed"
          color="#f59e0b"
        />
        <KPICard
          title="Overdue"
          value={`$${(overdue / 1000).toFixed(1)}K`}
          subtitle="Action required"
          color="#ef4444"
        />
      </div>

      {/* Revenue Chart Placeholder */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #e5e7eb',
        marginBottom: 32,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: '#111827' }}>Monthly Revenue</h3>
        <div style={{
          height: 200,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          padding: '20px 0',
          color: 'white',
        }}>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, idx) => (
            <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 40,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 4,
                height: `${40 + (idx * 15)}px`,
              }} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>{month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Filter Tabs */}
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
          {['All', 'Paid', 'Pending', 'Failed'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              style={{
                padding: '6px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                backgroundColor: selectedStatus === status ? '#3b82f6' : 'white',
                color: selectedStatus === status ? 'white' : '#6b7280',
              }}
            >
              {status}
            </button>
          ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              {['Date', 'Description', 'Client', 'Amount', 'Status'].map((header, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(transaction => (
              <tr
                key={transaction.id}
                style={{ borderBottom: '1px solid #f3f4f6' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#111827', fontWeight: 500 }}>
                  {transaction.description}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                  {transaction.client}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#111827' }}>
                  ${transaction.amount.toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: STATUS_COLORS[transaction.status]?.bg || '#f3f4f6',
                    color: STATUS_COLORS[transaction.status]?.text || '#6b7280',
                  }}>
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTransactions.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
            No transactions found for the selected status.
          </div>
        )}
      </div>
    </div>
  );
}
