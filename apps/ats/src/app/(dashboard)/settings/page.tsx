'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@inherenttech/ui';
import {
  Loader2, Mail, Zap, CheckCircle2, AlertCircle, Clock,
  Link2, Link2Off, ExternalLink, Rss, Copy, Check, Camera, UserPlus,
} from 'lucide-react';
import RecruiterOnboardingModal from './RecruiterOnboardingModal';

// ── Types ──────────────────────────────────────────────────────────────────────

type RecruiterProfile = {
  email: string;
  name: string;
  imapUser: string;
  active: boolean;
};

type RecruiterSocial = {
  linkedin?: { accessToken?: string; connectedAt?: string };
  twitter?:  { accessToken?: string; refreshToken?: string; connectedAt?: string };
  facebook?: { pageId?: string; pageToken?: string; pageName?: string; connectedAt?: string };
  google?:   { accessToken?: string; refreshToken?: string; connectedAt?: string };
};

type RecruiterSettings = {
  autoPostCeipal?: boolean;
  avatarUrl?: string;
  social?: RecruiterSocial;
};

type OrgSettings = {
  autoPostCeipal: boolean;
  currency: string;
  timezone: string;
  defaultPayRate: number;
  defaultBillRate: number;
  recruiterSettings?: Record<string, RecruiterSettings>;
  // Org-level social OAuth tokens (stored after OAuth flow for org accounts)
  linkedinAccessToken?: string;
  linkedinOrganizationId?: string;
  linkedinConnectedAt?: string;
  twitterAccessToken?: string;
  twitterRefreshToken?: string;
  twitterConnectedAt?: string;
  facebookPageId?: string;
  facebookPageToken?: string;
  facebookPageName?: string;
  facebookConnectedAt?: string;
};

// The recruiter IMAP accounts configured in the email poller
const RECRUITER_ACCOUNTS: RecruiterProfile[] = [
  { email: 'preeti@xgnmail.com',    name: 'Preeti',    imapUser: 'preeti',    active: true  },
  { email: 'priya@xgnmail.com',     name: 'Priya',     imapUser: 'priya',     active: false },
  { email: 'parul@xgnmail.com',     name: 'Parul',     imapUser: 'parul',     active: false },
  { email: 'pritisha@xgnmail.com',  name: 'Pritisha',  imapUser: 'pritisha',  active: false },
  { email: 'pari@xgnmail.com',      name: 'Pari',      imapUser: 'pari',      active: false },
];

const JOB_BOARD_URL = 'https://jobs.inherenttech.com';

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981',
];

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({
  value, onChange, disabled,
}: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50
        ${value ? 'bg-emerald-500' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ── Social platform card ───────────────────────────────────────────────────────

interface SocialCardProps {
  platform: string;
  name: string;
  description: string;
  type: string;
  accentColor: string;
  logoChar: string;
  connected: boolean;
  connectedMeta?: string;
  connectedAt?: string;
  isDisconnecting?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function SocialPlatformCard({
  platform, name, description, type, accentColor, logoChar,
  connected, connectedMeta, connectedAt,
  isDisconnecting, onConnect, onDisconnect,
}: SocialCardProps) {
  return (
    <div className={`border rounded-xl p-5 bg-white transition-all ${connected ? 'border-emerald-200 shadow-sm' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            {logoChar}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{name}</p>
            <p className="text-xs text-gray-400">{type}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 shrink-0
          ${connected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {connected
            ? <><CheckCircle2 className="w-3 h-3" />Connected</>
            : <><Link2Off className="w-3 h-3" />Not connected</>}
        </span>
      </div>

      {/* Description / meta */}
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{description}</p>

      {connected && (connectedMeta || connectedAt) && (
        <div className="mb-3 px-3 py-2 bg-emerald-50 rounded-lg text-xs text-emerald-700 space-y-0.5">
          {connectedMeta && <p className="font-medium">{connectedMeta}</p>}
          {connectedAt && <p className="text-emerald-600 opacity-80">Connected {formatDate(connectedAt)}</p>}
        </div>
      )}

      {/* Action button */}
      {connected ? (
        <button
          onClick={onDisconnect}
          disabled={isDisconnecting}
          className="w-full py-2 rounded-lg text-xs font-semibold transition-colors
            bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 border border-transparent hover:border-red-200
            flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {isDisconnecting
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Disconnecting…</>
            : <><Link2Off className="w-3.5 h-3.5" />Disconnect</>}
        </button>
      ) : (
        <button
          onClick={onConnect}
          className="w-full py-2 rounded-lg text-xs font-semibold transition-colors
            bg-blue-600 hover:bg-blue-700 text-white
            flex items-center justify-center gap-1.5"
          style={{ backgroundColor: accentColor }}
        >
          <Link2 className="w-3.5 h-3.5" />
          Connect {name}
        </button>
      )}
    </div>
  );
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text, onCopied }: { text: string; onCopied: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      onCopied();
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors whitespace-nowrap flex items-center gap-1.5"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('recruiters');
  const [connectedPlatform, setConnectedPlatform] = useState<string | null>(null);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState<string | null>(null);
  const [connectedRecruiter, setConnectedRecruiter] = useState<string | null>(null);
  const [onboardingRecruiter, setOnboardingRecruiter] = useState<typeof RECRUITER_ACCOUNTS[number] | null>(null);

  // Settings from API
  const [settings, setSettings] = useState<OrgSettings>({
    autoPostCeipal:     false,
    currency:           'USD',
    timezone:           'America/New_York',
    defaultPayRate:     55,
    defaultBillRate:    85,
    recruiterSettings:  {},
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // General form (local only for now)
  const [formData, setFormData] = useState({
    orgName:             'InherentTech',
    timezone:            'America/New_York',
    currency:            'USD',
    billRateMarkup:      35,
    autoGenerateInvoice: true,
    defaultStatuses:     'Active, Screening, Interview, Offer, Accepted',
    workflowSteps:       'Submission, Client Review, Interview, Offer, Placement',
    publishJobs:         false,
    companyDesc:         'InherentTech is a premier IT staffing and recruiting platform...',
  });

  const [notifications, setNotifications] = useState([
    { id: '1', label: 'New Submission',         enabled: true  },
    { id: '2', label: 'Interview Scheduled',    enabled: true  },
    { id: '3', label: 'Timesheet Submitted',    enabled: true  },
    { id: '4', label: 'Invoice Paid',           enabled: true  },
    { id: '5', label: 'Placement Ending Soon',  enabled: true  },
  ]);

  // ── Parse URL params on mount ─────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
    const connected = params.get('connected');
    if (connected) setConnectedPlatform(connected);
    const recruiter = params.get('recruiter');
    if (recruiter) setConnectedRecruiter(decodeURIComponent(recruiter));
    const error = params.get('error');
    if (error) showToast(`Connection failed: ${decodeURIComponent(error)}`, 'error');
    // Clean URL
    if (tab || connected || error || recruiter) {
      window.history.replaceState({}, '', window.location.pathname + (tab ? `?tab=${tab}` : ''));
    }
  }, []);

  // ── Fetch org settings ────────────────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    if (!user?.orgId) return;
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/settings', { headers: { 'x-org-id': user.orgId } });
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      setSettings(s => ({ ...s, ...data.settings }));
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSettingsLoading(false);
    }
  }, [user?.orgId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── Patch a single setting key ────────────────────────────────────────────

  const patchSetting = async (key: string, patch: Record<string, any>) => {
    if (!user?.orgId) return;
    setSavingKey(key);
    try {
      const res = await fetch('/api/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-org-id': user.orgId },
        body:    JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setSettings(s => ({ ...s, ...data.settings }));
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSavingKey(null);
    }
  };

  // ── Per-recruiter auto-post ────────────────────────────────────────────────

  const recruiterAutoPost = (email: string): boolean => {
    const perRecruiter = settings.recruiterSettings?.[email]?.autoPostCeipal;
    if (perRecruiter !== undefined) return perRecruiter;
    return settings.autoPostCeipal;
  };

  const toggleRecruiterAutoPost = async (email: string) => {
    const current = recruiterAutoPost(email);
    const newVal  = !current;
    const newRecruiterSettings = {
      ...(settings.recruiterSettings || {}),
      [email]: { ...(settings.recruiterSettings?.[email] || {}), autoPostCeipal: newVal },
    };
    await patchSetting(`recruiter:${email}:autoPostCeipal`, { recruiterSettings: newRecruiterSettings });
    showToast(newVal
      ? `⚡ Auto-post enabled for ${email.split('@')[0]}`
      : `Auto-post disabled for ${email.split('@')[0]}`
    );
  };

  // ── Social platform connect / disconnect ──────────────────────────────────

  const handleConnect = (platform: string) => {
    if (!user?.orgId) return;
    window.location.href = `/api/integrations/${platform}/connect?orgId=${user.orgId}`;
  };

  const handleDisconnect = async (platform: string) => {
    const labelMap: Record<string, string> = { linkedin: 'LinkedIn', twitter: 'Twitter / X', facebook: 'Facebook' };
    const patchMap: Record<string, Record<string, null>> = {
      linkedin: { linkedinAccessToken: null, linkedinOrganizationId: null, linkedinConnectedAt: null },
      twitter:  { twitterAccessToken: null, twitterRefreshToken: null, twitterConnectedAt: null },
      facebook: { facebookPageId: null, facebookPageToken: null, facebookPageName: null, facebookConnectedAt: null },
    };
    if (!patchMap[platform]) return;
    setDisconnectingPlatform(platform);
    await patchSetting(`disconnect:${platform}`, patchMap[platform]);
    setDisconnectingPlatform(null);
    showToast(`${labelMap[platform]} disconnected`);
  };

  // ── Per-recruiter social connect / disconnect ─────────────────────────────

  const handleRecruiterConnect = (email: string, platform: string) => {
    if (!user?.orgId) return;
    window.location.href =
      `/api/integrations/${platform}/connect?orgId=${user.orgId}&recruiterEmail=${encodeURIComponent(email)}`;
  };

  const handleRecruiterDisconnect = async (email: string, platform: string) => {
    const newRecruiterSettings = { ...(settings.recruiterSettings || {}) };
    const rec    = { ...(newRecruiterSettings[email] || {}) };
    const social = { ...(rec.social || {}) } as RecruiterSocial;
    delete social[platform as keyof RecruiterSocial];
    rec.social = social;
    newRecruiterSettings[email] = rec;
    await patchSetting(`recruiter:${email}:social:${platform}`, { recruiterSettings: newRecruiterSettings });
    showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`);
  };

  // ── Per-recruiter avatar upload ───────────────────────────────────────────

  const uploadRecruiterAvatar = async (email: string, file: File) => {
    if (!user?.orgId) return;
    setUploadingAvatar(email);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('email', email);
      const res = await fetch('/api/settings/recruiter-avatar', {
        method:  'POST',
        headers: { 'x-org-id': user.orgId },
        body:    form,
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Upload failed');
      const { avatarUrl } = await res.json();
      const newRecruiterSettings = {
        ...(settings.recruiterSettings || {}),
        [email]: { ...(settings.recruiterSettings?.[email] || {}), avatarUrl },
      };
      setSettings(s => ({ ...s, recruiterSettings: newRecruiterSettings }));
      showToast('Profile picture updated');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setUploadingAvatar(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // ── Tab button ─────────────────────────────────────────────────────────────

  const TabButton = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
        ${activeTab === id
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
    >
      {label}
    </button>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage organization, recruiters, and integration settings</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Tab bar */}
        <div className="border-b border-gray-200 flex gap-0 overflow-x-auto px-2">
          <TabButton id="recruiters"    label="Recruiters" />
          <TabButton id="general"       label="General" />
          <TabButton id="team"          label="Team" />
          <TabButton id="job-board"     label="Job Board" />
          <TabButton id="integrations"  label="Integrations" />
          <TabButton id="notifications" label="Notifications" />
        </div>

        <div className="p-6">

          {/* ── RECRUITERS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'recruiters' && (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Recruiter Profiles</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Configure automation, social accounts, and profile for each recruiter.
                  </p>
                </div>
                {settingsLoading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin shrink-0 mt-1" />}
              </div>

              {/* Social connect success banner */}
              {connectedPlatform && connectedRecruiter && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 capitalize">
                      {connectedPlatform} connected for {connectedRecruiter.split('@')[0]}!
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Job posts from this recruiter will now appear on their personal {connectedPlatform} profile.
                    </p>
                  </div>
                  <button
                    onClick={() => { setConnectedPlatform(null); setConnectedRecruiter(null); }}
                    className="ml-auto text-emerald-400 hover:text-emerald-600 text-lg leading-none"
                  >&times;</button>
                </div>
              )}

              <div className="space-y-4">
                {RECRUITER_ACCOUNTS.map((recruiter, idx) => {
                  const autoPost = recruiterAutoPost(recruiter.email);
                  const isSaving = savingKey === `recruiter:${recruiter.email}:autoPostCeipal`;
                  const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                  return (
                    <div
                      key={recruiter.email}
                      className={`border rounded-xl p-5 transition-all
                        ${recruiter.active
                          ? 'border-gray-200 bg-white'
                          : 'border-dashed border-gray-200 bg-gray-50 opacity-70'}`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm shrink-0"
                          style={{ backgroundColor: avatarBg }}
                        >
                          {settings.recruiterSettings?.[recruiter.email]?.avatarUrl
                            ? <img
                                src={settings.recruiterSettings[recruiter.email]!.avatarUrl}
                                alt={recruiter.name}
                                className="w-full h-full object-cover"
                              />
                            : initials(recruiter.name)
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">{recruiter.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                              ${recruiter.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {recruiter.active ? '● Active' : '○ Inactive'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500">{recruiter.email}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setOnboardingRecruiter(recruiter)}
                          className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                            bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Onboard
                        </button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Automation</p>

                        <div className="flex items-center justify-between py-1">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-amber-400" />
                              <span className="text-sm font-medium text-gray-800">Auto-post job orders to Ceipal</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 ml-6">
                              {autoPost
                                ? 'New job emails are classified, JD generated, and posted to Ceipal automatically.'
                                : 'Job orders land as Draft — review in the AI Inbox and post manually.'}
                            </p>
                            {autoPost && recruiter.active && (
                              <div className="mt-1.5 ml-6 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Auto-post is active for {recruiter.name}'s inbox
                              </div>
                            )}
                            {autoPost && !recruiter.active && (
                              <div className="mt-1.5 ml-6 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Will activate once this inbox is enabled
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {isSaving && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                            <Toggle
                              value={autoPost}
                              onChange={() => toggleRecruiterAutoPost(recruiter.email)}
                              disabled={isSaving || settingsLoading}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-1 opacity-40">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-medium text-gray-800">Auto-schedule screening calls</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 ml-6">
                              Automatically initiate Retell AI calls for interested candidates.
                            </p>
                          </div>
                          <Toggle value={false} onChange={() => {}} disabled />
                        </div>
                      </div>

                      {/* Social Accounts */}
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Social Accounts</p>
                        {([
                          { id: 'linkedin', label: 'LinkedIn',      color: '#0a66c2', char: 'in',
                            connected: !!settings.recruiterSettings?.[recruiter.email]?.social?.linkedin?.accessToken,
                            meta: undefined },
                          { id: 'twitter',  label: 'Twitter / X',   color: '#000000', char: '𝕏',
                            connected: !!settings.recruiterSettings?.[recruiter.email]?.social?.twitter?.accessToken,
                            meta: undefined },
                          { id: 'facebook', label: 'Facebook',      color: '#1877f2', char: 'f',
                            connected: !!settings.recruiterSettings?.[recruiter.email]?.social?.facebook?.pageToken,
                            meta: settings.recruiterSettings?.[recruiter.email]?.social?.facebook?.pageName },
                          { id: 'google',   label: 'Google Business', color: '#4285f4', char: 'G',
                            connected: !!settings.recruiterSettings?.[recruiter.email]?.social?.google?.accessToken,
                            meta: undefined },
                        ] as const).map(sp => (
                          <div key={sp.id} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ backgroundColor: sp.color }}
                              >
                                {sp.char}
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-800">{sp.label}</span>
                                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium
                                  ${sp.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {sp.connected ? 'Connected' : 'Not connected'}
                                </span>
                                {sp.meta && (
                                  <span className="ml-1 text-xs text-gray-400">· {sp.meta}</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => sp.connected
                                ? handleRecruiterDisconnect(recruiter.email, sp.id)
                                : handleRecruiterConnect(recruiter.email, sp.id)}
                              disabled={!recruiter.active}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40
                                ${sp.connected
                                  ? 'bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 border border-transparent hover:border-red-200'
                                  : 'text-white hover:opacity-90'}`}
                              style={!sp.connected ? { backgroundColor: sp.color } : undefined}
                            >
                              {sp.connected ? 'Disconnect' : 'Connect'}
                            </button>
                          </div>
                        ))}
                        {!recruiter.active && (
                          <p className="text-xs text-gray-400 italic">Enable this inbox to connect social accounts</p>
                        )}
                      </div>

                      {/* Profile Picture */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Profile Picture</p>
                        <div className="flex items-center gap-3">
                          {/* Avatar preview */}
                          <div
                            className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: avatarBg }}
                          >
                            {settings.recruiterSettings?.[recruiter.email]?.avatarUrl
                              ? <img
                                  src={settings.recruiterSettings[recruiter.email]!.avatarUrl}
                                  alt={recruiter.name}
                                  className="w-full h-full object-cover"
                                />
                              : initials(recruiter.name)
                            }
                          </div>
                          <div>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              id={`avatar-${recruiter.email}`}
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) uploadRecruiterAvatar(recruiter.email, file);
                                e.target.value = '';
                              }}
                            />
                            <label
                              htmlFor={`avatar-${recruiter.email}`}
                              className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5
                                bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors
                                ${uploadingAvatar === recruiter.email ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                              {uploadingAvatar === recruiter.email
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Uploading…</>
                                : <><Camera className="w-3.5 h-3.5" />Upload Photo</>
                              }
                            </label>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP · max 5 MB</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">
                  <strong>Tip:</strong> Each recruiter's toggle overrides the org-wide default.
                  If a recruiter has no custom setting, they inherit the org default
                  (currently <strong>{settings.autoPostCeipal ? 'Auto-post ON' : 'Manual review'}</strong>).
                </p>
              </div>
            </div>
          )}

          {/* ── GENERAL TAB ────────────────────────────────────────────────── */}
          {activeTab === 'general' && (
            <div className="max-w-lg">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Organization Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                  <input type="text" name="orgName" value={formData.orgName} onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select name="timezone" value={formData.timezone} onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Chicago">America/Chicago (CST)</option>
                    <option value="America/Denver">America/Denver (MST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select name="currency" value={formData.currency} onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Bill Rate Markup (%)</label>
                  <input type="number" name="billRateMarkup" value={formData.billRateMarkup} onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Candidate Statuses</label>
                  <textarea name="defaultStatuses" value={formData.defaultStatuses} onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submission Workflow Steps</label>
                  <textarea name="workflowSteps" value={formData.workflowSteps} onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="autoGenerateInvoice" name="autoGenerateInvoice"
                    checked={formData.autoGenerateInvoice} onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
                  <label htmlFor="autoGenerateInvoice" className="text-sm text-gray-700 cursor-pointer">
                    Auto-generate invoices when timesheets are approved
                  </label>
                </div>
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ── TEAM TAB ───────────────────────────────────────────────────── */}
          {activeTab === 'team' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Team Members</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  + Invite Member
                </button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 border-b border-gray-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: '1', name: 'Sandeep Saroha',  email: 'sandeep@inherenttech.com', role: 'Admin',           status: 'Active'  },
                      { id: '2', name: 'Preeti',          email: 'preeti@xgnmail.com',        role: 'Recruiter',       status: 'Active'  },
                      { id: '3', name: 'Marcus Johnson',  email: 'marcus@inherenttech.com',   role: 'Account Manager', status: 'Active'  },
                      { id: '4', name: 'Emily Rodriguez', email: 'emily@inherenttech.com',    role: 'Recruiter',       status: 'Invited' },
                    ].map((member, idx, arr) => (
                      <tr key={member.id} className={idx < arr.length - 1 ? 'border-b border-gray-100' : ''}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{member.email}</td>
                        <td className="px-4 py-3">
                          <select defaultValue={member.role}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Admin</option>
                            <option>Recruiter</option>
                            <option>Account Manager</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                            ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-blue-600 cursor-pointer hover:underline">Edit / Remove</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── JOB BOARD TAB ──────────────────────────────────────────────── */}
          {activeTab === 'job-board' && (
            <div className="max-w-lg">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Job Board Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="publishJobs" name="publishJobs" checked={formData.publishJobs}
                    onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
                  <label htmlFor="publishJobs" className="text-sm text-gray-700 cursor-pointer">
                    Publish jobs to public job board
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                  <textarea name="companyDesc" value={formData.companyDesc} onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]" />
                  <p className="text-xs text-gray-400 mt-1">Shown on your public job board profile</p>
                </div>
                <h4 className="text-sm font-semibold text-gray-800 pt-2">Application Form Fields</h4>
                <div className="space-y-2.5">
                  {['First Name', 'Last Name', 'Email', 'Phone', 'Resume', 'Cover Letter', 'Skills'].map(field => (
                    <div key={field} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
                      <label className="text-sm text-gray-700">{field}</label>
                    </div>
                  ))}
                </div>
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ── INTEGRATIONS TAB ───────────────────────────────────────────── */}
          {activeTab === 'integrations' && (
            <div>

              {/* OAuth success banner */}
              {connectedPlatform && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 capitalize">{connectedPlatform} connected!</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      You can now distribute jobs to this platform from any job's details page.
                    </p>
                  </div>
                  <button onClick={() => setConnectedPlatform(null)}
                    className="ml-auto text-emerald-400 hover:text-emerald-600 text-lg leading-none">&times;</button>
                </div>
              )}

              {/* ── Social Distribution ─── */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-gray-900">Social Distribution</h3>
                  {settingsLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Connect social accounts to share job openings with one click from the jobs page.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* LinkedIn */}
                  <SocialPlatformCard
                    platform="linkedin"
                    name="LinkedIn"
                    type="Company Page Posts"
                    description="Share job openings as posts on your LinkedIn company page. Uses the Share API — no LinkedIn partner program needed."
                    accentColor="#0a66c2"
                    logoChar="in"
                    connected={!!settings.linkedinAccessToken}
                    connectedMeta={settings.linkedinOrganizationId ? `Org ID: ${settings.linkedinOrganizationId}` : undefined}
                    connectedAt={settings.linkedinConnectedAt}
                    isDisconnecting={disconnectingPlatform === 'linkedin'}
                    onConnect={() => handleConnect('linkedin')}
                    onDisconnect={() => handleDisconnect('linkedin')}
                  />

                  {/* Twitter / X */}
                  <SocialPlatformCard
                    platform="twitter"
                    name="Twitter / X"
                    type="Tweets (500/month free)"
                    description="Tweet job openings to your followers automatically. Uses Twitter API v2 free tier — 500 posts per month."
                    accentColor="#000000"
                    logoChar="𝕏"
                    connected={!!settings.twitterAccessToken}
                    connectedAt={settings.twitterConnectedAt}
                    isDisconnecting={disconnectingPlatform === 'twitter'}
                    onConnect={() => handleConnect('twitter')}
                    onDisconnect={() => handleDisconnect('twitter')}
                  />

                  {/* Facebook */}
                  <SocialPlatformCard
                    platform="facebook"
                    name="Facebook"
                    type="Business Page Posts"
                    description="Post jobs to your Facebook business page. Requires a Facebook Page with admin access."
                    accentColor="#1877f2"
                    logoChar="f"
                    connected={!!settings.facebookPageId}
                    connectedMeta={settings.facebookPageName ? `Page: ${settings.facebookPageName}` : undefined}
                    connectedAt={settings.facebookConnectedAt}
                    isDisconnecting={disconnectingPlatform === 'facebook'}
                    onConnect={() => handleConnect('facebook')}
                    onDisconnect={() => handleDisconnect('facebook')}
                  />
                </div>

                {/* Setup guide notice */}
                {(!settings.linkedinAccessToken || !settings.twitterAccessToken || !settings.facebookPageId) && (
                  <div className="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-700">
                      <strong>Setup required:</strong> To connect LinkedIn, Twitter, and Facebook you first need to create
                      developer apps and add the Client ID / Secret to <code className="bg-amber-100 px-1 rounded">.env</code>.
                      See the platform developer portals:&nbsp;
                      <a href="https://www.linkedin.com/developers/apps/new" target="_blank" rel="noopener noreferrer"
                        className="underline hover:text-amber-900">LinkedIn</a>
                      {' · '}
                      <a href="https://developer.twitter.com/en/portal/projects-and-apps" target="_blank" rel="noopener noreferrer"
                        className="underline hover:text-amber-900">Twitter</a>
                      {' · '}
                      <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer"
                        className="underline hover:text-amber-900">Facebook</a>
                    </p>
                  </div>
                )}
              </div>

              {/* ── ATS Integration ─── */}
              <div className="mb-8">
                <h3 className="text-base font-semibold text-gray-900 mb-1">ATS Integration</h3>
                <p className="text-sm text-gray-500 mb-4">External ATS connected for job posting and candidate tracking.</p>

                <div className="border border-emerald-200 rounded-xl p-5 bg-emerald-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        Ce
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900 text-sm">Ceipal</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />Connected
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">ATS · Job Board Syndication · Candidate Tracking</p>
                        <p className="text-xs text-gray-400 mt-1.5">
                          Account: <span className="text-gray-600 font-medium">sandeep@inherenttech.com</span>
                          {' · '}API key configured via environment
                        </p>
                      </div>
                    </div>
                    <a href="https://app.ceipal.com" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0 mt-1">
                      Open Ceipal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* ── Job Feed & SEO ─── */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Job Feed &amp; SEO</h3>
                <p className="text-sm text-gray-500 mb-4">Organic distribution via XML feeds and structured data markup.</p>

                <div className="space-y-4">
                  {/* XML Feed */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-white">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0">
                        <Rss className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900 text-sm">XML Job Feed</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />Active
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Indeed · ZipRecruiter · SimplyHired compatible format</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono truncate">
                        {JOB_BOARD_URL}/api/jobs/feed.xml
                      </div>
                      <CopyButton
                        text={`${JOB_BOARD_URL}/api/jobs/feed.xml`}
                        onCopied={() => showToast('Feed URL copied to clipboard')}
                      />
                      <a href={`${JOB_BOARD_URL}/api/jobs/feed.xml`} target="_blank" rel="noopener noreferrer"
                        className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                      </a>
                    </div>

                    <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                      Submit this URL to{' '}
                      <a href="https://indeed.com/publisher" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Indeed Partner</a>,{' '}
                      <a href="https://www.ziprecruiter.com/post-a-job" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">ZipRecruiter</a>, and{' '}
                      <a href="https://www.simplyhired.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">SimplyHired</a>{' '}
                      to syndicate all open jobs automatically. The feed updates in real-time.
                    </p>
                  </div>

                  {/* Google for Jobs */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-white">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">G</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900 text-sm">Google for Jobs</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />Active
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">schema.org JobPosting JSON-LD on all job pages</p>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Every job page on <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">{JOB_BOARD_URL}</code> automatically
                          includes structured data that enables Google for Jobs rich results — free organic search visibility
                          directly in Google search. No API keys or setup required.
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <a
                            href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(`${JOB_BOARD_URL}/jobs/1`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            Test with Google Rich Results Tool <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── NOTIFICATIONS TAB ──────────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="max-w-md">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {notifications.map(n => (
                  <div key={n.id} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0">
                    <label className="text-sm text-gray-700 cursor-pointer" onClick={() =>
                      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, enabled: !x.enabled } : x))}>
                      {n.label}
                    </label>
                    <Toggle
                      value={n.enabled}
                      onChange={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, enabled: !x.enabled } : x))}
                    />
                  </div>
                ))}
              </div>
              <button className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                Save Preferences
              </button>
            </div>
          )}

        </div>
      </div>
    </div>

    {/* ── Recruiter Onboarding Modal ───────────────────────────────────────── */}
    {onboardingRecruiter && user?.orgId && (
      <RecruiterOnboardingModal
        recruiter={onboardingRecruiter}
        orgId={user.orgId}
        settings={settings.recruiterSettings?.[onboardingRecruiter.email] || {}}
        onClose={() => setOnboardingRecruiter(null)}
        onAvatarUploaded={(email, url) => {
          const updated = {
            ...(settings.recruiterSettings || {}),
            [email]: { ...(settings.recruiterSettings?.[email] || {}), avatarUrl: url },
          };
          setSettings(s => ({ ...s, recruiterSettings: updated }));
        }}
      />
    )}
    </>
  );
}
