/**
 * Ceipal ATS REST API integration.
 *
 * Confirmed working endpoints (discovered via API probing):
 *   POST /v1/createAuthtoken/           — get JWT (XML response, field: email)
 *   POST /savecustomJobPostingDetails/{encodedAccountId}/{widgetApiKey}/
 *        — create job posting (JSON array payload, Bearer token required)
 *
 * Env vars required:
 *   CEIPAL_USERNAME         — Ceipal login email
 *   CEIPAL_PASSWORD         — Ceipal login password
 *   CEIPAL_API_KEY          — auth API key (from Ceipal Settings → API)
 *   CEIPAL_ENCODED_ACCOUNT  — base64 encoded account ID from the custom job posting URL
 *   CEIPAL_WIDGET_KEY       — widget API key from the custom job posting URL
 *   CEIPAL_RECRUITER_EMAIL  — email of the recruitment manager in Ceipal
 */

const CEIPAL_BASE = (process.env.CEIPAL_API_URL || 'https://api.ceipal.com').replace(/\/$/, '');

// Simple in-process token cache (expires every 55 min to stay inside the 60-min window)
let _tokenCache: { token: string; expiresAt: number } | null = null;

/** Extract a tag value from Ceipal's XML responses, e.g. <access_token>...</access_token> */
function extractXmlTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>([^<]+)<\\/${tag}>`));
  return m ? m[1].trim() : null;
}

async function getCeipalToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) return _tokenCache.token;

  const email   = process.env.CEIPAL_USERNAME;
  const password = process.env.CEIPAL_PASSWORD;
  const apiKey  = process.env.CEIPAL_API_KEY;
  if (!email || !password || !apiKey) {
    throw new Error('CEIPAL_USERNAME, CEIPAL_PASSWORD and CEIPAL_API_KEY env vars are all required');
  }

  const res = await fetch(`${CEIPAL_BASE}/v1/createAuthtoken/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, api_key: apiKey }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ceipal auth failed (${res.status}): ${body}`);
  }

  // Ceipal returns XML: <root><access_token>...</access_token></root>
  const text  = await res.text();
  const token = extractXmlTag(text, 'access_token');
  if (!token) throw new Error(`Ceipal auth: no access_token in response — ${text.slice(0, 200)}`);

  _tokenCache = { token, expiresAt: Date.now() + 55 * 60 * 1000 };
  return token;
}

export interface CeipalJobInput {
  title: string;
  description: string;           // raw email body — no AI rewriting
  booleanSearchString?: string | null;
  requirements: string[];
  location?: string | null;
  rateMin?: number | null;
  rateMax?: number | null;
  openings?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  clientName?: string | null;
  // Extracted from email (no AI generation)
  contractType?: string | null;  // "Contract" | "Full-Time" | "Contract-to-Hire"
  duration?: string | null;      // e.g. "6 months", "12+ months"
  remote?: boolean;              // true if location indicates remote
  visaRequirements?: string | null; // e.g. "W2 only, USC/GC preferred"
}

export interface CeipalJobResult {
  ceipalJobId: string;
  jobCode?: string;
  jobUrl?: string;
  raw?: Record<string, any>;
}

const PRIORITY_MAP: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Hot',
};

/**
 * Post a job order to Ceipal.
 *
 * Uses the confirmed working endpoint:
 *   POST /savecustomJobPostingDetails/{encodedAccountId}/{widgetApiKey}/
 *
 * Required env vars beyond auth:
 *   CEIPAL_ENCODED_ACCOUNT  — e.g. UGtpQkJSTEZ3Z0xBaDdsN1QwOXBIUT09
 *   CEIPAL_WIDGET_KEY       — e.g. e6a50f3006a9ce6bf92b627572980553
 *   CEIPAL_RECRUITER_EMAIL  — recruitment manager email in Ceipal
 */
export async function postJobToCeipal(job: CeipalJobInput): Promise<CeipalJobResult> {
  const token = await getCeipalToken();

  const encodedAccount   = process.env.CEIPAL_ENCODED_ACCOUNT;
  const widgetKey        = process.env.CEIPAL_WIDGET_KEY;
  const recruiterEmail   = process.env.CEIPAL_RECRUITER_EMAIL || process.env.CEIPAL_USERNAME || '';

  if (!encodedAccount || !widgetKey) {
    throw new Error('CEIPAL_ENCODED_ACCOUNT and CEIPAL_WIDGET_KEY env vars are required for job posting');
  }

  // Determine remote flag from the location field or explicit remote flag
  const isRemote = job.remote === true
    || job.remote !== false && (
      !job.location
      || /remote|wfh|work from home/i.test(job.location)
    );

  // Build the description block: raw email body + structured metadata footer
  // The email body is the source of truth — we append a clean metadata summary
  // so Ceipal's recruiter search can index key details even if they parse the field.
  const metaLines: string[] = [];
  if (job.contractType)      metaLines.push(`Contract Type: ${job.contractType}`);
  if (job.duration)          metaLines.push(`Duration: ${job.duration}`);
  if (job.visaRequirements)  metaLines.push(`Visa/Work Auth: ${job.visaRequirements}`);
  if (job.rateMin != null)   metaLines.push(`Pay Rate: $${job.rateMin}${job.rateMax && job.rateMax !== job.rateMin ? `–$${job.rateMax}` : ''}/hr`);

  const metaBlock = metaLines.length > 0
    ? `\n\n--- Job Details ---\n${metaLines.join('\n')}`
    : '';
  const reqBlock = job.requirements.length > 0
    ? `\n\nRequired Skills:\n${job.requirements.map(r => `• ${r}`).join('\n')}`
    : '';
  const boolBlock = job.booleanSearchString
    ? `\n\nBoolean Search String:\n${job.booleanSearchString}`
    : '';

  const fullDescription = `${job.description}${metaBlock}${reqBlock}${boolBlock}`;

  // Payload must be a JSON array — each element is one job posting
  const payload = [{
    job_title:           job.title,
    job_description:     fullDescription,
    skills:              job.requirements.join(', '),
    location:            job.location || 'Remote',
    no_of_positions:     job.openings || 1,
    job_status:          1,           // 1 = Open/Active
    remote_job:          isRemote ? 1 : 0,
    recruitment_manager: recruiterEmail,
    client:              job.clientName || '',
    priority:            PRIORITY_MAP[job.priority || 'MEDIUM'] || 'Medium',
    ...(job.rateMin != null && { pay_rate_from: job.rateMin }),
    ...(job.rateMax != null && { pay_rate_to:   job.rateMax }),
  }];

  const endpoint = `${CEIPAL_BASE}/savecustomJobPostingDetails/${encodedAccount}/${widgetKey}/`;

  const res = await fetch(endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ceipal job post failed (${res.status}): ${body}`);
  }

  const results = await res.json() as Array<Record<string, any>>;
  const data    = Array.isArray(results) ? results[0] : results;

  if (!data || data.success === 'N' || data.status === 400) {
    throw new Error(`Ceipal job post error: ${JSON.stringify(data?.message || data)}`);
  }

  const ceipalJobId = String(data.ceipaljobId || data.job_id || data.id || '');
  if (!ceipalJobId) throw new Error(`Ceipal job post: no job ID in response — ${JSON.stringify(data)}`);

  return {
    ceipalJobId,
    jobCode: data.job_code,
    jobUrl:  data.job_url || data.url,
    raw:     data,
  };
}

/**
 * Fetch all jobs posted via the custom widget.
 */
export async function getCeipalJobs(): Promise<Record<string, any>[]> {
  const token          = await getCeipalToken();
  const encodedAccount = process.env.CEIPAL_ENCODED_ACCOUNT;
  const widgetKey      = process.env.CEIPAL_WIDGET_KEY;
  if (!encodedAccount || !widgetKey) return [];

  const res = await fetch(
    `${CEIPAL_BASE}/savecustomJobPostingDetails/${encodedAccount}/${widgetKey}/`,
    { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: '{}' }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
