'use client';

import React, { useState, useMemo } from 'react';
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Plus,
  Filter,
  Clock,
} from 'lucide-react';

// --- Types ---
type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK';

type Activity = {
  id: string;
  type: ActivityType;
  description: string;
  lead?: string;
  user: string;
  timestamp: string;
  duration?: number;
};

// --- Constants ---
const ACTIVITY_TYPES: ('ALL' | ActivityType)[] = ['ALL', 'CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK'];

const ACTIVITY_ICON: Record<ActivityType, React.ReactNode> = {
  CALL: <Phone className="w-4 h-4" />,
  EMAIL: <Mail className="w-4 h-4" />,
  MEETING: <Calendar className="w-4 h-4" />,
  NOTE: <FileText className="w-4 h-4" />,
  TASK: <CheckSquare className="w-4 h-4" />,
};

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  CALL: 'bg-blue-100 text-blue-600',
  EMAIL: 'bg-amber-100 text-amber-600',
  MEETING: 'bg-pink-100 text-pink-600',
  NOTE: 'bg-gray-100 text-gray-600',
  TASK: 'bg-green-100 text-green-600',
};

const ACTIVITY_BADGE: Record<ActivityType, string> = {
  CALL: 'bg-blue-50 text-blue-700 border-blue-200',
  EMAIL: 'bg-amber-50 text-amber-700 border-amber-200',
  MEETING: 'bg-pink-50 text-pink-700 border-pink-200',
  NOTE: 'bg-gray-50 text-gray-700 border-gray-200',
  TASK: 'bg-green-50 text-green-700 border-green-200',
};

// --- Mock Data ---
const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', type: 'CALL', description: 'Discovery call with TechCorp — discussed staffing needs for Q2', lead: 'TechCorp Solutions', user: 'Sarah', timestamp: new Date().toISOString(), duration: 45 },
  { id: '2', type: 'EMAIL', description: 'Sent staffing proposal with 3 senior Java developers', lead: 'FinanceHub Inc', user: 'Admin', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', type: 'MEETING', description: 'Rate negotiation and contract terms discussion', lead: 'DataSync Corp', user: 'Mike', timestamp: new Date(Date.now() - 7200000).toISOString(), duration: 60 },
  { id: '4', type: 'TASK', description: 'Follow up with CloudBase on Q3 developer needs', lead: 'CloudBase', user: 'Sarah', timestamp: new Date(Date.now() - 14400000).toISOString() },
  { id: '5', type: 'NOTE', description: 'Client wants 2 React developers and 1 DevOps engineer by April 15', lead: 'MedTech Labs', user: 'Mike', timestamp: new Date(Date.now() - 28800000).toISOString() },
  { id: '6', type: 'EMAIL', description: 'Invoice #INV-2026-045 sent for Q1 staffing services', lead: 'TechCorp Solutions', user: 'Admin', timestamp: new Date(Date.now() - 43200000).toISOString() },
  { id: '7', type: 'CALL', description: 'Status update call on contractor performance reviews', lead: 'CloudBase', user: 'Sarah', timestamp: new Date(Date.now() - 57600000).toISOString(), duration: 30 },
  { id: '8', type: 'MEETING', description: 'Quarterly business review and renewal discussion', lead: 'FinanceHub Inc', user: 'Admin', timestamp: new Date(Date.now() - 86400000).toISOString(), duration: 90 },
  { id: '9', type: 'TASK', description: 'Prepare candidate shortlist for Acme Industries', lead: 'Acme Industries', user: 'Mike', timestamp: new Date(Date.now() - 100800000).toISOString() },
  { id: '10', type: 'NOTE', description: 'Internal: Review pricing tiers for enterprise clients', user: 'Admin', timestamp: new Date(Date.now() - 115200000).toISOString() },
];

// --- Page ---
export default function ActivitiesPage() {
  const [selectedType, setSelectedType] = useState<'ALL' | ActivityType>('ALL');

  const filteredActivities = useMemo(() => {
    return MOCK_ACTIVITIES.filter(
      (a) => selectedType === 'ALL' || a.type === selectedType
    );
  }, [selectedType]);

  const callsToday = MOCK_ACTIVITIES.filter((a) => {
    return a.type === 'CALL' && new Date(a.timestamp).toDateString() === new Date().toDateString();
  }).length;

  const meetingsThisWeek = MOCK_ACTIVITIES.filter((a) => {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return a.type === 'MEETING' && new Date(a.timestamp) > weekAgo;
  }).length;

  const tasksDue = MOCK_ACTIVITIES.filter((a) => a.type === 'TASK').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track all interactions and tasks</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors self-start">
          <Plus className="w-4 h-4" />
          Log Activity
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Activities', value: MOCK_ACTIVITIES.length, subtitle: 'This month', color: 'border-t-blue-500' },
          { title: 'Calls Today', value: callsToday, subtitle: 'Logged', color: 'border-t-green-500' },
          { title: 'Meetings This Week', value: meetingsThisWeek, subtitle: 'Scheduled', color: 'border-t-pink-500' },
          { title: 'Open Tasks', value: tasksDue, subtitle: 'Pending', color: 'border-t-amber-500' },
        ].map((kpi) => (
          <div
            key={kpi.title}
            className={`bg-white rounded-xl border border-gray-200 border-t-3 p-5 ${kpi.color}`}
            style={{ borderTopWidth: 3 }}
          >
            <p className="text-xs font-medium text-gray-500">{kpi.title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{kpi.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        {ACTIVITY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedType === type
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-1">
          {filteredActivities.map((activity, idx) => (
            <div key={activity.id} className="flex gap-4">
              {/* Timeline icon and connector */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ACTIVITY_COLOR[activity.type]}`}>
                  {ACTIVITY_ICON[activity.type]}
                </div>
                {idx < filteredActivities.length - 1 && (
                  <div className="w-px flex-1 min-h-[24px] bg-gray-200 my-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${ACTIVITY_BADGE[activity.type]}`}>
                        {ACTIVITY_ICON[activity.type]}
                        {activity.type}
                      </span>
                      <span className="text-xs text-gray-500">{activity.user}</span>
                      {activity.lead && (
                        <>
                          <span className="text-gray-300">&middot;</span>
                          <span className="text-xs text-gray-500">{activity.lead}</span>
                        </>
                      )}
                      {activity.duration && (
                        <>
                          <span className="text-gray-300">&middot;</span>
                          <span className="text-xs text-gray-500">{activity.duration} min</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(activity.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">
            No activities found for the selected type.
          </div>
        )}
      </div>
    </div>
  );
}
