'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Users,
  Calendar,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  Search,
  Send,
  Edit3,
  ExternalLink,
  Share2,
  Globe,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '@inherenttech/ui';

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100 text-red-700',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  FILLED: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
  DRAFT: 'bg-gray-100 text-gray-600',
};

const SUB_STATUS_STYLES: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-700',
  CLIENT_REVIEW: 'bg-amber-100 text-amber-700',
  INTERVIEW: 'bg-violet-100 text-violet-700',
  OFFERED: 'bg-emerald-100 text-emerald-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-600',
};

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentTitle: string | null;
  visaStatus: string;
  expectedRate: number | null;
};

type Submission = {
  id: string;
  status: string;
  billRate: number | null;
  payRate: number | null;
  submittedAt: string;
  candidate: { id: string; firstName: string; lastName: string; email: string; currentTitle: string | null; visaStatus: string };
  submittedBy: { id: string; name: string | null } | null;
};

type RateRange = { min?: number; max?: number; type?: string; raw?: string } | null;

function formatRate(r: RateRange | string | null): string {
  if (!r) return '—';
  if (typeof r === 'string') return r;
  const { min, max } = r;
  if (min && max && min !== max) return `$${min}–$${max}/hr`;
  if (min) return `$${min}/hr`;
  return '—';
}

function jobId(n: number) {
  return `INH-${String(n).padStart(4, '0')}`;
}

type Job = {
  id: string;
  jobNumber: number;
  title: string;
  location: string | null;
  rateRange: RateRange | string | null;
  openings: number;
  filled: number;
  priority: string;
  status: string;
  description: string | null;     // raw email body — exact copy, never AI-modified
  aiDescription: string | null;   // AI-polished version generated on demand
  booleanSearchString: string | null;
  requirements: string[];
  createdAt: string;
  ceipalJobId: string | null;
  ceipalPostedAt: string | null;
  client: { id: string; companyName: string } | null;
  assignedTo: { id: string; name: string | null } | null;
  submissions: Submission[];
  // Inbox extraction metadata (from linked RecruiterInboxItem)
  inboxItems?: Array<{ extractedData: Record<string, any> }>;
};

function SubmitModal({
  jobId,
  orgId,
  userId,
  onClose,
  onSuccess,
}: {
  jobId: string;
  orgId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [billRate, setBillRate] = useState('');
  const [payRate, setPayRate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const searchCandidates = useCallback(async (q: string) => {
    if (!q.trim()) { setCandidates([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/candidates?search=${encodeURIComponent(q)}&limit=10`, {
        headers: { 'x-org-id': orgId },
      });
      const json = await res.json();
      setCandidates(json.data || []);
    } finally {
      setSearching(false);
    }
  }, [orgId]);

  useEffect(() => {
    const t = setTimeout(() => searchCandidates(search), 300);
    return () => clearTimeout(t);
  }, [search, searchCandidates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) { setError('Please select a candidate'); return; }
    if (!billRate || !payRate) { setError('Bill rate and pay rate are required'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': orgId,
          'x-user-id': userId,
        },
        body: JSON.stringify({
          jobOrderId: jobId,
          candidateId: selected.id,
          submittedById: userId,
          billRate: parseFloat(billRate),
          payRate: parseFloat(payRate),
          internalNotes: notes,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to submit');
        return;
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Submit Candidate</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Candidate search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Candidate</label>
            {selected ? (
              <div className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selected.firstName} {selected.lastName}</p>
                  <p className="text-xs text-gray-500">{selected.currentTitle} · {selected.email}</p>
                </div>
                <button type="button" onClick={() => { setSelected(null); setSearch(''); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidate by name or title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {(candidates.length > 0 || searching) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searching && (
                      <div className="p-3 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" /></div>
                    )}
                    {candidates.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelected(c); setCandidates([]); setSearch(''); if (c.expectedRate) setPayRate(String(c.expectedRate)); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <p className="text-sm font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-gray-500">{c.currentTitle || 'No title'} · {c.visaStatus}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill Rate ($/hr)</label>
              <input
                type="number"
                step="0.01"
                value={billRate}
                onChange={(e) => setBillRate(e.target.value)}
                placeholder="e.g. 85"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Rate ($/hr)</label>
              <input
                type="number"
                step="0.01"
                value={payRate}
                onChange={(e) => setPayRate(e.target.value)}
                placeholder="e.g. 55"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Margin preview */}
          {billRate && payRate && parseFloat(billRate) > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              Margin: <strong className="text-blue-600">${(parseFloat(billRate) - parseFloat(payRate)).toFixed(2)}/hr ({Math.round(((parseFloat(billRate) - parseFloat(payRate)) / parseFloat(billRate)) * 100)}%)</strong>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any relevant notes about this submission..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? 'Submitting...' : 'Submit Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type CeipalDraft = {
  title: string;
  description: string;          // raw email body sent to Ceipal
  booleanSearchString: string;
  requirements: string[];
  location: string;
  rateMin: string;
  rateMax: string;
  rateHint: string;             // raw rate string from email, e.g. "$70-$80/hr W2, $85/hr C2C"
  contractType: string;         // extracted: "Contract" | "Full-Time" | "Contract-to-Hire"
  duration: string;             // extracted: e.g. "6 months"
  visaRequirements: string;     // extracted: e.g. "W2 only, USC/GC preferred"
  openings: number;
  clientName: string;
  isRemote: boolean;
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Ceipal posting modal
  const [showCeipalModal, setShowCeipalModal] = useState(false);
  const [ceipalDraft, setCeipalDraft] = useState<CeipalDraft | null>(null);
  const [ceipalPosting, setCeipalPosting] = useState(false);
  const [ceipalError, setCeipalError] = useState('');
  const [ceipalSuccess, setCeipalSuccess] = useState<{ jobId: string; url?: string } | null>(null);

  // Social distribution modal
  const [showDistributeModal, setShowDistributeModal]     = useState(false);
  const [distributeChannels, setDistributeChannels]       = useState<string[]>(['linkedin', 'twitter', 'facebook']);
  const [distributing, setDistributing]                   = useState(false);
  const [distributeResults, setDistributeResults]         = useState<any[] | null>(null);

  // Inline boolean search string editing
  const [editingBool, setEditingBool] = useState(false);
  const [boolDraft, setBoolDraft] = useState('');
  const [savingBool, setSavingBool] = useState(false);

  // AI description panel
  const [showAiDesc, setShowAiDesc]         = useState(false);
  const [aiDescGenerating, setAiDescGenerating] = useState(false);
  const [aiDescCopied, setAiDescCopied]     = useState(false);

  // Raw email editing (for corrections)
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [savingDesc, setSavingDesc] = useState(false);

  // Inline requirements editing
  const [editingReqs, setEditingReqs] = useState(false);
  const [reqsDraft, setReqsDraft] = useState('');
  const [savingReqs, setSavingReqs] = useState(false);

  const fetchJob = useCallback(async () => {
    if (!user?.orgId || !id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        headers: { 'x-org-id': user.orgId },
      });
      if (!res.ok) throw new Error('Job not found');
      const data = await res.json();
      setJob(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.orgId, id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.orgId) { setLoading(false); return; }
    fetchJob();
  }, [authLoading, user?.orgId, fetchJob]);

  const saveDescription = async () => {
    if (!user?.orgId || !job) return;
    setSavingDesc(true);
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-org-id': user.orgId },
        body: JSON.stringify({ description: descDraft }),
      });
      setJob({ ...job, description: descDraft });
      setEditingDesc(false);
    } finally {
      setSavingDesc(false);
    }
  };

  const saveRequirements = async () => {
    if (!user?.orgId || !job) return;
    setSavingReqs(true);
    try {
      const reqs = reqsDraft.split('\n').map(r => r.trim()).filter(Boolean);
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-org-id': user.orgId },
        body: JSON.stringify({ requirements: reqs }),
      });
      setJob({ ...job, requirements: reqs });
      setEditingReqs(false);
    } finally {
      setSavingReqs(false);
    }
  };

  const saveBooleanString = async () => {
    if (!user?.orgId || !job) return;
    setSavingBool(true);
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-org-id': user.orgId },
        body: JSON.stringify({ booleanSearchString: boolDraft }),
      });
      setJob({ ...job, booleanSearchString: boolDraft });
      setEditingBool(false);
    } finally {
      setSavingBool(false);
    }
  };

  const openCeipalModal = () => {
    if (!job) return;
    const rr = job.rateRange as any;
    // Pull extracted metadata from the linked inbox item (if present)
    const ed = job.inboxItems?.[0]?.extractedData || {};
    const rateHint =
      rr?.raw ||
      (ed.rateRange ? String(ed.rateRange) : '') ||
      (rr?.min ? `$${rr.min}${rr.max && rr.max !== rr.min ? `–$${rr.max}` : ''}/hr` : '');
    const isRemote =
      ed.remote === true ||
      (ed.remote !== false && (!job.location || /remote|wfh|work from home/i.test(job.location || '')));

    setCeipalDraft({
      title:               job.title,
      description:         job.description || '',   // raw email body — never AI content
      booleanSearchString: job.booleanSearchString || '',
      requirements:        [...job.requirements],
      location:            job.location || '',
      rateMin:             rr?.min?.toString() || '',
      rateMax:             rr?.max?.toString() || '',
      rateHint,
      contractType:        ed.contractType || '',
      duration:            ed.duration    || '',
      visaRequirements:    ed.visaRequirements || '',
      openings:            job.openings || 1,
      clientName:          job.client?.companyName || '',
      isRemote,
    });
    setCeipalError('');
    setCeipalSuccess(null);
    setShowCeipalModal(true);
  };

  const submitToCeipal = async () => {
    if (!user?.orgId || !job || !ceipalDraft) return;
    setCeipalPosting(true);
    setCeipalError('');
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': user.orgId },
        body: JSON.stringify({
          title:               ceipalDraft.title,
          description:         ceipalDraft.description,
          booleanSearchString: ceipalDraft.booleanSearchString,
          requirements:        ceipalDraft.requirements,
          location:            ceipalDraft.location,
          rateMin:             ceipalDraft.rateMin ? parseFloat(ceipalDraft.rateMin) : undefined,
          rateMax:             ceipalDraft.rateMax ? parseFloat(ceipalDraft.rateMax) : undefined,
          contractType:        ceipalDraft.contractType  || undefined,
          duration:            ceipalDraft.duration      || undefined,
          visaRequirements:    ceipalDraft.visaRequirements || undefined,
          openings:            ceipalDraft.openings,
          remote:              ceipalDraft.isRemote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post to Ceipal');
      setCeipalSuccess({ jobId: data.ceipalJobId, url: data.jobUrl });
      await fetchJob();
    } catch (e: any) {
      setCeipalError(e.message);
    } finally {
      setCeipalPosting(false);
    }
  };

  const generateAiDescription = async () => {
    if (!user?.orgId || !job) return;
    setAiDescGenerating(true);
    setShowAiDesc(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/generate-description`, {
        method: 'POST',
        headers: { 'x-org-id': user.orgId },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate description');
      setJob({ ...job, aiDescription: data.aiDescription });
    } catch (e: any) {
      // fall through — error visible when panel is open
    } finally {
      setAiDescGenerating(false);
    }
  };

  const copyAiDescription = () => {
    if (!job?.aiDescription) return;
    navigator.clipboard.writeText(job.aiDescription);
    setAiDescCopied(true);
    setTimeout(() => setAiDescCopied(false), 2000);
  };

  const distributeJobToSocial = async () => {
    if (!user?.orgId || !job) return;
    setDistributing(true);
    setDistributeResults(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/distribute`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': user.orgId },
        body:    JSON.stringify({ channels: distributeChannels }),
      });
      const data = await res.json();
      setDistributeResults(data.results || []);
    } catch (e: any) {
      setDistributeResults([{ platform: 'error', success: false, error: e.message }]);
    } finally {
      setDistributing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div>
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error || 'Job not found'}
        </div>
      </div>
    );
  }

  const submissions = job.submissions || [];
  const fillPercent = job.openings > 0 ? Math.min(100, Math.round((job.filled / job.openings) * 100)) : 0;

  return (
    <div>
      {showSubmitModal && user && (
        <SubmitModal
          jobId={job.id}
          orgId={user.orgId}
          userId={user.id}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => { setShowSubmitModal(false); fetchJob(); }}
        />
      )}

      {/* Ceipal Review & Post Modal */}
      {showCeipalModal && ceipalDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Review & Post to Ceipal</h2>
                <p className="text-xs text-gray-500 mt-0.5">Review and edit job details before posting to Ceipal ATS</p>
              </div>
              <button onClick={() => setShowCeipalModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {ceipalSuccess ? (
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Posted to Ceipal!</h3>
                <p className="text-sm text-gray-500 mb-2">Ceipal Job ID: <strong className="text-gray-800">{ceipalSuccess.jobId}</strong></p>
                {ceipalSuccess.url && (
                  <a href={ceipalSuccess.url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" /> View on Ceipal
                  </a>
                )}
                <div className="mt-6">
                  <button onClick={() => setShowCeipalModal(false)}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Client info */}
                {ceipalDraft.clientName && (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <span className="font-medium">Client: </span>{ceipalDraft.clientName}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Job Title</label>
                  <input type="text" value={ceipalDraft.title}
                    onChange={e => setCeipalDraft({ ...ceipalDraft, title: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Location + Rate */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Location</label>
                    <input type="text" value={ceipalDraft.location}
                      onChange={e => setCeipalDraft({ ...ceipalDraft, location: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Rate Min ($/hr)</label>
                    <input type="number" value={ceipalDraft.rateMin}
                      onChange={e => setCeipalDraft({ ...ceipalDraft, rateMin: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Rate Max ($/hr)</label>
                    <input type="number" value={ceipalDraft.rateMax}
                      onChange={e => setCeipalDraft({ ...ceipalDraft, rateMax: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {/* Rate hint from email */}
                {ceipalDraft.rateHint && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-amber-500 text-sm shrink-0 mt-0.5">💰</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-700 mb-0.5">Rate from original email</p>
                      <p className="text-xs text-amber-800 font-mono break-all">{ceipalDraft.rateHint}</p>
                    </div>
                  </div>
                )}

                {/* Contract details row — extracted from email */}
                {(ceipalDraft.contractType || ceipalDraft.duration || ceipalDraft.visaRequirements || ceipalDraft.openings > 1 || ceipalDraft.isRemote) && (
                  <div className="flex flex-wrap gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-xs text-gray-400 font-semibold self-center">From email:</span>
                    {ceipalDraft.contractType && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">{ceipalDraft.contractType}</span>
                    )}
                    {ceipalDraft.duration && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">⏱ {ceipalDraft.duration}</span>
                    )}
                    {ceipalDraft.isRemote && (
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-medium">🏠 Remote</span>
                    )}
                    {ceipalDraft.visaRequirements && (
                      <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-medium" title={ceipalDraft.visaRequirements}>
                        🪪 {ceipalDraft.visaRequirements.length > 35 ? ceipalDraft.visaRequirements.slice(0, 35) + '…' : ceipalDraft.visaRequirements}
                      </span>
                    )}
                    {ceipalDraft.openings > 1 && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">{ceipalDraft.openings} positions</span>
                    )}
                  </div>
                )}

                {/* Full Description — exact email body */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Job Description
                    </label>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Mail className="w-3 h-3" /> Exact email copy — edit if needed
                    </span>
                  </div>
                  <textarea
                    value={ceipalDraft.description} rows={10}
                    onChange={e => setCeipalDraft({ ...ceipalDraft, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-xs leading-relaxed"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Exact email content — rate details, submission format, and requirements are preserved as-is.
                  </p>
                </div>

                {/* Boolean Search String */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Boolean Search String
                    <span className="ml-2 text-gray-400 normal-case font-normal">for candidate sourcing on LinkedIn / job boards</span>
                  </label>
                  <textarea
                    value={ceipalDraft.booleanSearchString} rows={3}
                    onChange={e => setCeipalDraft({ ...ceipalDraft, booleanSearchString: e.target.value })}
                    placeholder={`("Java" OR "Java Developer") AND ("Spring Boot" OR "Microservices") AND ("AWS" OR "Azure") NOT ("Junior")`}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
                  />
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Requirements
                    <span className="ml-2 text-gray-400 normal-case font-normal">(one per line)</span>
                  </label>
                  <textarea
                    value={ceipalDraft.requirements.join('\n')} rows={5}
                    onChange={e => setCeipalDraft({ ...ceipalDraft, requirements: e.target.value.split('\n').filter(Boolean) })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>

                {ceipalError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {ceipalError}
                  </div>
                )}

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => setShowCeipalModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={submitToCeipal} disabled={ceipalPosting}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 rounded-lg text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {ceipalPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {ceipalPosting ? 'Posting...' : 'Approve & Post to Ceipal'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Distribution Modal */}
      {showDistributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Share to Social</h2>
                <p className="text-xs text-gray-500 mt-0.5">Post this job to connected social platforms</p>
              </div>
              <button onClick={() => { setShowDistributeModal(false); setDistributeResults(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Job summary */}
              <div className="px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{job.location || 'Remote'}{job.rateRange ? ` · ${formatRate(job.rateRange)}` : ''}</p>
              </div>

              {/* Channel checkboxes */}
              {!distributeResults && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Select channels</p>
                  <div className="space-y-2">
                    {[
                      { id: 'linkedin', label: 'LinkedIn', sub: 'Company page post', color: '#0a66c2' },
                      { id: 'twitter',  label: 'Twitter / X', sub: 'Tweet to followers', color: '#000000' },
                      { id: 'facebook', label: 'Facebook', sub: 'Business page post', color: '#1877f2' },
                    ].map(ch => (
                      <label key={ch.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={distributeChannels.includes(ch.id)}
                          onChange={e => {
                            if (e.target.checked) setDistributeChannels(p => [...p, ch.id]);
                            else setDistributeChannels(p => p.filter(c => c !== ch.id));
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: ch.color }}>
                          {ch.id === 'linkedin' ? 'in' : ch.id === 'twitter' ? '𝕏' : 'f'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{ch.label}</p>
                          <p className="text-xs text-gray-400">{ch.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {distributeResults && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Results</p>
                  {distributeResults.map((r: any) => (
                    <div key={r.platform} className={`flex items-start gap-3 p-3 rounded-lg border text-sm
                      ${r.success ? 'bg-emerald-50 border-emerald-200' : r.skipped ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="mt-0.5 shrink-0">
                        {r.success
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : r.skipped
                            ? <AlertCircle className="w-4 h-4 text-amber-500" />
                            : <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium capitalize ${r.success ? 'text-emerald-800' : r.skipped ? 'text-amber-800' : 'text-red-800'}`}>
                          {r.platform === 'twitter' ? 'Twitter / X' : r.platform}
                        </p>
                        {r.success && r.url && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mt-0.5">
                            View post <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {r.skipped && (
                          <p className="text-xs text-amber-700 mt-0.5">{r.skipReason}</p>
                        )}
                        {!r.success && !r.skipped && (
                          <p className="text-xs text-red-600 mt-0.5 truncate">{r.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setShowDistributeModal(false); setDistributeResults(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {distributeResults ? 'Close' : 'Cancel'}
                </button>
                {!distributeResults && (
                  <button
                    onClick={distributeJobToSocial}
                    disabled={distributing || distributeChannels.length === 0}
                    className="flex-1 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {distributing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                    {distributing ? 'Sharing…' : `Share to ${distributeChannels.length} platform${distributeChannels.length !== 1 ? 's' : ''}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back link */}
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      {/* Job Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg shrink-0">
                {jobId(job.jobNumber)}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[job.status] || 'bg-gray-100 text-gray-600'}`}>
                {job.status.replace('_', ' ')}
              </span>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLES[job.priority] || 'bg-gray-100 text-gray-600'}`}>
                {job.priority}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {job.client && <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4" />{job.client.companyName}</span>}
              {job.location && <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{job.location}</span>}
              {job.rateRange && <span className="inline-flex items-center gap-1.5"><DollarSign className="w-4 h-4" />{formatRate(job.rateRange)}</span>}
            </div>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Submit Candidate
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Job ID</p>
            <p
              className="text-sm font-mono font-bold text-blue-700 mt-0.5 cursor-pointer hover:text-blue-900"
              title="Click to copy"
              onClick={() => navigator.clipboard.writeText(jobId(job.jobNumber))}
            >
              {jobId(job.jobNumber)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Openings</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{job.filled}/{job.openings} filled</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Submissions</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{submissions.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Posted</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{new Date(job.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Assigned To</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{job.assignedTo?.name || '—'}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Fill Progress</span>
            <span>{fillPercent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${job.filled >= job.openings ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Description & Requirements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description — Original email (read-only) + AI-polished version */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Job Description</h3>
              <div className="flex items-center gap-2">
                {!editingDesc && (
                  <button
                    onClick={() => { setEditingDesc(true); setDescDraft(job.description || ''); }}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit Raw
                  </button>
                )}
                <button
                  onClick={generateAiDescription}
                  disabled={aiDescGenerating || !job.description}
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors
                    bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiDescGenerating
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Sparkles className="w-3 h-3" />}
                  {aiDescGenerating ? 'Generating…' : job.aiDescription ? 'Regenerate AI' : 'Generate AI Description'}
                </button>
              </div>
            </div>

            {/* Original email (raw — read-only by default, editable on request) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Original Email</p>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">exact email copy — source of truth</span>
              </div>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={descDraft}
                    onChange={e => setDescDraft(e.target.value)}
                    rows={12}
                    placeholder="Raw email body..."
                    className="w-full px-3 py-2.5 border border-blue-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y leading-relaxed"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingDesc(false)}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                      Cancel
                    </button>
                    <button onClick={saveDescription} disabled={savingDesc}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1">
                      {savingDesc && <Loader2 className="w-3 h-3 animate-spin" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : job.description ? (
                <pre className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto max-h-80 overflow-y-auto">
                  {job.description}
                </pre>
              ) : (
                <p className="text-sm text-gray-400 italic">No email body — click "Edit Raw" to add a description.</p>
              )}
            </div>

            {/* AI-Polished Description panel */}
            {(job.aiDescription || showAiDesc) && (
              <div className="border border-violet-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowAiDesc(s => !s)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-violet-50 hover:bg-violet-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-semibold text-violet-800">AI-Polished Description</span>
                    {job.aiDescription && (
                      <span className="px-1.5 py-0.5 bg-violet-200 text-violet-700 rounded text-[10px] font-semibold">GENERATED</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {job.aiDescription && (
                      <button
                        onClick={e => { e.stopPropagation(); copyAiDescription(); }}
                        className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 px-2 py-1 rounded hover:bg-violet-200 transition-colors"
                      >
                        {aiDescCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {aiDescCopied ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                    {showAiDesc ? <ChevronUp className="w-4 h-4 text-violet-500" /> : <ChevronDown className="w-4 h-4 text-violet-500" />}
                  </div>
                </button>

                {showAiDesc && (
                  <div className="p-4">
                    {aiDescGenerating ? (
                      <div className="flex items-center gap-3 py-6 justify-center text-violet-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Generating professional description from email…</span>
                      </div>
                    ) : job.aiDescription ? (
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                        {job.aiDescription}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-400 italic text-center py-4">
                        Click "Generate AI Description" to create a polished version.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Requirements — inline editable */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">Requirements</h3>
              {!editingReqs && (
                <button
                  onClick={() => { setEditingReqs(true); setReqsDraft(job.requirements.join('\n')); }}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {job.requirements.length > 0 ? 'Edit' : 'Add'}
                </button>
              )}
            </div>
            {editingReqs ? (
              <div className="space-y-3">
                <textarea
                  value={reqsDraft}
                  onChange={e => setReqsDraft(e.target.value)}
                  rows={8}
                  placeholder="Enter each requirement on a new line..."
                  className="w-full px-3 py-2.5 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
                  autoFocus
                />
                <p className="text-xs text-gray-400">One requirement per line</p>
                <div className="flex gap-2">
                  <button onClick={() => setEditingReqs(false)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={saveRequirements} disabled={savingReqs}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1">
                    {savingReqs && <Loader2 className="w-3 h-3 animate-spin" />}
                    Save
                  </button>
                </div>
              </div>
            ) : job.requirements.length > 0 ? (
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">No requirements yet — click "Add" to add them.</p>
            )}
          </div>

          {/* Boolean Search String */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Boolean Search String</h3>
                <p className="text-xs text-gray-400 mt-0.5">Copy & paste into LinkedIn Recruiter, Indeed, or any job board to source candidates</p>
              </div>
              {!editingBool && (
                <button
                  onClick={() => { setEditingBool(true); setBoolDraft(job.booleanSearchString || ''); }}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {job.booleanSearchString ? 'Edit' : 'Add'}
                </button>
              )}
            </div>

            {editingBool ? (
              <div className="space-y-3">
                <textarea
                  value={boolDraft}
                  onChange={e => setBoolDraft(e.target.value)}
                  rows={4}
                  placeholder={`("Java" OR "Java Developer") AND ("Spring Boot" OR "Microservices") AND ("AWS" OR "Azure") NOT ("Junior" OR "Entry Level")`}
                  className="w-full px-3 py-2.5 border border-blue-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingBool(false)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={saveBooleanString} disabled={savingBool}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1">
                    {savingBool && <Loader2 className="w-3 h-3 animate-spin" />}
                    Save
                  </button>
                </div>
              </div>
            ) : job.booleanSearchString ? (
              <div
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700 whitespace-pre-wrap leading-relaxed cursor-pointer hover:bg-gray-100 transition-colors select-all"
                title="Click to select all"
                onClick={e => {
                  const range = document.createRange();
                  range.selectNode(e.currentTarget);
                  window.getSelection()?.removeAllRanges();
                  window.getSelection()?.addRange(range);
                }}
              >
                {job.booleanSearchString}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No boolean search string yet — click "Add" to generate one, or post to Ceipal from the Review modal.</p>
            )}
          </div>

          {/* Submissions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Submissions ({submissions.length})</h3>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Add
              </button>
            </div>
            {submissions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No submissions yet — click Submit Candidate to get started</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {['Candidate', 'Bill Rate', 'Pay Rate', 'Margin', 'Status', 'Submitted', 'By'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {submissions.map((sub) => {
                      const bill = sub.billRate ?? 0;
                      const pay = sub.payRate ?? 0;
                      return (
                        <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3">
                            <p className="text-sm font-medium text-gray-900">{sub.candidate.firstName} {sub.candidate.lastName}</p>
                            <p className="text-xs text-gray-400">{sub.candidate.currentTitle || sub.candidate.email}</p>
                          </td>
                          <td className="px-3 py-3 text-sm font-medium text-green-600">{bill ? `$${bill}/hr` : '—'}</td>
                          <td className="px-3 py-3 text-sm text-gray-700">{pay ? `$${pay}/hr` : '—'}</td>
                          <td className="px-3 py-3 text-sm font-medium text-blue-600">
                            {bill && pay ? `$${bill - pay}/hr (${Math.round(((bill - pay) / bill) * 100)}%)` : '—'}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${SUB_STATUS_STYLES[sub.status] || 'bg-gray-100 text-gray-600'}`}>
                              {sub.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                          <td className="px-3 py-3 text-sm text-gray-500">{sub.submittedBy?.name || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Submission Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Submitted', count: submissions.length, color: 'text-gray-900' },
                { label: 'In Review', count: submissions.filter((s) => ['SUBMITTED', 'CLIENT_REVIEW'].includes(s.status)).length, color: 'text-amber-600' },
                { label: 'Interviewing', count: submissions.filter((s) => s.status === 'INTERVIEW').length, color: 'text-violet-600' },
                { label: 'Accepted', count: submissions.filter((s) => s.status === 'ACCEPTED').length, color: 'text-green-600' },
                { label: 'Rejected', count: submissions.filter((s) => s.status === 'REJECTED').length, color: 'text-red-600' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{stat.label}</span>
                  <span className={`text-sm font-semibold ${stat.color}`}>{stat.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Submit Candidate
              </button>
              <button
                onClick={openCeipalModal}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-emerald-600 rounded-lg text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                {job.ceipalJobId ? 'Re-post to Ceipal' : 'Approve & Post to Ceipal'}
              </button>
              <button
                onClick={() => { setShowDistributeModal(true); setDistributeResults(null); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 border border-blue-200 bg-blue-50 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share to Social
              </button>
              <a
                href={`https://jobs.inherenttech.com/jobs/${job.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Globe className="w-4 h-4" />
                View on Job Board
              </a>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Calendar className="w-4 h-4" />
                Schedule Interview
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Users className="w-4 h-4" />
                Find Matching Candidates
              </button>
            </div>
          </div>

          {/* Ceipal status card */}
          {job.ceipalJobId && (
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
              <h3 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Posted to Ceipal
              </h3>
              <p className="text-xs text-emerald-700">
                Job ID: <strong>{job.ceipalJobId}</strong>
              </p>
              {job.ceipalPostedAt && (
                <p className="text-xs text-emerald-600 mt-0.5">
                  {new Date(job.ceipalPostedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
