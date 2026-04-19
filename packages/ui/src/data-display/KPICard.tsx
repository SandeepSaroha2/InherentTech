import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export function KPICard({ title, value, change, trend, icon }: KPICardProps) {
  const trendColors = { up: 'text-green-600', down: 'text-red-600', neutral: 'text-gray-500' };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {change && <p className={`mt-1 text-sm ${trendColors[trend || 'neutral']}`}>{change}</p>}
    </div>
  );
}
