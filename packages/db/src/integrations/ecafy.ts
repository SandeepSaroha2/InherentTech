/**
 * eCafy Email Campaigner Integration
 * https://ecafy.com
 *
 * InherentTech's mass email platform for client and candidate outreach.
 * This integration supports both API mode and webhook/CSV sync mode.
 *
 * Flows:
 * 1. AIOCRM → eCafy: Send lead outreach campaigns (cold email, follow-ups)
 * 2. ATS → eCafy: Send candidate outreach (job opportunities, updates)
 * 3. eCafy → Platform: Webhook callbacks for opens, clicks, replies, bounces
 */

const ECAFY_BASE_URL = process.env.ECAFY_API_URL || 'https://api.ecafy.com';
const ECAFY_API_KEY = process.env.ECAFY_API_KEY || '';

// ─── Types ───

export interface EcafyContact {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  customFields?: Record<string, string>;
  tags?: string[];
}

export interface EcafyCampaign {
  id?: string;
  name: string;
  subject: string;
  body: string; // HTML content
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  schedule?: string; // ISO date or 'immediate'
}

export interface EcafySequence {
  id?: string;
  name: string;
  steps: EcafySequenceStep[];
}

export interface EcafySequenceStep {
  delayDays: number;
  subject: string;
  body: string;
  skipIfReplied?: boolean;
}

export interface EcafyWebhookEvent {
  event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed' | 'complained';
  email: string;
  campaignId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface EcafyCampaignStats {
  campaignId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
}

// ─── API Client ───

async function ecafyFetch(path: string, options: RequestInit = {}) {
  const url = `${ECAFY_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ECAFY_API_KEY}`,
      'X-Source': 'inherenttech-platform',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`eCafy API error ${res.status}: ${body}`);
  }

  return res.json();
}

// ─── Contacts ───

export async function syncContacts(contacts: EcafyContact[], listName?: string): Promise<{ synced: number; errors: string[] }> {
  return ecafyFetch('/v1/contacts/bulk', {
    method: 'POST',
    body: JSON.stringify({ contacts, list: listName }),
  });
}

export async function addContact(contact: EcafyContact): Promise<{ id: string }> {
  return ecafyFetch('/v1/contacts', {
    method: 'POST',
    body: JSON.stringify(contact),
  });
}

export async function removeContact(email: string): Promise<void> {
  await ecafyFetch(`/v1/contacts/${encodeURIComponent(email)}`, { method: 'DELETE' });
}

export async function tagContacts(emails: string[], tags: string[]): Promise<void> {
  await ecafyFetch('/v1/contacts/tag', {
    method: 'POST',
    body: JSON.stringify({ emails, tags }),
  });
}

// ─── Campaigns ───

export async function createCampaign(campaign: EcafyCampaign): Promise<{ id: string }> {
  return ecafyFetch('/v1/campaigns', {
    method: 'POST',
    body: JSON.stringify(campaign),
  });
}

export async function sendCampaign(campaignId: string, recipientEmails: string[]): Promise<{ queued: number }> {
  return ecafyFetch(`/v1/campaigns/${campaignId}/send`, {
    method: 'POST',
    body: JSON.stringify({ recipients: recipientEmails }),
  });
}

export async function getCampaignStats(campaignId: string): Promise<EcafyCampaignStats> {
  return ecafyFetch(`/v1/campaigns/${campaignId}/stats`);
}

export async function listCampaigns(params?: { status?: string; limit?: number }): Promise<EcafyCampaign[]> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.limit) sp.set('limit', String(params.limit));
  const data = await ecafyFetch(`/v1/campaigns?${sp}`);
  return data.campaigns || data;
}

// ─── Sequences (Multi-step campaigns) ───

export async function createSequence(sequence: EcafySequence): Promise<{ id: string }> {
  return ecafyFetch('/v1/sequences', {
    method: 'POST',
    body: JSON.stringify(sequence),
  });
}

export async function enrollInSequence(sequenceId: string, contacts: EcafyContact[]): Promise<{ enrolled: number }> {
  return ecafyFetch(`/v1/sequences/${sequenceId}/enroll`, {
    method: 'POST',
    body: JSON.stringify({ contacts }),
  });
}

export async function pauseSequence(sequenceId: string): Promise<void> {
  await ecafyFetch(`/v1/sequences/${sequenceId}/pause`, { method: 'POST' });
}

export async function resumeSequence(sequenceId: string): Promise<void> {
  await ecafyFetch(`/v1/sequences/${sequenceId}/resume`, { method: 'POST' });
}

// ─── Templates ───

export async function listTemplates(): Promise<Array<{ id: string; name: string; subject: string }>> {
  const data = await ecafyFetch('/v1/templates');
  return data.templates || data;
}

export async function getTemplate(id: string): Promise<{ id: string; name: string; subject: string; body: string }> {
  return ecafyFetch(`/v1/templates/${id}`);
}

// ─── Analytics ───

export async function getDashboardStats(): Promise<{
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  overallOpenRate: number;
  overallReplyRate: number;
  campaignCount: number;
}> {
  return ecafyFetch('/v1/analytics/dashboard');
}

// ─── Webhook Handler ───

export function parseWebhookEvent(body: any): EcafyWebhookEvent {
  return {
    event: body.event,
    email: body.email || body.recipient,
    campaignId: body.campaign_id || body.campaignId,
    timestamp: body.timestamp || new Date().toISOString(),
    metadata: body.metadata || body.data,
  };
}

// ─── CSV Export Helper (fallback for non-API sync) ───

export function contactsToCSV(contacts: EcafyContact[]): string {
  const headers = ['email', 'first_name', 'last_name', 'company', 'title', 'tags'];
  const rows = contacts.map(c => [
    c.email,
    c.firstName || '',
    c.lastName || '',
    c.company || '',
    c.title || '',
    (c.tags || []).join(';'),
  ]);
  return [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
}
