'use client';

import React, { useState } from 'react';
import { Plus, Download, Send, Eye, RotateCcw, Edit3 } from 'lucide-react';

type Invoice = {
  id: string;
  invoiceNumber: string;
  client: string;
  period: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';
};

const MOCK_INVOICES: Invoice[] = [
  { id: 'INV001', invoiceNumber: 'INV-2026-00001', client: 'TechCorp Solutions', period: 'Mar 1-31, 2026', amount: 18500, dueDate: '2026-04-15', paidDate: '2026-04-10', status: 'PAID' },
  { id: 'INV002', invoiceNumber: 'INV-2026-00002', client: 'CloudBase Inc', period: 'Mar 1-31, 2026', amount: 12400, dueDate: '2026-04-15', paidDate: null, status: 'SENT' },
  { id: 'INV003', invoiceNumber: 'INV-2026-00003', client: 'SecureNet Systems', period: 'Feb 1-28, 2026', amount: 22100, dueDate: '2026-03-15', paidDate: null, status: 'OVERDUE' },
  { id: 'INV004', invoiceNumber: 'INV-2026-00004', client: 'DataFlow Analytics', period: 'Mar 1-15, 2026', amount: 8500, dueDate: '2026-04-15', paidDate: null, status: 'DRAFT' },
  { id: 'INV005', invoiceNumber: 'INV-2026-00005', client: 'TechCorp Solutions', period: 'Feb 16-28, 2026', amount: 25000, dueDate: '2026-03-01', paidDate: null, status: 'VOID' },
  { id: 'INV006', invoiceNumber: 'INV-2026-00006', client: 'CloudBase Inc', period: 'Feb 1-28, 2026', amount: 15800, dueDate: '2026-03-15', paidDate: '2026-03-14', status: 'PAID' },
];

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  VOID: 'bg-amber-100 text-amber-700',
};

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = MOCK_INVOICES.filter((inv) => statusFilter === 'ALL' || inv.status === statusFilter);

  const stats = {
    totalInvoiced: MOCK_INVOICES.reduce((sum, inv) => (inv.status !== 'VOID' ? sum + inv.amount : sum), 0),
    totalPaid: MOCK_INVOICES.filter((inv) => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0),
    outstanding: MOCK_INVOICES.filter((inv) => ['SENT', 'DRAFT'].includes(inv.status)).reduce((sum, inv) => sum + inv.amount, 0),
    overdue: MOCK_INVOICES.filter((inv) => inv.status === 'OVERDUE').reduce((sum, inv) => sum + inv.amount, 0),
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-sm text-gray-500 mt-1">Manage client billing and payments</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Generate Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Invoiced', value: stats.totalInvoiced, color: 'text-blue-600' },
          { label: 'Total Paid', value: stats.totalPaid, color: 'text-green-600' },
          { label: 'Outstanding', value: stats.outstanding, color: 'text-amber-600' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>
              ${(kpi.value / 1000).toFixed(1)}k
            </p>
          </div>
        ))}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Invoice #', 'Client', 'Period', 'Amount', 'Due Date', 'Paid Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{inv.client}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{inv.period}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">${inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {inv.paidDate
                      ? new Date(inv.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : <span className="text-gray-300">&mdash;</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {inv.status === 'SENT' && (
                        <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-xs font-semibold hover:bg-green-100 transition-colors">
                          Mark Paid
                        </button>
                      )}
                      {inv.status === 'DRAFT' && (
                        <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors">
                          <Send className="w-3 h-3" />
                          Send
                        </button>
                      )}
                      {inv.status === 'OVERDUE' && (
                        <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-xs font-semibold hover:bg-red-100 transition-colors">
                          <RotateCcw className="w-3 h-3" />
                          Resend
                        </button>
                      )}
                      {!['PAID', 'VOID'].includes(inv.status) && (
                        <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-700 rounded-md text-xs font-semibold hover:bg-gray-100 transition-colors">
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                      {['PAID', 'VOID'].includes(inv.status) && (
                        <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors">
                          <Download className="w-3 h-3" />
                          PDF
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
