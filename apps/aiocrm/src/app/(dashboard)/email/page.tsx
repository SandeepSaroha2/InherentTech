'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@inherenttech/ui';
import { Mail, Send, Mail as MailIcon, Trash2, Search, Plus, Reply, ReplyAll, Forward } from 'lucide-react';

interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
}

const MOCK_EMAILS: EmailMessage[] = [
  {
    id: '1',
    from: 'sarah@company.com',
    to: 'you@company.com',
    subject: 'Q2 Campaign Results - Action Required',
    preview: 'Hi, I wanted to share the Q2 campaign results with you. Overall, we saw a 23% increase in...',
    body: 'Hi,\n\nI wanted to share the Q2 campaign results with you. Overall, we saw a 23% increase in conversions compared to Q1.\n\nKey metrics:\n- Click-through rate: 5.2%\n- Conversion rate: 3.1%\n- Cost per acquisition: $42\n\nPlease review and let me know if you need any additional analysis.\n\nBest regards,\nSarah',
    timestamp: '2026-03-27 10:45 AM',
    read: false,
    starred: true,
  },
  {
    id: '2',
    from: 'john@client.com',
    to: 'you@company.com',
    subject: 'Re: New Partnership Proposal',
    preview: 'Thank you for the proposal. We are very interested in moving forward. Can we schedule a call...',
    body: 'Thank you for the proposal. We are very interested in moving forward. Can we schedule a call next week to discuss implementation details?\n\nBest,\nJohn',
    timestamp: '2026-03-27 09:30 AM',
    read: false,
    starred: false,
  },
  {
    id: '3',
    from: 'marketing@newsletter.com',
    to: 'you@company.com',
    subject: 'Weekly Marketing Digest - March 27',
    preview: 'This week in marketing: New AI tools emerge, social media trends shift, and...',
    body: 'This week in marketing news:\n\n1. New AI tools emerge for content creation\n2. Social media trends shift toward short-form video\n3. Email marketing ROI remains strong at 42:1\n4. Website personalization becomes standard\n\nRead the full digest online.',
    timestamp: '2026-03-27 08:00 AM',
    read: true,
    starred: false,
  },
  {
    id: '4',
    from: 'alex@startup.io',
    to: 'you@company.com',
    subject: 'Introducing InherentTech Integration',
    preview: 'We have integrated InherentTech into our platform and seen impressive results...',
    body: 'Hi,\n\nWe have integrated InherentTech into our platform and the results have been impressive. Our team efficiency has increased by 40% in just two weeks.\n\nWould love to discuss a case study.\n\nBest,\nAlex',
    timestamp: '2026-03-26 04:15 PM',
    read: true,
    starred: false,
  },
  {
    id: '5',
    from: 'support@system.com',
    to: 'you@company.com',
    subject: 'System Maintenance Scheduled - Sunday 2AM',
    preview: 'We will be performing scheduled maintenance on Sunday from 2:00 AM to 6:00 AM EST...',
    body: 'Dear Customer,\n\nWe will be performing scheduled maintenance on Sunday from 2:00 AM to 6:00 AM EST. During this time, the system may be unavailable.\n\nWe apologize for any inconvenience.',
    timestamp: '2026-03-26 02:00 PM',
    read: true,
    starred: false,
  },
  {
    id: '6',
    from: 'team@company.com',
    to: 'you@company.com',
    subject: 'Urgent: Project Deadline Update',
    preview: 'The project deadline has been moved up by one week due to client requirements...',
    body: 'Team,\n\nThe project deadline has been moved up by one week. New deadline: April 3rd.\n\nPlease adjust your schedules accordingly and confirm receipt of this message.\n\nThanks,\nProject Manager',
    timestamp: '2026-03-26 11:30 AM',
    read: false,
    starred: false,
  },
  {
    id: '7',
    from: 'hr@company.com',
    to: 'you@company.com',
    subject: 'Benefits Enrollment - Action Required',
    preview: 'Please complete your benefits enrollment by March 31st. Access the portal here...',
    body: 'Hi,\n\nPlease complete your benefits enrollment by March 31st. This is required for all employees.\n\nAccess the portal: benefits.company.com\n\nLet me know if you have any questions.',
    timestamp: '2026-03-25 03:20 PM',
    read: false,
    starred: false,
  },
  {
    id: '8',
    from: 'partnership@vendor.com',
    to: 'you@company.com',
    subject: 'Special Offer - 30% Off Annual Plan',
    preview: 'We value our partnership and are offering you a special 30% discount on your annual...',
    body: 'Hi,\n\nWe value our partnership and are offering you a special 30% discount on your annual plan. This offer is valid until end of month.\n\nContact our sales team to redeem.',
    timestamp: '2026-03-25 10:00 AM',
    read: true,
    starred: false,
  },
];

const EMAIL_TEMPLATES = [
  { id: 'welcome', name: 'Welcome Email' },
  { id: 'followup', name: 'Follow-up Email' },
  { id: 'proposal', name: 'Proposal Template' },
  { id: 'invoice', name: 'Invoice Email' },
  { id: 'newsletter', name: 'Newsletter Template' },
];

const FOLDER_STRUCTURE = [
  { name: 'Inbox', count: 8, icon: 'inbox' },
  { name: 'Sent', count: 24, icon: 'send' },
  { name: 'Drafts', count: 3, icon: 'edit' },
  { name: 'Templates', count: 5, icon: 'file' },
];

export default function EmailDashboard() {
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(MOCK_EMAILS[0]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const filteredEmails = MOCK_EMAILS.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-8">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-green-600" />
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-green-600">2</span> sent today
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MailIcon className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-blue-600">28.3%</span> open rate
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-red-600" />
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-red-600">1.2%</span> bounce rate
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6">
            <Button
              onClick={() => setComposeOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 mb-6"
            >
              <Plus className="h-4 w-4" />
              Compose
            </Button>

            <div className="space-y-2">
              {FOLDER_STRUCTURE.map((folder: typeof FOLDER_STRUCTURE[0]) => (
                <button
                  key={folder.name}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span className="text-gray-700 font-medium">{folder.name}</span>
                  <span className="text-gray-500 text-sm">{folder.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1" />

          <div className="p-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">Quick Actions</p>
            <div className="space-y-2">
              <button className="w-full text-left text-sm text-blue-600 hover:text-blue-700 font-medium">
                Settings
              </button>
              <button className="w-full text-left text-sm text-blue-600 hover:text-blue-700 font-medium">
                View Archived
              </button>
            </div>
          </div>
        </div>

        {/* Email List & Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* List Header with Search */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button
                onClick={() => setShowTemplates(!showTemplates)}
                variant="outline"
                className="whitespace-nowrap"
              >
                {showTemplates ? 'Hide' : 'Show'} Templates
              </Button>
            </div>

            {showTemplates && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {EMAIL_TEMPLATES.map((template: typeof EMAIL_TEMPLATES[0]) => (
                  <button
                    key={template.id}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full whitespace-nowrap transition-colors"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No emails found</p>
              </div>
            ) : (
              filteredEmails.map((email: EmailMessage) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`border-b border-gray-200 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedEmail?.id === email.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${email.read ? 'bg-gray-300' : 'bg-blue-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className={`font-medium text-gray-900 truncate ${!email.read ? 'font-bold' : ''}`}>
                          {email.from}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                          {email.timestamp}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 truncate ${!email.read ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate line-clamp-1">
                        {email.preview}
                      </p>
                    </div>
                    {email.starred && (
                      <span className="text-yellow-500 flex-shrink-0">★</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Preview Panel */}
        {selectedEmail && (
          <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
            {/* Preview Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex-1 truncate">
                  {selectedEmail.subject}
                </h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>From: {selectedEmail.from}</span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <Reply className="h-4 w-4" />
                  Reply
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <ReplyAll className="h-4 w-4" />
                  Reply All
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <Forward className="h-4 w-4" />
                  Forward
                </Button>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedEmail.body}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-96 flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Compose Email</CardTitle>
                <button
                  onClick={() => setComposeOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="Email subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  placeholder="Write your message here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </CardContent>

            <div className="border-t p-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">Save as draft automatically</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setComposeOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
