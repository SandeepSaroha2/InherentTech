'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  FileText,
  MessageSquare,
  Send,
  Clock,
  Star,
} from 'lucide-react';

const CANDIDATE = {
  id: '1',
  firstName: 'Alex',
  lastName: 'Johnson',
  email: 'alex.johnson@example.com',
  phone: '+1 (214) 555-0187',
  currentTitle: 'Senior Java Developer',
  visaStatus: 'US Citizen',
  skills: ['Java', 'Spring Boot', 'AWS', 'Microservices', 'Kubernetes', 'PostgreSQL', 'REST APIs', 'Docker'],
  yearsOfExperience: 8,
  expectedRate: 85,
  location: 'Dallas, TX',
  status: 'ACTIVE',
  source: 'LinkedIn',
  recruiter: 'Sarah Chen',
  summary: 'Experienced backend engineer with 8+ years in enterprise Java development. Strong expertise in Spring Boot microservices, cloud-native architectures on AWS, and distributed systems. Led migration of monolithic applications to microservices at previous employer.',
};

const SUBMISSIONS = [
  { id: '1', job: 'Senior Java Developer', client: 'TechCorp Solutions', status: 'CLIENT_REVIEW', date: '2026-03-25', billRate: 85 },
  { id: '2', job: 'Backend Engineer', client: 'CloudBase Inc', status: 'REJECTED', date: '2026-03-10', billRate: 80 },
  { id: '3', job: 'Java Architect', client: 'FinanceHub', status: 'INTERVIEW', date: '2026-02-28', billRate: 95 },
];

const INTERVIEWS = [
  { id: '1', job: 'Senior Java Developer', client: 'TechCorp', type: 'TECHNICAL', date: '2026-03-28 10:00 AM', status: 'SCHEDULED', feedback: null },
  { id: '2', job: 'Java Architect', client: 'FinanceHub', type: 'PHONE_SCREEN', date: '2026-03-05 2:00 PM', status: 'COMPLETED', feedback: 'Strong communication. Deep Java knowledge. Proceeded to technical.' },
];

const ACTIVITY_TIMELINE = [
  { id: '1', action: 'Submitted to Senior Java Developer at TechCorp', user: 'Sarah Chen', date: '2026-03-25', icon: Send },
  { id: '2', action: 'Technical interview scheduled with TechCorp', user: 'Sarah Chen', date: '2026-03-26', icon: Calendar },
  { id: '3', action: 'Resume updated', user: 'Alex Johnson', date: '2026-03-20', icon: FileText },
  { id: '4', action: 'Phone screen with FinanceHub completed', user: 'Sarah Chen', date: '2026-03-05', icon: Phone },
  { id: '5', action: 'Added to system from LinkedIn sourcing', user: 'Sarah Chen', date: '2026-02-20', icon: Star },
];

const SUB_STATUS_STYLES: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-700',
  CLIENT_REVIEW: 'bg-amber-100 text-amber-700',
  INTERVIEW: 'bg-violet-100 text-violet-700',
  OFFERED: 'bg-emerald-100 text-emerald-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const IV_STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function CandidateDetailPage() {
  const c = CANDIDATE;

  return (
    <div>
      {/* Back link */}
      <Link href="/candidates" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Candidates
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold">
              {c.firstName[0]}{c.lastName[0]}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{c.firstName} {c.lastName}</h1>
                <p className="text-base text-gray-600 mt-0.5">{c.currentTitle}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5"><Mail className="w-4 h-4" />{c.email}</span>
                  <span className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4" />{c.phone}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{c.location}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {c.status}
                </span>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Submit to Job
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Experience</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{c.yearsOfExperience} years</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Expected Rate</p>
                <p className="text-sm font-semibold text-green-600 mt-0.5">${c.expectedRate}/hr</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Visa Status</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{c.visaStatus}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Source</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{c.source}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Skills, Summary, Submissions, Interviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Summary</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{c.summary}</p>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {c.skills.map((s) => (
                <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Submission History */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Submission History</h3>
            <div className="space-y-3">
              {SUBMISSIONS.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sub.job}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sub.client} - ${sub.billRate}/hr</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${SUB_STATUS_STYLES[sub.status] || 'bg-gray-100 text-gray-600'}`}>
                      {sub.status.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{sub.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interview History */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Interview History</h3>
            <div className="space-y-3">
              {INTERVIEWS.map((iv) => (
                <div key={iv.id} className="p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{iv.job} - {iv.client}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{iv.type.replace('_', ' ')} - {iv.date}</p>
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${IV_STATUS_STYLES[iv.status] || 'bg-gray-100 text-gray-600'}`}>
                      {iv.status}
                    </span>
                  </div>
                  {iv.feedback && (
                    <div className="mt-2 p-2.5 bg-gray-50 rounded-md">
                      <p className="text-xs text-gray-600"><span className="font-semibold">Feedback:</span> {iv.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {ACTIVITY_TIMELINE.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={a.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      {i < ACTIVITY_TIMELINE.length - 1 && <div className="w-px h-full bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm text-gray-700">{a.action}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.user} - {a.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Recruiter Notes</h3>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs font-semibold text-amber-700 mb-1">Note from Sarah</p>
                <p className="text-sm text-amber-800">Strong backend candidate. Prefers remote or hybrid roles. Available to start in 2 weeks. Has counter-offer situation at current job.</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">Interview Prep</p>
                <p className="text-sm text-blue-800">Comfortable with system design. Brushing up on latest Spring Boot 3.x features. Available for interviews Mon-Thu.</p>
              </div>
            </div>
            <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <MessageSquare className="w-4 h-4" />
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
