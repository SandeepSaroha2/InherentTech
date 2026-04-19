import React from 'react';

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  placed: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-700',
};

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status.toLowerCase()] || 'bg-gray-100 text-gray-700';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>{status}</span>;
}
