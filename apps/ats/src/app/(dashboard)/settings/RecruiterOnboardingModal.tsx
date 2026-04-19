'use client';

/**
 * RecruiterOnboardingModal
 *
 * Multi-step wizard to onboard a recruiter to social platforms:
 *   0 – Profile  (avatar + professional bio)
 *   1 – LinkedIn
 *   2 – Twitter / X
 *   3 – Facebook
 *   4 – Google Business Profile
 *   5 – Done ✅
 */

import React, { useState, useRef } from 'react';
import {
  CheckCircle2, X, ChevronRight, ChevronLeft,
  Camera, Loader2, ExternalLink, Link2, Link2Off,
  UserCircle2, Sparkles,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

export type RecruiterSocial = {
  linkedin?: { accessToken?: string; connectedAt?: string };
  twitter?:  { accessToken?: string; refreshToken?: string; connectedAt?: string };
  facebook?: { pageId?: string; pageToken?: string; pageName?: string; connectedAt?: string };
  google?:   { accessToken?: string; refreshToken?: string; connectedAt?: string };
};

export type RecruiterSettings = {
  autoPostCeipal?: boolean;
  avatarUrl?: string;
  social?: RecruiterSocial;
};

interface Props {
  recruiter:    { name: string; email: string; active: boolean };
  orgId:        string;
  settings:     RecruiterSettings;
  onClose:      () => void;
  onAvatarUploaded: (email: string, url: string) => void;
  onSocialConnected?: (email: string, platform: string) => void;
}

// ── Platform config ────────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    id:          'linkedin' as const,
    label:       'LinkedIn',
    color:       '#0a66c2',
    char:        'in',
    signupUrl:   'https://www.linkedin.com/signup',
    loginUrl:    'https://www.linkedin.com/login',
    tip:         'Use your professional email. Set your headline to "IT Recruiter at InherentTech" and add a headshot so connections recognise you.',
    postType:    'Personal profile posts reach your direct network — ideal for warm referrals.',
    isConnected: (s: RecruiterSocial) => !!s.linkedin?.accessToken,
  },
  {
    id:          'twitter' as const,
    label:       'Twitter / X',
    color:       '#000000',
    char:        '𝕏',
    signupUrl:   'https://twitter.com/i/flow/signup',
    loginUrl:    'https://twitter.com/login',
    tip:         'Create with your recruiter email. Use your real name and a professional photo. Mention InherentTech in your bio to build credibility.',
    postType:    'Tweets are public and great for tech-talent hashtag visibility.',
    isConnected: (s: RecruiterSocial) => !!s.twitter?.accessToken,
  },
  {
    id:          'facebook' as const,
    label:       'Facebook',
    color:       '#1877f2',
    char:        'f',
    signupUrl:   'https://www.facebook.com/r.php',
    loginUrl:    'https://www.facebook.com/login',
    tip:         'A Facebook Page (not a personal profile) is required. Create a Page from your personal account: Business → Create Page → name it "InherentTech Recruiting".',
    postType:    'Page posts reach followers and can be boosted for targeted job ads.',
    isConnected: (s: RecruiterSocial) => !!s.facebook?.pageToken,
  },
  {
    id:          'google' as const,
    label:       'Google Business',
    color:       '#4285f4',
    char:        'G',
    signupUrl:   'https://business.google.com/create',
    loginUrl:    'https://business.google.com',
    tip:         'Requires a Google Business Profile for InherentTech. If one already exists, ask an admin to add you as a manager so you can post on it.',
    postType:    'Google Business posts show up in local search and Maps — great for local talent.',
    isConnected: (s: RecruiterSocial) => !!s.google?.accessToken,
  },
] as const;

type PlatformId = typeof PLATFORMS[number]['id'];

const STEPS = ['Profile', ...PLATFORMS.map(p => p.label), 'Done'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
        ${done   ? 'bg-emerald-500 text-white'
        : active ? 'bg-blue-600 text-white ring-4 ring-blue-100'
        :          'bg-gray-100 text-gray-400'}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : label[0]}
      </div>
      <span className={`text-[10px] font-medium hidden sm:block
        ${active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────

export default function RecruiterOnboardingModal({
  recruiter, orgId, settings, onClose, onAvatarUploaded,
}: Props) {
  const [step, setStep] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(settings.avatarUrl || '');
  const [bio, setBio] = useState('');
  const [title, setTitle] = useState('IT Recruiter');
  const fileRef = useRef<HTMLInputElement>(null);

  const social = settings.social || {};
  const totalSteps = STEPS.length;
  const isLastStep = step === totalSteps - 1;

  // ── Avatar upload ─────────────────────────────────────────────────────────────

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('email', recruiter.email);
      const res = await fetch('/api/settings/recruiter-avatar', {
        method:  'POST',
        headers: { 'x-org-id': orgId },
        body:    form,
      });
      if (!res.ok) throw new Error('Upload failed');
      const { avatarUrl: url } = await res.json();
      setAvatarUrl(url);
      onAvatarUploaded(recruiter.email, url);
    } catch (e: any) {
      alert(`Upload failed: ${e.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Social connect ────────────────────────────────────────────────────────────

  const connectPlatform = (platformId: PlatformId) => {
    const url = `/api/integrations/${platformId}/connect?orgId=${orgId}&recruiterEmail=${encodeURIComponent(recruiter.email)}`;
    window.location.href = url;
  };

  // ── Step content ──────────────────────────────────────────────────────────────

  const renderStep = () => {
    // ── Step 0: Profile ───────────────────────────────────────────────────────
    if (step === 0) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Set up {recruiter.name}'s Profile</h3>
            <p className="text-sm text-gray-500">
              Add a professional photo and bio that will be used across social platforms.
            </p>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center
                text-white font-bold text-xl shrink-0 bg-indigo-500 cursor-pointer relative group"
              onClick={() => fileRef.current?.click()}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt={recruiter.name} className="w-full h-full object-cover" />
                : <span>{initials(recruiter.name)}</span>
              }
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar
                  ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                  : <Camera className="w-6 h-6 text-white" />
                }
              </div>
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={handleAvatarChange} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium
                  transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploadingAvatar
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</>
                  : <><Camera className="w-4 h-4" />Upload Photo</>
                }
              </button>
              <p className="text-xs text-gray-400 mt-1.5">PNG, JPG, WebP · recommended 400×400px</p>
              {avatarUrl && (
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />Photo uploaded
                </p>
              )}
            </div>
          </div>

          {/* Professional title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Professional Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. IT Recruiter at InherentTech"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Used as your LinkedIn headline and Twitter bio prefix</p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              placeholder="e.g. IT Recruiter specializing in tech talent — connecting top engineers with exciting opportunities across the US."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-sans resize-none
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">{bio.length}/160 characters · fits LinkedIn summary and Twitter bio</p>
          </div>

          {/* Copy-ready block */}
          {(title || bio) && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <p className="text-xs font-semibold text-blue-700">Copy this when creating accounts:</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              {bio && <p className="text-sm text-gray-600 mt-1">{bio}</p>}
              <button
                onClick={() => navigator.clipboard.writeText(`${title}\n\n${bio}`)}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Copy to clipboard
              </button>
            </div>
          )}
        </div>
      );
    }

    // ── Done step ─────────────────────────────────────────────────────────────
    if (isLastStep) {
      const connectedCount = PLATFORMS.filter(p => p.isConnected(social)).length;
      return (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{recruiter.name} is set up!</h3>
            <p className="text-sm text-gray-500 mt-1">
              {connectedCount} of {PLATFORMS.length} social platforms connected.
            </p>
          </div>

          {/* Platform summary */}
          <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
            {PLATFORMS.map(p => {
              const connected = p.isConnected(social);
              return (
                <div key={p.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm
                    ${connected ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: p.color }}>
                    {p.char}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-xs">{p.label}</p>
                    <p className={`text-xs ${connected ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {connected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {connectedCount < PLATFORMS.length && (
            <p className="text-xs text-gray-400">
              You can connect remaining platforms anytime from the Recruiters tab.
            </p>
          )}
        </div>
      );
    }

    // ── Platform steps (1–4) ──────────────────────────────────────────────────
    const platformIdx = step - 1;
    const platform    = PLATFORMS[platformIdx];
    const connected   = platform.isConnected(social);

    return (
      <div className="space-y-5">
        {/* Platform header */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: platform.color }}
          >
            {platform.char}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{platform.label}</h3>
            <p className="text-xs text-gray-500">{platform.postType}</p>
          </div>
          {connected && (
            <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />Connected
            </span>
          )}
        </div>

        {/* Tip */}
        <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-xs font-semibold text-amber-700 mb-1">Setup tip</p>
          <p className="text-xs text-amber-800 leading-relaxed">{platform.tip}</p>
        </div>

        {/* Profile info to copy */}
        {(title || bio) && (
          <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />Your profile info (copy when signing up)
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(`${title}\n\n${bio}`)}
                className="text-xs text-blue-600 hover:underline"
              >Copy</button>
            </div>
            <p className="text-sm font-medium text-gray-800">{title}</p>
            {bio && <p className="text-xs text-gray-600 mt-0.5">{bio}</p>}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {/* Step 1: Create account */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Step 1 — Create your {platform.label} account
            </p>
            <div className="flex gap-3">
              <a
                href={platform.signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white text-center
                  flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: platform.color }}
              >
                <ExternalLink className="w-4 h-4" />
                Create {platform.label} account
              </a>
              <a
                href={platform.loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200
                  hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                Log in
              </a>
            </div>
          </div>

          {/* Step 2: Connect */}
          <div className={`border rounded-xl p-4 transition-all
            ${connected ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200'}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Step 2 — Authorize InherentTech ATS
            </p>
            {connected ? (
              <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm">
                <CheckCircle2 className="w-5 h-5" />
                {platform.label} is connected! Posts will go out on {recruiter.name}'s behalf.
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  Once your account is ready, click below to authorize the ATS to post on your behalf.
                  You'll be redirected to {platform.label} and then back here.
                </p>
                <button
                  onClick={() => connectPlatform(platform.id)}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white
                    flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: platform.color }}
                >
                  <Link2 className="w-4 h-4" />
                  Connect {platform.label}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Layout ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center
              bg-indigo-500 text-white font-bold text-sm shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt={recruiter.name} className="w-full h-full object-cover" />
                : initials(recruiter.name)
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Onboarding {recruiter.name}</p>
              <p className="text-xs text-gray-400">{recruiter.email}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400
              hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-1 justify-between">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <StepDot active={i === step} done={i < step} label={label} />
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 transition-colors ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600
              hover:text-gray-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />Back
          </button>

          <span className="text-xs text-gray-400">{step + 1} / {totalSteps}</span>

          {isLastStep ? (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold
                bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />Done
            </button>
          ) : (
            <button
              onClick={() => setStep(s => Math.min(totalSteps - 1, s + 1))}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold
                bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Next<ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
