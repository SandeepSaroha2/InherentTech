'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  FileText,
  Lock,
  Briefcase,
  DollarSign,
  UserCheck,
  Handshake,
  Building,
  Clock,
  Layers,
} from 'lucide-react';

// --- Types ---
type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  fieldCount: number;
  lastUpdated: string;
  icon: React.ElementType;
};

// --- Constants ---
const CATEGORIES = ['ALL', 'EMPLOYMENT', 'LEGAL', 'FINANCIAL', 'ONBOARDING'] as const;

const CATEGORY_BADGE: Record<string, string> = {
  EMPLOYMENT: 'bg-blue-100 text-blue-700',
  LEGAL: 'bg-violet-100 text-violet-700',
  FINANCIAL: 'bg-emerald-100 text-emerald-700',
  ONBOARDING: 'bg-amber-100 text-amber-700',
};

// --- Mock Data ---
const MOCK_TEMPLATES: Template[] = [
  { id: '1', name: 'Employment Agreement', description: 'Standard employment contract with benefits and terms of engagement.', category: 'EMPLOYMENT', fieldCount: 12, lastUpdated: '2026-03-25', icon: Briefcase },
  { id: '2', name: 'Non-Disclosure Agreement', description: 'Protect confidential information and trade secrets with standard NDA.', category: 'LEGAL', fieldCount: 8, lastUpdated: '2026-03-24', icon: Lock },
  { id: '3', name: 'Statement of Work', description: 'Define project scope, timeline, deliverables, and acceptance criteria.', category: 'LEGAL', fieldCount: 10, lastUpdated: '2026-03-23', icon: FileText },
  { id: '4', name: 'Offer Letter', description: 'Formal job offer letter with compensation, start date, and benefits.', category: 'EMPLOYMENT', fieldCount: 7, lastUpdated: '2026-03-22', icon: Briefcase },
  { id: '5', name: 'W-4 Form', description: 'Employee withholding certificate for federal tax purposes.', category: 'FINANCIAL', fieldCount: 15, lastUpdated: '2026-03-21', icon: DollarSign },
  { id: '6', name: 'I-9 Verification', description: 'Employment eligibility verification form for all new hires.', category: 'ONBOARDING', fieldCount: 11, lastUpdated: '2026-03-20', icon: UserCheck },
  { id: '7', name: 'Direct Deposit Form', description: 'Authorize automated payroll deposits to employee bank accounts.', category: 'FINANCIAL', fieldCount: 6, lastUpdated: '2026-03-19', icon: Building },
  { id: '8', name: 'Contractor Agreement', description: 'Independent contractor engagement terms, scope, and payment schedule.', category: 'LEGAL', fieldCount: 13, lastUpdated: '2026-03-18', icon: Handshake },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return MOCK_TEMPLATES.filter((t) => {
      const matchesCat = selectedCategory === 'ALL' || t.category === selectedCategory;
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} templates available</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Search + Category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-3.5 py-2 rounded-lg text-xs font-medium transition-colors
                ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.id}
              onClick={() => router.push(`/templates/${template.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md hover:border-gray-300 cursor-pointer transition-all group"
            >
              <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{template.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{template.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${CATEGORY_BADGE[template.category] || 'bg-gray-100 text-gray-600'}`}>
                  {template.category}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">
                  <Layers className="w-3 h-3" />
                  {template.fieldCount} fields
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Clock className="w-3 h-3" />
                Updated {template.lastUpdated}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/documents/new?template=${template.id}`);
                }}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors mt-1"
              >
                Use Template
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No templates match your search criteria.</p>
        </div>
      )}
    </div>
  );
}
