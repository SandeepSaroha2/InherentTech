'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  FileText,
  Plus,
  Save,
  X,
  CheckCircle2,
  Type,
  Calendar,
  Mail,
  Hash,
  ToggleLeft,
  AlignLeft,
  Layers,
  Clock,
  Tag,
} from 'lucide-react';

// --- Types ---
type Field = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  placeholder: string;
};

// --- Mock Data ---
const MOCK_TEMPLATE = {
  id: '1',
  name: 'Employment Agreement',
  description: 'Standard employment contract covering position, compensation, benefits, confidentiality, and termination terms. Used for all full-time W-2 employee hires.',
  category: 'EMPLOYMENT',
  version: '2.3',
  createdAt: '2026-01-15',
  updatedAt: '2026-03-25',
  createdBy: 'Sarah Davis',
  usageCount: 34,
  fields: [
    { id: 'f1', name: 'Employee Full Name', type: 'text', required: true, placeholder: 'John Smith' },
    { id: 'f2', name: 'Employee Email', type: 'email', required: true, placeholder: 'john@example.com' },
    { id: 'f3', name: 'Position Title', type: 'text', required: true, placeholder: 'Senior Developer' },
    { id: 'f4', name: 'Department', type: 'text', required: true, placeholder: 'Engineering' },
    { id: 'f5', name: 'Start Date', type: 'date', required: true, placeholder: '2026-04-01' },
    { id: 'f6', name: 'Compensation Rate', type: 'number', required: true, placeholder: '85.00' },
    { id: 'f7', name: 'Pay Frequency', type: 'select', required: true, placeholder: 'Bi-Weekly' },
    { id: 'f8', name: 'Employment Term', type: 'text', required: false, placeholder: '6 months' },
    { id: 'f9', name: 'Benefits Eligible', type: 'boolean', required: false, placeholder: 'Yes/No' },
    { id: 'f10', name: 'Remote Work', type: 'boolean', required: false, placeholder: 'Yes/No' },
    { id: 'f11', name: 'Non-Compete Clause', type: 'boolean', required: false, placeholder: 'Yes/No' },
    { id: 'f12', name: 'Additional Notes', type: 'textarea', required: false, placeholder: 'Any special terms...' },
  ] as Field[],
  content: `<h1>Employment Agreement</h1>
<p>This Employment Agreement ("Agreement") is entered into as of <strong>{{Start Date}}</strong>, by and between:</p>
<p><strong>InherentTech Solutions LLC</strong> ("Company"), and <strong>{{Employee Full Name}}</strong> ("Employee").</p>
<h2>1. Position & Duties</h2>
<p>Employee shall serve as <strong>{{Position Title}}</strong> in the <strong>{{Department}}</strong> department.</p>
<h2>2. Compensation</h2>
<p>Employee shall be compensated at a rate of <strong>$\{{Compensation Rate}} per hour</strong>, paid <strong>{{Pay Frequency}}</strong>.</p>
<h2>3. Term</h2>
<p>This Agreement shall commence on <strong>{{Start Date}}</strong> and continue for <strong>{{Employment Term}}</strong>.</p>
<h2>4. Benefits</h2>
<p>Benefits eligibility: <strong>{{Benefits Eligible}}</strong>.</p>
<h2>5. Confidentiality</h2>
<p>Employee agrees to maintain the confidentiality of all proprietary information.</p>`,
};

const FIELD_ICON: Record<string, React.ElementType> = {
  text: Type,
  email: Mail,
  date: Calendar,
  number: Hash,
  boolean: ToggleLeft,
  textarea: AlignLeft,
  select: Layers,
};

const CATEGORY_BADGE: Record<string, string> = {
  EMPLOYMENT: 'bg-blue-100 text-blue-700',
  LEGAL: 'bg-violet-100 text-violet-700',
  FINANCIAL: 'bg-emerald-100 text-emerald-700',
  ONBOARDING: 'bg-amber-100 text-amber-700',
};

export default function TemplateDetailPage() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(MOCK_TEMPLATE.name);
  const [description, setDescription] = useState(MOCK_TEMPLATE.description);
  const [activeTab, setActiveTab] = useState<'fields' | 'preview'>('fields');

  const template = MOCK_TEMPLATE;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push('/templates')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 w-full resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                <p className="text-sm text-gray-500 mt-1 max-w-2xl">{description}</p>
              </>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-medium ${CATEGORY_BADGE[template.category]}`}>
                {template.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Tag className="w-3 h-3" /> v{template.version}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" /> Updated {template.updatedAt}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <FileText className="w-3 h-3" /> Used {template.usageCount} times
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Template
                </button>
                <button
                  onClick={() => router.push(`/documents/new?template=${template.id}`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Document
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {(['fields', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-5 py-3 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab === 'fields' ? `Fields (${template.fields.length})` : 'Content Preview'}
            </button>
          ))}
        </div>
      </div>

      {/* Fields Tab */}
      {activeTab === 'fields' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Field Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Placeholder</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {template.fields.map((field) => {
                  const FieldIcon = FIELD_ICON[field.type] || Type;
                  return (
                    <tr key={field.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <FieldIcon className="w-4 h-4 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{field.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium capitalize">
                          {field.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400 hidden sm:table-cell">{field.placeholder}</td>
                      <td className="px-5 py-3 text-center">
                        {field.required ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-xs text-gray-300">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 lg:p-12">
          <div
            className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-blue-700"
            dangerouslySetInnerHTML={{ __html: template.content }}
          />
        </div>
      )}

      {/* Template Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created By</p>
          <p className="text-sm font-semibold text-gray-900">{template.createdBy}</p>
          <p className="text-xs text-gray-400 mt-0.5">{template.createdAt}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Updated</p>
          <p className="text-sm font-semibold text-gray-900">{template.updatedAt}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Documents Created</p>
          <p className="text-sm font-semibold text-gray-900">{template.usageCount} documents</p>
        </div>
      </div>
    </div>
  );
}
