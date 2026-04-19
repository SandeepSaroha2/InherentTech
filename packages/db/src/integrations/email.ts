/**
 * XGNMail — Unified Email Service
 *
 * Abstracts email sending across providers:
 * - SMTP via xgnmail.com (primary — transactional & bulk)
 * - Gmail API (personal inbox sync)
 * - Resend (fallback if SMTP not configured)
 *
 * Used by all apps for email communication.
 */

import { getSmtpTransporter, SMTP_FROM } from '../smtp';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_BASE_URL = 'https://api.resend.com';
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

// ---- Types ----

export interface EmailMessage {
  from: string;          // sender email or alias
  to: string | string[]; // recipients
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string;    // base64 encoded
  contentType: string;
}

export interface EmailResult {
  id: string;
  provider: 'resend' | 'gmail' | 'smtp';
  status: 'sent' | 'queued' | 'failed';
  error?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  variables: string[]; // {{varName}} placeholders
}

export interface InboxMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  isRead: boolean;
  labels: string[];
  hasAttachments: boolean;
}

export interface InboxThread {
  id: string;
  subject: string;
  messages: InboxMessage[];
  lastMessageDate: string;
  participantCount: number;
}

export type EmailProvider = 'resend' | 'gmail' | 'smtp';

// ---- Resend Provider ----

async function resendFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${RESEND_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
  return res.json();
}

// ---- SMTP Provider (primary) ----

async function sendViaSMTP(message: EmailMessage): Promise<EmailResult> {
  const transporter = getSmtpTransporter();
  const from = message.from || SMTP_FROM;
  const to = Array.isArray(message.to) ? message.to.join(', ') : message.to;

  const info = await transporter.sendMail({
    from,
    to,
    cc: message.cc?.join(', '),
    bcc: message.bcc?.join(', '),
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: message.replyTo,
    headers: message.headers,
    attachments: message.attachments?.map(a => ({
      filename: a.filename,
      content: Buffer.from(a.content, 'base64'),
      contentType: a.contentType,
    })),
  });

  return { id: info.messageId, provider: 'smtp', status: 'sent' };
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  // Use SMTP (xgnmail) when configured, fall back to Resend
  if (process.env.SMTP_HOST) {
    try {
      return await sendViaSMTP(message);
    } catch (error: any) {
      return { id: '', provider: 'smtp', status: 'failed', error: error.message };
    }
  }

  // Resend fallback
  try {
    const payload = {
      from: message.from,
      to: Array.isArray(message.to) ? message.to : [message.to],
      cc: message.cc,
      bcc: message.bcc,
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
      headers: message.headers,
      tags: message.tags,
      attachments: message.attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
        type: a.contentType,
      })),
    };
    const result = await resendFetch('/emails', { method: 'POST', body: JSON.stringify(payload) });
    return { id: result.id, provider: 'resend', status: 'sent' };
  } catch (error: any) {
    return { id: '', provider: 'resend', status: 'failed', error: error.message };
  }
}

export async function sendBulkEmails(messages: EmailMessage[]): Promise<EmailResult[]> {
  // Send sequentially via SMTP (no batch API needed)
  if (process.env.SMTP_HOST) {
    const results: EmailResult[] = [];
    for (const message of messages) {
      results.push(await sendEmail(message));
    }
    return results;
  }

  // Resend batch fallback
  try {
    const payload = messages.map(m => ({
      from: m.from,
      to: Array.isArray(m.to) ? m.to : [m.to],
      subject: m.subject,
      html: m.html,
      text: m.text,
      reply_to: m.replyTo,
      tags: m.tags,
    }));
    const result = await resendFetch('/emails/batch', { method: 'POST', body: JSON.stringify(payload) });
    return (result.data || []).map((r: any) => ({
      id: r.id, provider: 'resend' as const, status: 'sent' as const,
    }));
  } catch (error: any) {
    return messages.map(() => ({
      id: '', provider: 'resend' as const, status: 'failed' as const, error: error.message,
    }));
  }
}

// ---- Template Rendering ----

export function renderEmailTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; html: string } {
  let subject = template.subject;
  let html = template.html;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    subject = subject.replace(regex, value);
    html = html.replace(regex, value);
  }

  return { subject, html };
}

// ---- Built-in Email Templates ----

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  CANDIDATE_OUTREACH: {
    id: 'tpl_candidate_outreach',
    name: 'Candidate Outreach',
    subject: 'Exciting Opportunity: {{jobTitle}} at {{clientName}}',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hi {{candidateName}},</p>
      <p>I came across your profile and thought you'd be a great fit for a <strong>{{jobTitle}}</strong> position with one of our clients{{clientLocation}}.</p>
      <p><strong>Key Details:</strong></p>
      <ul>
        <li>Role: {{jobTitle}}</li>
        <li>Location: {{location}}</li>
        <li>Duration: {{duration}}</li>
        <li>Rate: {{rateRange}}</li>
      </ul>
      <p>Would you be interested in learning more? I'd love to schedule a quick call to discuss.</p>
      <p>Best regards,<br/>{{recruiterName}}<br/>{{recruiterTitle}}<br/>InherentTech Solutions</p>
    </div>`,
    variables: ['candidateName', 'jobTitle', 'clientName', 'clientLocation', 'location', 'duration', 'rateRange', 'recruiterName', 'recruiterTitle'],
  },

  CLIENT_SUBMISSION: {
    id: 'tpl_client_submission',
    name: 'Client Submission',
    subject: 'Candidate Submission: {{candidateName}} for {{jobTitle}}',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hi {{clientContactName}},</p>
      <p>Please find below a submission for the <strong>{{jobTitle}}</strong> position (Req #{{jobId}}).</p>
      <p><strong>Candidate:</strong> {{candidateName}}<br/>
      <strong>Experience:</strong> {{experience}} years<br/>
      <strong>Key Skills:</strong> {{skills}}<br/>
      <strong>Visa Status:</strong> {{visaStatus}}<br/>
      <strong>Availability:</strong> {{availability}}<br/>
      <strong>Rate:</strong> {{billRate}}/hr</p>
      <p>Resume is attached for your review. Please let us know if you'd like to schedule an interview.</p>
      <p>Best regards,<br/>{{recruiterName}}<br/>InherentTech Solutions</p>
    </div>`,
    variables: ['clientContactName', 'jobTitle', 'jobId', 'candidateName', 'experience', 'skills', 'visaStatus', 'availability', 'billRate', 'recruiterName'],
  },

  INTERVIEW_CONFIRMATION: {
    id: 'tpl_interview_confirm',
    name: 'Interview Confirmation',
    subject: 'Interview Confirmed: {{jobTitle}} - {{interviewDate}}',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hi {{candidateName}},</p>
      <p>Your interview has been confirmed. Here are the details:</p>
      <p><strong>Position:</strong> {{jobTitle}}<br/>
      <strong>Date:</strong> {{interviewDate}}<br/>
      <strong>Time:</strong> {{interviewTime}}<br/>
      <strong>Type:</strong> {{interviewType}}<br/>
      <strong>Interviewer:</strong> {{interviewerName}}<br/>
      {{#meetingLink}}<strong>Meeting Link:</strong> <a href="{{meetingLink}}">Join Here</a>{{/meetingLink}}</p>
      <p>Please confirm your attendance by replying to this email. Good luck!</p>
      <p>Best regards,<br/>{{recruiterName}}<br/>InherentTech Solutions</p>
    </div>`,
    variables: ['candidateName', 'jobTitle', 'interviewDate', 'interviewTime', 'interviewType', 'interviewerName', 'meetingLink', 'recruiterName'],
  },

  PLACEMENT_WELCOME: {
    id: 'tpl_placement_welcome',
    name: 'Placement Welcome',
    subject: 'Welcome to Your New Assignment at {{clientName}}!',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hi {{candidateName}},</p>
      <p>Congratulations! We're excited to confirm your placement with <strong>{{clientName}}</strong>.</p>
      <p><strong>Start Date:</strong> {{startDate}}<br/>
      <strong>Position:</strong> {{jobTitle}}<br/>
      <strong>Location:</strong> {{location}}<br/>
      <strong>Pay Rate:</strong> \${{payRate}}/hr</p>
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Complete onboarding documents (you'll receive a separate email)</li>
        <li>Set up timesheet access at our employee portal</li>
        <li>Review the project details shared by your manager</li>
      </ol>
      <p>Welcome aboard! Don't hesitate to reach out if you have any questions.</p>
      <p>Best regards,<br/>{{recruiterName}}<br/>InherentTech Solutions</p>
    </div>`,
    variables: ['candidateName', 'clientName', 'startDate', 'jobTitle', 'location', 'payRate', 'recruiterName'],
  },

  TIMESHEET_REMINDER: {
    id: 'tpl_timesheet_reminder',
    name: 'Timesheet Reminder',
    subject: 'Reminder: Submit Your Timesheet for Week Ending {{weekEnding}}',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hi {{candidateName}},</p>
      <p>This is a friendly reminder to submit your timesheet for the week ending <strong>{{weekEnding}}</strong>.</p>
      <p>Please log into the <a href="{{portalUrl}}">Employee Portal</a> to submit your hours.</p>
      <p>If you've already submitted, please disregard this email.</p>
      <p>Thanks,<br/>InherentTech Staffing Team</p>
    </div>`,
    variables: ['candidateName', 'weekEnding', 'portalUrl'],
  },

  INVOICE_NOTIFICATION: {
    id: 'tpl_invoice_notification',
    name: 'Invoice Notification',
    subject: 'Invoice {{invoiceNumber}} - {{companyName}}',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hi {{clientContactName}},</p>
      <p>Please find attached Invoice <strong>#{{invoiceNumber}}</strong> for staffing services.</p>
      <p><strong>Amount:</strong> \${{amount}}<br/>
      <strong>Due Date:</strong> {{dueDate}}<br/>
      <strong>Period:</strong> {{periodStart}} - {{periodEnd}}</p>
      <p>Payment can be made via the link below:<br/>
      <a href="{{paymentLink}}" style="display: inline-block; padding: 10px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 8px;">Pay Now</a></p>
      <p>If you have any questions about this invoice, please don't hesitate to reach out.</p>
      <p>Best regards,<br/>InherentTech Billing Team</p>
    </div>`,
    variables: ['clientContactName', 'invoiceNumber', 'amount', 'dueDate', 'periodStart', 'periodEnd', 'paymentLink', 'companyName'],
  },
};

// ---- Gmail Integration (Inbox Sync) ----

export async function fetchInbox(accessToken: string, maxResults = 20, query?: string): Promise<InboxMessage[]> {
  const params = new URLSearchParams({ maxResults: String(maxResults) });
  if (query) params.set('q', query);

  const res = await fetch(`${GMAIL_API_BASE}/users/me/messages?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);
  const data = await res.json();

  if (!data.messages) return [];

  // Fetch message details in parallel (first 20)
  const details = await Promise.all(
    data.messages.slice(0, maxResults).map(async (m: any) => {
      const msgRes = await fetch(`${GMAIL_API_BASE}/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return msgRes.ok ? msgRes.json() : null;
    })
  );

  return details.filter(Boolean).map((msg: any) => {
    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    return {
      id: msg.id,
      threadId: msg.threadId,
      from: getHeader('From'),
      to: getHeader('To').split(',').map((e: string) => e.trim()),
      subject: getHeader('Subject'),
      snippet: msg.snippet || '',
      date: getHeader('Date'),
      isRead: !msg.labelIds?.includes('UNREAD'),
      labels: msg.labelIds || [],
      hasAttachments: (msg.payload?.parts || []).some((p: any) => p.filename),
    };
  });
}

export async function fetchThread(accessToken: string, threadId: string): Promise<InboxThread | null> {
  const res = await fetch(`${GMAIL_API_BASE}/users/me/threads/${threadId}?format=metadata`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;
  const data = await res.json();

  const messages: InboxMessage[] = (data.messages || []).map((msg: any) => {
    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
    return {
      id: msg.id, threadId: msg.threadId, from: getHeader('From'),
      to: getHeader('To').split(',').map((e: string) => e.trim()),
      subject: getHeader('Subject'), snippet: msg.snippet || '',
      date: getHeader('Date'), isRead: !msg.labelIds?.includes('UNREAD'),
      labels: msg.labelIds || [], hasAttachments: false,
    };
  });

  return {
    id: data.id,
    subject: messages[0]?.subject || '',
    messages,
    lastMessageDate: messages[messages.length - 1]?.date || '',
    participantCount: new Set(messages.map(m => m.from)).size,
  };
}

export async function sendGmailMessage(accessToken: string, message: EmailMessage): Promise<EmailResult> {
  const to = Array.isArray(message.to) ? message.to.join(', ') : message.to;
  const raw = btoa(
    `From: ${message.from}\r\nTo: ${to}\r\nSubject: ${message.subject}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${message.html || message.text || ''}`
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const res = await fetch(`${GMAIL_API_BASE}/users/me/messages/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { id: '', provider: 'gmail', status: 'failed', error: err };
  }

  const data = await res.json();
  return { id: data.id, provider: 'gmail', status: 'sent' };
}

// ---- Email Analytics ----

export async function getEmailStats(orgId: string): Promise<{
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  totalOpened: number;
  openRate: number;
  bounceRate: number;
}> {
  // Placeholder — in production, query EmailLog table
  return {
    totalSent: 1247,
    totalDelivered: 1198,
    totalBounced: 49,
    totalOpened: 834,
    openRate: 69.6,
    bounceRate: 3.9,
  };
}

// Get all available templates
export function getEmailTemplates(): EmailTemplate[] {
  return Object.values(EMAIL_TEMPLATES);
}

// Get template by ID
export function getEmailTemplate(id: string): EmailTemplate | undefined {
  return Object.values(EMAIL_TEMPLATES).find(t => t.id === id);
}
