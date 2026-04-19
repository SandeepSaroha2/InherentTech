import { api } from './api';
import type { EmailMessage, EmailResult, EmailTemplate, InboxMessage, InboxThread } from '@inherenttech/db';

// ---- Send Email ----

export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  variables?: Record<string, string>;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{ filename: string; content: string; contentType: string }>;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(data: SendEmailRequest): Promise<EmailResult> {
  return api('/email/send', {
    method: 'POST',
    body: data,
  });
}

// Send bulk emails
export async function sendBulkEmails(messages: SendEmailRequest[]): Promise<EmailResult[]> {
  const results = await Promise.all(
    messages.map(msg => sendEmail(msg))
  );
  return results;
}

// Send email with template
export async function sendEmailWithTemplate(
  to: string | string[],
  templateId: string,
  variables: Record<string, string>,
  options?: Partial<SendEmailRequest>
): Promise<EmailResult> {
  return sendEmail({
    to,
    template: templateId,
    variables,
    subject: '', // Will be rendered from template
    ...options,
  });
}

// ---- Templates ----

export interface TemplateList {
  builtIn: (EmailTemplate & { isCustom: false })[];
  custom: (EmailTemplate & { isCustom: true })[];
  total: number;
}

export async function listEmailTemplates(): Promise<TemplateList> {
  return api('/email/templates');
}

export async function createEmailTemplate(
  name: string,
  subject: string,
  html: string,
  description?: string
): Promise<EmailTemplate & { variables: string[]; isCustom: true }> {
  return api('/email/templates', {
    method: 'POST',
    body: { name, subject, html, description },
  });
}

// ---- Inbox / Gmail ----

export interface InboxResponse {
  messages: InboxMessage[];
  count: number;
  maxResults: number;
  query: string;
}

export async function fetchInboxMessages(
  maxResults = 20,
  query?: string,
  accessToken?: string
): Promise<InboxResponse> {
  const params: Record<string, string> = {
    maxResults: String(maxResults),
  };
  if (query) params.query = query;

  const options: any = { params };
  if (accessToken) {
    options.headers = { Authorization: `Bearer ${accessToken}` };
  }

  return api('/email/inbox', options);
}

export async function fetchInboxThread(
  threadId: string,
  accessToken?: string
): Promise<InboxThread> {
  const params = { threadId };
  const options: any = { params };
  if (accessToken) {
    options.headers = { Authorization: `Bearer ${accessToken}` };
  }

  return api('/email/inbox', options);
}

export async function syncInbox(accessToken: string): Promise<{ synced: number; status: string }> {
  return api('/email/inbox', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ---- Analytics ----

export interface EmailStats {
  period: string;
  dateRange: { start: string; end: string };
  summary: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalQueued: number;
    deliveryRate: number;
    failureRate: number;
  };
  byProvider: { resend: number; gmail: number };
  topTemplates: Array<{ templateId: string; count: number }>;
  timestamp: string;
}

export async function getEmailStats(
  period: 'day' | 'week' | 'month' | 'all' = 'month',
  provider: 'resend' | 'gmail' | 'all' = 'all'
): Promise<EmailStats> {
  return api('/email/stats', {
    params: { period, provider },
  });
}

// ---- Common Usage Patterns ----

export const emailApi = {
  // Send emails
  send: sendEmail,
  sendBulk: sendBulkEmails,
  sendWithTemplate: sendEmailWithTemplate,

  // Template management
  listTemplates: listEmailTemplates,
  createTemplate: createEmailTemplate,

  // Inbox
  getInbox: fetchInboxMessages,
  getThread: fetchInboxThread,
  syncInbox,

  // Analytics
  getStats: getEmailStats,
};
