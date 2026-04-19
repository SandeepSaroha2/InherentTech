'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit3,
  Plus,
  Check,
  Calendar,
  FileText,
  MessageSquare,
  DollarSign,
  User,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react';

// --- Mock Data ---
const LEADS_DB: Record<string, {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  stage: string;
  value: number;
  source: string;
  owner: string;
  description: string;
  createdAt: string;
}> = {
  '1': { id: '1', companyName: 'TechCorp Solutions', contactName: 'Jennifer Smith', contactEmail: 'jsmith@techcorp.com', contactPhone: '+1 (555) 123-4567', website: 'techcorp.com', address: 'San Francisco, CA', stage: 'QUALIFIED', value: 250000, source: 'LinkedIn', owner: 'Sarah', description: 'Enterprise client needing 5 senior Java developers for a 12-month cloud migration project.', createdAt: '2026-03-20T10:00:00Z' },
  '2': { id: '2', companyName: 'FinanceHub Inc', contactName: 'Robert Chen', contactEmail: 'rchen@financehub.com', contactPhone: '+1 (555) 234-5678', website: 'financehub.com', address: 'New York, NY', stage: 'PROPOSAL', value: 180000, source: 'Referral', owner: 'Admin', description: 'Mid-market fintech needs 3 React developers and 1 DevOps engineer for Q2.', createdAt: '2026-03-18T14:00:00Z' },
  '3': { id: '3', companyName: 'DataSync Corp', contactName: 'Maria Garcia', contactEmail: 'mgarcia@datasync.com', contactPhone: '+1 (555) 345-6789', website: 'datasync.com', address: 'Austin, TX', stage: 'NEW', value: 120000, source: 'Website', owner: 'Sarah', description: 'Data analytics company exploring IT staffing partnership.', createdAt: '2026-03-25T09:00:00Z' },
  '4': { id: '4', companyName: 'CloudBase', contactName: 'James Wilson', contactEmail: 'jwilson@cloudbase.com', contactPhone: '+1 (555) 456-7890', website: 'cloudbase.io', address: 'Seattle, WA', stage: 'NEGOTIATION', value: 340000, source: 'LinkedIn', owner: 'Mike', description: 'Cloud infrastructure company with ongoing need for full-stack and DevOps engineers.', createdAt: '2026-03-15T11:00:00Z' },
  '5': { id: '5', companyName: 'MedTech Labs', contactName: 'Dr. Emily Park', contactEmail: 'epark@medtech.com', contactPhone: '+1 (555) 567-8901', website: 'medtechlabs.com', address: 'Boston, MA', stage: 'CONTACTED', value: 95000, source: 'Cold Call', owner: 'Sarah', description: 'Healthcare tech startup building HIPAA-compliant platform, needs 2 backend engineers.', createdAt: '2026-03-22T16:00:00Z' },
};

const STAGE_ORDER = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'];
const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-violet-100 text-violet-700',
  QUALIFIED: 'bg-amber-100 text-amber-700',
  PROPOSAL: 'bg-orange-100 text-orange-700',
  NEGOTIATION: 'bg-pink-100 text-pink-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
};

type Activity = {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  description: string;
  user: string;
  timestamp: string;
  details?: string;
};

const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', type: 'call', description: 'Discovery call - discussed staffing needs', user: 'Sarah', timestamp: '2026-03-27T14:30:00Z', details: 'Client confirmed budget for Q2. Looking for 5 senior Java developers. Prefers hybrid work model.' },
  { id: '2', type: 'email', description: 'Sent staffing proposal with rate card', user: 'Admin', timestamp: '2026-03-26T10:00:00Z', details: 'Proposal includes 3 tiers of engagement. Follow up scheduled for Friday.' },
  { id: '3', type: 'meeting', description: 'In-person meeting at client office', user: 'Mike', timestamp: '2026-03-24T15:00:00Z', details: 'Met with CTO and VP Engineering. Positive reception. Next step: technical screening of candidates.' },
  { id: '4', type: 'note', description: 'Internal note: High priority account', user: 'Sarah', timestamp: '2026-03-22T09:00:00Z', details: 'Client has potential for $1M+ annual contract. Prioritize best candidates.' },
  { id: '5', type: 'email', description: 'Initial outreach email sent', user: 'Admin', timestamp: '2026-03-20T11:00:00Z' },
];

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  call: <Phone className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  meeting: <Calendar className="w-3.5 h-3.5" />,
  note: <FileText className="w-3.5 h-3.5" />,
};

const ACTIVITY_COLOR: Record<string, string> = {
  call: 'bg-blue-100 text-blue-600',
  email: 'bg-amber-100 text-amber-600',
  meeting: 'bg-pink-100 text-pink-600',
  note: 'bg-gray-100 text-gray-600',
};

const ACTIVITY_LABEL: Record<string, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
};

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const lead = LEADS_DB[id];
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-gray-500 mb-4">Lead not found</p>
        <button
          onClick={() => router.push('/leads')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Back to Leads
        </button>
      </div>
    );
  }

  const stageIndex = STAGE_ORDER.indexOf(lead.stage);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/leads')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </button>

      {/* Lead Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{lead.companyName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{lead.contactName} &middot; {lead.source}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STAGE_COLORS[lead.stage] || 'bg-gray-100 text-gray-600'}`}>
                  {lead.stage}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  <DollarSign className="w-4 h-4 inline -mt-0.5" />
                  {(lead.value / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setShowAddActivity(!showAddActivity)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Activity
            </button>
          </div>
        </div>

        {/* Stage Progression Bar */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pipeline Stage</p>
          <div className="flex items-center gap-1">
            {STAGE_ORDER.map((stage, idx) => {
              const isCompleted = idx <= stageIndex;
              const isCurrent = idx === stageIndex;
              return (
                <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-center">
                    <div
                      className={`flex-1 h-2 rounded-full transition-colors ${
                        isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                      } ${isCurrent ? 'ring-2 ring-blue-300 ring-offset-1' : ''}`}
                    />
                    {idx < STAGE_ORDER.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 mx-0.5 shrink-0" />}
                  </div>
                  <span className={`text-[10px] font-semibold ${isCompleted ? 'text-blue-600' : 'text-gray-400'}`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact Info + Edit Form */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="text-sm font-medium text-gray-900">{lead.contactName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a href={`mailto:${lead.contactEmail}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {lead.contactEmail}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{lead.contactPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Website</p>
                  <p className="text-sm font-medium text-gray-900">{lead.website}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium text-gray-900">{lead.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Details</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{lead.description}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500">Source</p>
                <p className="font-semibold text-gray-900 mt-0.5">{lead.source}</p>
              </div>
              <div>
                <p className="text-gray-500">Owner</p>
                <p className="font-semibold text-gray-900 mt-0.5">{lead.owner}</p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-semibold text-gray-900 mt-0.5">{new Date(lead.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Value</p>
                <p className="font-semibold text-gray-900 mt-0.5">${lead.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Activity Form */}
          {showAddActivity && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Log New Activity</h2>
                <button onClick={() => setShowAddActivity(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {['call', 'email', 'meeting', 'note'].map((type) => (
                    <button
                      key={type}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 capitalize"
                    >
                      {ACTIVITY_ICON[type]}
                      {type}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Describe the activity..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex justify-end">
                  <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    Save Activity
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Lead Form */}
          {showEditForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Edit Lead</h2>
                <button onClick={() => setShowEditForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
                  <input type="text" defaultValue={lead.companyName} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
                  <input type="text" defaultValue={lead.contactName} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" defaultValue={lead.contactEmail} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input type="tel" defaultValue={lead.contactPhone} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stage</label>
                  <select defaultValue={lead.stage} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {STAGE_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Value ($)</label>
                  <input type="number" defaultValue={lead.value} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  defaultValue={lead.description}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-gray-900">Activity Timeline</h2>
              <span className="text-xs text-gray-400">{MOCK_ACTIVITIES.length} activities</span>
            </div>
            <div className="space-y-6">
              {MOCK_ACTIVITIES.map((activity, idx) => (
                <div key={activity.id} className="flex gap-4">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${ACTIVITY_COLOR[activity.type]}`}>
                      {ACTIVITY_ICON[activity.type]}
                    </div>
                    {idx < MOCK_ACTIVITIES.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${ACTIVITY_COLOR[activity.type]}`}>
                            {ACTIVITY_LABEL[activity.type]}
                          </span>
                          <span className="text-xs text-gray-500">{activity.user}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(activity.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed bg-gray-50 rounded-lg p-3">
                        {activity.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
