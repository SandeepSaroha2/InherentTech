'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Inbox, Mail, Briefcase, User, Phone, CheckCircle, XCircle,
  ChevronRight, Loader2, RefreshCw, Send, PhoneCall, AlertCircle, Clock,
  Sparkles, FileText, ChevronDown, ChevronUp, ExternalLink,
  Settings, Zap,
} from 'lucide-react';
import { useAuth } from '@inherenttech/ui';

type ActionLog = { action: string; status: string; timestamp: string; detail?: string };

type InboxItem = {
  id: string;
  recruiterEmail: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  bodySnippet: string;
  classification: 'JOB_ORDER' | 'CANDIDATE_REPLY' | 'GENERAL';
  confidence: number;
  extractedData: Record<string, any>;
  suggestedReply: string | null;
  suggestedAction: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_DONE';
  replySent: boolean;
  replySentAt: string | null;
  resumeParsed: boolean;
  actionsLog: ActionLog[];
  createdAt: string;
  jobOrder?: { id: string; title: string; status: string; ceipalJobId?: string | null; ceipalPostedAt?: string | null } | null;
  candidate?: { id: string; firstName: string; lastName: string; email: string; phone: string | null } | null;
  call?: { id: string; status: string; externalCallId: string | null; duration: number | null } | null;
};

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-700 border border-amber-200',
  APPROVED:  'bg-green-100 text-green-700 border border-green-200',
  REJECTED:  'bg-red-100 text-red-700 border border-red-200',
  AUTO_DONE: 'bg-blue-100 text-blue-700 border border-blue-200',
};

const CLASS_BADGE: Record<string, string> = {
  JOB_ORDER:       'bg-purple-100 text-purple-700',
  CANDIDATE_REPLY: 'bg-teal-100 text-teal-700',
  GENERAL:         'bg-gray-100 text-gray-600',
};

const CLASS_ICON: Record<string, React.ReactNode> = {
  JOB_ORDER:       <Briefcase className="w-4 h-4" />,
  CANDIDATE_REPLY: <User className="w-4 h-4" />,
  GENERAL:         <Mail className="w-4 h-4" />,
};

const CLASS_LABEL: Record<string, string> = {
  JOB_ORDER:       'Job Order',
  CANDIDATE_REPLY: 'Candidate',
  GENERAL:         'General',
};

export default function RecruiterInboxPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<{ id: string; text: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Auto-post indicator (read-only — managed via Settings > Recruiters)
  const [autoPostCeipal, setAutoPostCeipal] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchItems = useCallback(async () => {
    if (!user?.orgId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      params.set('limit', '50');
      const res = await fetch(`/api/recruiter/inbox?${params}`, {
        headers: { 'x-org-id': user.orgId },
      });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.orgId, statusFilter, typeFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const triggerPoll = async () => {
    if (!user?.orgId) return;
    setPolling(true);
    try {
      const res = await fetch('/api/email-poll', {
        method: 'POST',
        headers: { 'x-org-id': user.orgId },
      });
      const data = await res.json();
      showToast(`Polled inbox: ${data.totalMessages} messages, ${data.totalJobs} jobs, ${data.totalCandidates} candidates`);
      await fetchItems();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setPolling(false);
    }
  };

  // Fetch org settings (read-only — just to show auto-post indicator in header)
  useEffect(() => {
    if (!user?.orgId) return;
    fetch('/api/settings', { headers: { 'x-org-id': user.orgId } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.settings) {
          // Check Preeti's per-recruiter setting, fall back to global
          const recruiterSettings = d.settings.recruiterSettings || {};
          const preetisetting = recruiterSettings['preeti@xgnmail.com'];
          const active = preetisetting?.autoPostCeipal !== undefined
            ? preetisetting.autoPostCeipal
            : d.settings.autoPostCeipal;
          setAutoPostCeipal(active === true);
        }
      })
      .catch(() => {});
  }, [user?.orgId]);

  const takeAction = async (itemId: string, action: string, extra?: Record<string, any>) => {
    if (!user?.orgId) return;
    setActionLoading(itemId + ':' + action);
    try {
      const res = await fetch('/api/recruiter/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': user.orgId },
        body: JSON.stringify({ itemId, action, reviewedById: user.id, overrides: extra }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Action failed');
      showToast(`Done: ${action.replace(/_/g, ' ')}`);
      await fetchItems();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = items.filter(i => i.status === 'PENDING').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Inbox className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Recruiter Inbox</h1>
            <p className="text-sm text-gray-500">Preeti's email pipeline — AI-classified & ready for action</p>
          </div>
          {pendingCount > 0 && (
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
              {pendingCount} pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-post indicator pill */}
          <a
            href="/settings"
            title="Manage recruiter automation in Settings"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:shadow-sm
              ${autoPostCeipal
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
          >
            <Zap className={`w-3.5 h-3.5 ${autoPostCeipal ? 'text-emerald-500' : 'text-gray-400'}`} />
            {autoPostCeipal ? 'Auto-post ON' : 'Auto-post OFF'}
            <Settings className="w-3 h-3 ml-0.5 opacity-60" />
          </a>
          <button
            onClick={triggerPoll}
            disabled={polling}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {polling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {polling ? 'Polling...' : 'Check Inbox'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {['', 'PENDING', 'AUTO_DONE', 'APPROVED', 'REJECTED'].map(s => (
          <button key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
              ${statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'}`}
          >
            {s || 'All'} {s === '' && total > 0 && `(${total})`}
          </button>
        ))}
        <div className="w-px bg-gray-200" />
        {['', 'JOB_ORDER', 'CANDIDATE_REPLY', 'GENERAL'].map(t => (
          <button key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
              ${typeFilter === t ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'}`}
          >
            {t ? CLASS_LABEL[t] : 'All Types'}
          </button>
        ))}
      </div>

      {/* Items */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Inbox className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Inbox is clear</p>
          <p className="text-sm mt-1">Click "Check Inbox" to poll Preeti's mailbox</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const isExpanded = expandedId === item.id;
            const data = item.extractedData;
            const isLoading = (key: string) => actionLoading === item.id + ':' + key;

            return (
              <div key={item.id}
                className={`bg-white rounded-xl border transition-shadow
                  ${item.status === 'PENDING' ? 'border-amber-200 shadow-sm' : 'border-gray-200'}
                  ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'}`}
              >
                {/* Row header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className={`p-2 rounded-lg ${CLASS_BADGE[item.classification]}`}>
                    {CLASS_ICON[item.classification]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm truncate">{item.subject}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CLASS_BADGE[item.classification]}`}>
                        {CLASS_LABEL[item.classification]}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[item.status]}`}>
                        {item.status === 'AUTO_DONE' ? '⚡ Auto-done' : item.status.toLowerCase()}
                      </span>
                      {item.resumeParsed && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                          📄 Resume parsed
                        </span>
                      )}
                      {item.call && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          📞 Call {item.call.status.toLowerCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <span>{item.fromName} &lt;{item.fromEmail}&gt;</span>
                      <span>·</span>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        {Math.round(item.confidence * 100)}% confident
                      </span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {/* AI suggestion */}
                    {item.suggestedAction && (
                      <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg">
                        <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-indigo-700 mb-0.5">AI Suggestion</p>
                          <p className="text-sm text-indigo-800">{item.suggestedAction}</p>
                        </div>
                      </div>
                    )}

                    {/* Email body — collapsible, full content stored */}
                    <EmailBodySection body={item.bodySnippet} />

                    {/* Parsed fields — extracted from the email above, not AI-generated */}
                    {Object.keys(data).length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parsed from email</p>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">all values extracted verbatim from the email above</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {item.classification === 'JOB_ORDER' && (
                            <>
                              {data.title       && <Info label="Title"    value={data.title} />}
                              {data.clientName  && <Info label="Client"   value={data.clientName} />}
                              {data.location    && <Info label="Location" value={data.location} />}
                              {data.priority    && <Info label="Priority" value={data.priority} />}
                              {data.openings && data.openings > 1 && <Info label="Openings" value={String(data.openings)} />}

                              {/* Rate — highlighted */}
                              {data.rateRange && (
                                <div className="col-span-2 flex items-center gap-2 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                                  <span className="text-green-500 text-sm">💰</span>
                                  <span className="text-xs text-green-700 font-semibold">Rate:</span>
                                  <span className="text-xs text-green-800 font-mono">{data.rateRange}</span>
                                </div>
                              )}

                              {/* Contract details row */}
                              {(data.contractType || data.duration || data.visaRequirements || typeof data.remote === 'boolean') && (
                                <div className="col-span-2 flex flex-wrap gap-1.5">
                                  {data.contractType && (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                                      {data.contractType}
                                    </span>
                                  )}
                                  {data.duration && (
                                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">
                                      ⏱ {data.duration}
                                    </span>
                                  )}
                                  {typeof data.remote === 'boolean' && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border
                                      ${data.remote ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                      {data.remote ? '🏠 Remote' : '🏢 On-site'}
                                    </span>
                                  )}
                                  {data.startDate && (
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                                      🚀 {data.startDate}
                                    </span>
                                  )}
                                  {data.visaRequirements && (
                                    <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-medium" title={data.visaRequirements}>
                                      🪪 {data.visaRequirements.length > 30 ? data.visaRequirements.slice(0, 30) + '…' : data.visaRequirements}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Interview process */}
                              {data.interviewProcess && (
                                <div className="col-span-2">
                                  <Info label="Interview" value={data.interviewProcess} />
                                </div>
                              )}

                              {/* Requirements */}
                              {data.requirements?.length > 0 && (
                                <div className="col-span-2">
                                  <p className="text-xs text-gray-500 mb-1">Requirements ({data.requirements.length}):</p>
                                  <ul className="space-y-0.5">
                                    {data.requirements.map((r: string, i: number) => (
                                      <li key={i} className="text-xs text-gray-800 flex items-start gap-1">
                                        <span className="text-green-500 mt-0.5 shrink-0">•</span>{r}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Boolean search string */}
                              {data.booleanSearchString && (
                                <div className="col-span-2 mt-1">
                                  <p className="text-xs text-gray-500 mb-1">Boolean Search String:</p>
                                  <p className="text-xs font-mono text-indigo-700 bg-indigo-50 rounded p-2 break-all select-all">
                                    {data.booleanSearchString}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                          {item.classification === 'CANDIDATE_REPLY' && (
                            <>
                              {data.candidateName && <Info label="Name" value={data.candidateName} />}
                              {data.interest && <Info label="Interest" value={data.interest} />}
                              {data.phone && <Info label="Phone" value={data.phone} />}
                              {data.expectedRate && <Info label="Rate" value={`$${data.expectedRate}/hr`} />}
                              {data.availability && <Info label="Available" value={data.availability} />}
                              {data.skills?.length > 0 && (
                                <div className="col-span-2 flex flex-wrap gap-1">
                                  {data.skills.slice(0, 10).map((s: string) => (
                                    <span key={s} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs">{s}</span>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Linked records */}
                    {(item.jobOrder || item.candidate) && (
                      <div className="flex gap-3 flex-wrap">
                        {item.jobOrder && (
                          <a href={`/jobs/${item.jobOrder.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100">
                            <Briefcase className="w-3 h-3" />
                            {item.jobOrder.title}
                            {item.jobOrder.status === 'OPEN' && (
                              <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold">OPEN</span>
                            )}
                          </a>
                        )}
                        {item.jobOrder?.ceipalJobId && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200">
                            <Zap className="w-3 h-3" /> Ceipal #{item.jobOrder.ceipalJobId}
                          </span>
                        )}
                        {item.candidate && (
                          <a href={`/candidates/${item.candidate.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-100">
                            <User className="w-3 h-3" /> {item.candidate.firstName} {item.candidate.lastName}
                          </a>
                        )}
                        {item.call && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                            <PhoneCall className="w-3 h-3" /> Call: {item.call.status}
                            {item.call.duration && ` (${Math.round(item.call.duration / 60)}m)`}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Suggested reply */}
                    {item.suggestedReply && !item.replySent && item.status !== 'REJECTED' && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-gray-500">SUGGESTED REPLY</p>
                          <button onClick={() => setEditingReply(
                            editingReply?.id === item.id ? null : { id: item.id, text: item.suggestedReply! }
                          )} className="text-xs text-indigo-600 hover:underline">
                            {editingReply?.id === item.id ? 'Cancel edit' : 'Edit'}
                          </button>
                        </div>
                        {editingReply?.id === item.id ? (
                          <textarea
                            className="w-full p-3 text-sm border border-indigo-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            rows={5}
                            value={editingReply.text}
                            onChange={e => setEditingReply({ id: item.id, text: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                            {item.suggestedReply}
                          </p>
                        )}
                      </div>
                    )}
                    {item.replySent && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Reply sent {item.replySentAt ? new Date(item.replySentAt).toLocaleString() : ''}
                      </p>
                    )}

                    {/* Actions log */}
                    {item.actionsLog?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5">ACTIONS LOG</p>
                        <div className="space-y-1">
                          {item.actionsLog.map((log, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              {log.status === 'done' ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                              ) : log.status === 'pending' ? (
                                <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                              )}
                              <span className="font-medium text-gray-700">{log.action.replace(/_/g, ' ')}</span>
                              {log.detail && <span className="text-gray-500">— {log.detail}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    {item.status === 'PENDING' && (
                      <div className="flex gap-2 flex-wrap pt-1">
                        {/* Send reply */}
                        {item.suggestedReply && !item.replySent && (
                          <ActionBtn
                            icon={<Send className="w-3.5 h-3.5" />}
                            label="Send Reply"
                            loading={isLoading('send_reply')}
                            color="indigo"
                            onClick={() => takeAction(item.id, 'send_reply',
                              editingReply?.id === item.id ? { replyText: editingReply.text } : undefined
                            )}
                          />
                        )}
                        {/* Schedule call */}
                        {item.classification === 'CANDIDATE_REPLY' && data.interest === 'INTERESTED' && !item.call && (
                          <ActionBtn
                            icon={<PhoneCall className="w-3.5 h-3.5" />}
                            label="Schedule AI Call"
                            loading={isLoading('schedule_call')}
                            color="green"
                            onClick={() => takeAction(item.id, 'schedule_call')}
                            disabled={!data.phone && !item.candidate?.phone}
                            title={!data.phone && !item.candidate?.phone ? 'No phone number available' : undefined}
                          />
                        )}
                        {/* Open Job Order → post to Ceipal from the job page */}
                        {item.classification === 'JOB_ORDER' && item.jobOrder && (
                          <a
                            href={`/jobs/${item.jobOrder.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open Job Order
                          </a>
                        )}
                        {/* Approve all */}
                        <ActionBtn
                          icon={<CheckCircle className="w-3.5 h-3.5" />}
                          label="Mark Done"
                          loading={isLoading('approve')}
                          color="gray"
                          onClick={() => takeAction(item.id, 'approve')}
                        />
                        {/* Reject */}
                        <button
                          onClick={() => takeAction(item.id, 'reject')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Height cap for the email body box (in pixels). Email is never text-truncated —
// all content is always present, users just scroll to see more.
const EMAIL_BOX_COLLAPSED_PX = 320;  // ~20 lines
const EMAIL_BOX_EXPANDED_PX  = 800;  // ~50 lines — shows most job-order emails fully

function EmailBodySection({ body }: { body: string }) {
  const [expanded, setExpanded] = React.useState(false);
  // Only show "expand" if box would actually overflow when collapsed
  const linesEstimate = body.split('\n').length;
  const needsExpand = linesEstimate > 20 || body.length > 1800;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Original Email</p>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">{body.length.toLocaleString()} chars · {body.split('\n').length} lines</span>
        </div>
        {needsExpand && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {expanded ? (
              <><ChevronUp className="w-3 h-3" /> Collapse</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> Show full email</>
            )}
          </button>
        )}
      </div>
      {/* Full body always present — only the visible height is limited */}
      <pre
        className="text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-3 whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto overflow-y-auto transition-all duration-200"
        style={{ maxHeight: expanded ? `${EMAIL_BOX_EXPANDED_PX}px` : `${EMAIL_BOX_COLLAPSED_PX}px` }}
      >
        {body}
      </pre>
      {needsExpand && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-1 w-full text-xs text-center text-blue-500 hover:text-blue-700 py-1 hover:bg-blue-50 rounded transition-colors"
        >
          ↓ Show remaining {(body.split('\n').length - 20)} lines
        </button>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 text-xs">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className="text-gray-800 font-medium truncate">{value}</span>
    </div>
  );
}

function ActionBtn({
  icon, label, loading, color, onClick, disabled, title,
}: {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  color: 'indigo' | 'green' | 'emerald' | 'purple' | 'gray';
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const colors = {
    indigo:  'bg-indigo-600 hover:bg-indigo-700 text-white',
    green:   'bg-green-600 hover:bg-green-700 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    purple:  'bg-purple-600 hover:bg-purple-700 text-white',
    gray:    'bg-gray-100 hover:bg-gray-200 text-gray-700',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      title={title}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${colors[color]}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}
