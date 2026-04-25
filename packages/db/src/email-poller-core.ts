/**
 * Core email polling logic — used by both the CLI poller and the ATS API route.
 * Exported from @inherenttech/db.
 *
 * LLM strategy: Anthropic Claude first, falls back to Ollama (llama3.2) automatically.
 * Actions saved as RecruiterInboxItem rows for Preeti to review in the dashboard.
 */
import { ImapFlow } from 'imapflow';
import { PrismaClient, Prisma } from '@prisma/client';
import { getSmtpTransporter } from './smtp';
import { createRetellCall } from './retell';
import { postJobToCeipal } from './ceipal';

// Instantiate prisma directly to avoid circular import issues when running as CLI
const prisma = new PrismaClient();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

async function callOllama(prompt: string, maxTokens = 800, mode: 'json' | 'text' = 'json'): Promise<string> {
  const controller = new AbortController();
  const timeoutMs = maxTokens > 1000 ? 180_000 : 90_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        ...(mode === 'json' && { format: 'json' }),
        options: { temperature: mode === 'json' ? 0 : 0.3, num_predict: maxTokens },
      }),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
    const json = await res.json() as { message: { content: string } };
    return json.message.content;
  } finally {
    clearTimeout(timeout);
  }
}

/** Prompt to turn a raw recruiter email into a clean, professional job description */
function buildPolishPrompt(rawEmail: string, jobTitle: string): string {
  return `You are a professional technical recruiter copywriter. Transform the raw email below into a clean, professional job description suitable for a staffing ATS (Ceipal).

RULES:
- Preserve ALL technical requirements, skills, years of experience, and qualifications verbatim.
- Keep the pay rate, contract type, duration, location, and visa requirements exactly as stated.
- Restructure into clearly labeled sections: Overview, Responsibilities, Required Skills, Nice to Have, Compensation & Terms.
- Write in a professional, direct tone. No fluff, no buzzwords.
- Do NOT invent or add any requirements not mentioned in the email.
- Output plain text only — no markdown, no HTML.

Job Title: ${jobTitle}

Raw Email:
${rawEmail.slice(0, 10000)}

Write the professional job description now:`;
}

export const RECRUITER_ACCOUNTS: Array<{ email: string; imapUser: string; pass: string; name: string }> = [
  { email: 'preeti@xgnmail.com', imapUser: 'preeti', pass: 'Preeti@2026', name: 'Preeti' },
  // { email: 'priya@xgnmail.com',    imapUser: 'priya',    pass: 'Priya@2026',    name: 'Priya'    },
  // { email: 'parul@xgnmail.com',    imapUser: 'parul',    pass: 'Parul@2026',    name: 'Parul'    },
  // { email: 'pritisha@xgnmail.com', imapUser: 'pritisha', pass: 'Pritisha@2026', name: 'Pritisha' },
  // { email: 'pari@xgnmail.com',     imapUser: 'pari',     pass: 'Pari@2026',     name: 'Pari'     },
];

const IMAP_HOST = 'box.xgnmail.com';
const IMAP_PORT = 993;
const SKIP_DOMAINS = ['supabase.io', 'supabase.com', 'xgnmail.com'];

// Auto-execute without review when confidence >= this threshold
const AUTO_EXECUTE_THRESHOLD = 0.85;

export interface PollResult {
  recruiter: string;
  messagesProcessed: number;
  jobOrdersCreated: string[];
  candidatesAdded: string[];
  repliesSent: number;
  callsQueued: number;
  inboxItemsCreated: string[];
  errors: string[];
}

export interface PollSummary {
  totalMessages: number;
  totalJobs: number;
  totalCandidates: number;
  totalCalls: number;
  results: PollResult[];
}

/** Step 1 — Fast classification: figure out email type + basic fields only */
function buildClassifyPrompt(from: string, fromName: string, subject: string, body: string, recruiterName: string, hasAttachment: boolean): string {
  return `You are an AI assistant for ${recruiterName}, a technical recruiter at InherentTech Solutions.
Analyze this email and respond with JSON only. No markdown, no explanation.

From: ${fromName} <${from}>
Subject: ${subject}
Has Attachment: ${hasAttachment}
Body:
${body.slice(0, 12000)}

Classify as one of:
- JOB_ORDER: client/vendor sending a new job opening or requirement
- CANDIDATE_REPLY: candidate responding to outreach or applying
- GENERAL: anything else

For JOB_ORDER extract:
  - title: job title string
  - requirements: string[] of specific technical skills/qualifications (each item one line)
  - location: city, state or "Remote"
  - rateRange: string like "$70-$80/hr W2, $80-$90/hr C2C" or null
  - clientName: the client company name or null
  - priority: "LOW"|"MEDIUM"|"HIGH"|"URGENT"

For CANDIDATE_REPLY extract:
  - candidateName, interest ("INTERESTED"|"NOT_INTERESTED"|"NEEDS_INFO"), skills: string[], expectedRate: number|null, availability: string, phone: string|null, hasResume: boolean

For GENERAL:
  - summary: string

Also:
- suggestedAction: one sentence what ${recruiterName} should do next
- shouldAutoCall: true only for CANDIDATE_REPLY INTERESTED with a phone number
- suggestedReply: professional reply from "${recruiterName} | Technical Recruiter | InherentTech Solutions"

JSON only:
{
  "type": "JOB_ORDER",
  "confidence": 0.95,
  "data": { "title": "...", "requirements": [], "location": "...", "rateRange": null, "clientName": null, "priority": "MEDIUM" },
  "suggestedAction": "...",
  "shouldAutoCall": false,
  "suggestedReply": "..."
}`;
}

/**
 * Step 2 — Structured data extraction from raw email (JOB_ORDER only).
 *
 * IMPORTANT: This step EXTRACTS only. It does NOT rewrite, summarize, or
 * paraphrase the email in any way. Every field value must come verbatim
 * or be derived directly from what is stated in the email.
 */
function buildExtractionPrompt(subject: string, body: string): string {
  return `You are a data extraction engine for a staffing ATS. Your job is to READ the email below and EXTRACT structured data from it.

RULES — strictly follow these:
- Do NOT rewrite, paraphrase, or summarize anything.
- Do NOT invent or assume values not stated in the email.
- Copy requirements EXACTLY as written in the email (skills, tools, years of experience).
- Use null for any field that is not mentioned in the email.

Email subject: ${subject}
Email body:
${body.slice(0, 12000)}

Return JSON only — no markdown, no explanation:
{
  "requirements": [
    "exact requirement as written in the email — include years of experience when mentioned",
    "..."
  ],
  "openings": <integer — number of positions/openings mentioned, default 1 if not stated>,
  "contractType": "Contract" | "Full-Time" | "Contract-to-Hire" | "Part-Time" | null,
  "duration": "<exact duration text from email, e.g. '6 months', '12+ months', 'long-term'>" | null,
  "remote": <true if email says remote/WFH/work from home, false if on-site/hybrid/in-person, true if not specified>,
  "visaRequirements": "<exact visa/work auth text from email, e.g. 'W2 only', 'USC/GC only', 'No H1B', 'Open'>" | null,
  "startDate": "<exact start date text, e.g. 'ASAP', 'Immediate', '2025-07-01'>" | null,
  "interviewProcess": "<exact interview process description from email>" | null
}`;
}

/** Step 3 — Boolean string generation from job title + requirements */
function buildBooleanPrompt(title: string, requirements: string[]): string {
  return `Generate a LinkedIn/Indeed boolean search string for sourcing candidates for this role.

Job Title: ${title}
Key Requirements: ${requirements.slice(0, 10).join(', ')}

Rules:
- Use AND, OR, NOT operators with parentheses
- Group synonyms with OR: ("Java" OR "Java Developer" OR "Java Engineer")
- AND together distinct required skills
- NOT to exclude junior/entry-level if it's a senior role
- Keep it practical and effective for LinkedIn Recruiter

Respond with JSON only:
{ "booleanSearchString": "(...) AND (...) NOT (...)" }`;
}

function parseJsonFromText(text: string): any {
  try { return JSON.parse(text); } catch {}
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`No JSON found in: ${text.slice(0, 200)}`);
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function classifyEmail(
  from: string, fromName: string, subject: string, body: string,
  recruiterName: string, hasAttachment: boolean
): Promise<{ type: string; confidence: number; data: Record<string, any>; suggestedReply: string; suggestedAction: string; shouldAutoCall: boolean }> {

  // Step 1: Classify + extract basic fields
  console.log(`    🦙 Step 1/3 — Classifying via Ollama (${OLLAMA_MODEL})...`);
  const classifyText = await callOllama(buildClassifyPrompt(from, fromName, subject, body, recruiterName, hasAttachment));
  const classified = parseJsonFromText(classifyText);

  // Steps 2 & 3 only for job orders
  if (classified.type === 'JOB_ORDER') {
    // Step 2: Structured extraction from raw email — no AI rewriting, extract only
    console.log(`    🦙 Step 2/3 — Extracting structured fields from email...`);
    try {
      const extractText = await callOllama(buildExtractionPrompt(subject, body), 1200);
      const extracted   = parseJsonFromText(extractText);

      // Use extracted requirements if more complete than Step 1's list
      if (Array.isArray(extracted.requirements) && extracted.requirements.length > 0) {
        classified.data.requirements = extracted.requirements;
      }
      // Store all additional structured fields — no description, just metadata
      if (extracted.openings && typeof extracted.openings === 'number' && extracted.openings > 0) {
        classified.data.openings = extracted.openings;
      }
      if (extracted.contractType) classified.data.contractType    = extracted.contractType;
      if (extracted.duration)     classified.data.duration        = extracted.duration;
      if (typeof extracted.remote === 'boolean') classified.data.remote = extracted.remote;
      if (extracted.visaRequirements) classified.data.visaRequirements = extracted.visaRequirements;
      if (extracted.startDate)        classified.data.startDate        = extracted.startDate;
      if (extracted.interviewProcess) classified.data.interviewProcess = extracted.interviewProcess;
    } catch (e: any) {
      console.log(`    ⚠️  Structured extraction failed (${e.message}) — using Step 1 data only`);
    }

    // Step 3: Boolean search string
    console.log(`    🦙 Step 3/3 — Generating boolean search string...`);
    try {
      const boolText = await callOllama(buildBooleanPrompt(
        classified.data.title || subject,
        classified.data.requirements || []
      ));
      const boolData = parseJsonFromText(boolText);
      if (boolData.booleanSearchString) {
        classified.data.booleanSearchString = boolData.booleanSearchString;
      }
    } catch (e: any) {
      console.log(`    ⚠️  Boolean string generation failed (${e.message})`);
    }
  }

  return classified;
}

/** Parse a resume from attachment text using Ollama */
async function parseResumeText(resumeText: string): Promise<Record<string, any> | null> {
  try {
    const text = await callOllama(`Extract structured data from this resume text. Return JSON only with:
{ "firstName": "", "lastName": "", "email": "", "phone": "", "currentTitle": "", "skills": [], "yearsOfExperience": 0, "location": "", "currentCompany": "" }

Resume:
${resumeText.slice(0, 4000)}`);
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

/** Strip HTML tags + CSS + extra whitespace to get clean plain text */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&bull;/g, '•')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Decode a MIME part's content given its Content-Transfer-Encoding.
 * Handles quoted-printable (with correct UTF-8 multi-byte decoding) and base64.
 */
function decodeMimePart(raw: string, encoding?: string): string {
  const enc = (encoding || '').toLowerCase().trim();

  if (enc === 'base64') {
    try {
      return Buffer.from(raw.replace(/\s+/g, ''), 'base64').toString('utf8');
    } catch {
      return raw;
    }
  }

  if (enc === 'quoted-printable') {
    // Remove QP soft line-breaks first
    let s = raw.replace(/=\r\n/g, '').replace(/=\n/g, '');
    // Decode consecutive hex sequences as UTF-8 bytes so multi-byte chars are preserved
    s = s.replace(/((?:=[0-9A-F]{2})+)/gi, (seq) => {
      const bytes = (seq.match(/=([0-9A-F]{2})/gi) || []).map(m => parseInt(m.slice(1), 16));
      try {
        return Buffer.from(bytes).toString('utf8');
      } catch {
        return seq;
      }
    });
    return s;
  }

  // 7bit / 8bit / binary — return as-is
  return raw;
}

/** Extract plain text from a raw MIME message, including attachments.
 *
 * Strategy:
 *   1. Parse all MIME parts per-part (decode each part individually).
 *   2. Collect text/plain and text/html candidates separately.
 *   3. Pick whichever produces MORE content after stripping — HTML emails
 *      often have a tiny text/plain placeholder with all content in HTML.
 */
function extractEmailParts(rawSource: string): { body: string; attachments: Array<{ filename: string; content: string }> } {
  const attachments: Array<{ filename: string; content: string }> = [];

  // Extract boundary from raw source headers (before any decoding)
  const boundaryMatch = rawSource.match(/boundary="?([^"\r\n;]+)"?/i);

  let plainBody = '';
  let htmlBody  = '';

  if (boundaryMatch) {
    const boundary = boundaryMatch[1].trim();
    // Split on the boundary marker; use raw source so boundaries survive
    const parts = rawSource.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\r\n|--)`));

    for (const part of parts) {
      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd === -1) continue;
      const headers    = part.slice(0, headerEnd).toLowerCase();
      const rawContent = part.slice(headerEnd + 4);

      // Determine per-part encoding
      const cteMatch = headers.match(/content-transfer-encoding:\s*(\S+)/);
      const cte      = cteMatch ? cteMatch[1].trim() : '7bit';

      // Skip multipart sub-containers (handled by the outer split)
      if (headers.includes('multipart/')) continue;

      if (headers.includes('text/plain') && !headers.match(/name\s*=/)) {
        // Plain text body part
        if (!plainBody) plainBody = decodeMimePart(rawContent.trim(), cte);
      } else if (headers.includes('text/html')) {
        if (!htmlBody) htmlBody = decodeMimePart(rawContent.trim(), cte);
      } else if (
        headers.includes('application/pdf') ||
        headers.includes('application/msword') ||
        headers.includes('application/vnd.openxmlformats') ||
        headers.includes('application/octet-stream')
      ) {
        const filenameMatch = part.match(/filename="?([^"\r\n]+)"?/i);
        const filename = filenameMatch ? filenameMatch[1].trim() : 'attachment';
        attachments.push({ filename, content: rawContent.replace(/\s+/g, '') });
      } else if (headers.includes('text/plain') && headers.match(/name\s*=/)) {
        const filenameMatch = part.match(/name="?([^"\r\n]+)"?/i);
        attachments.push({ filename: filenameMatch?.[1]?.trim() || 'attachment.txt', content: decodeMimePart(rawContent.trim(), cte) });
      }
    }
  }

  // Non-multipart fallback: body is everything after the header block
  if (!plainBody && !htmlBody) {
    const headerEnd = rawSource.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const allHeaders = rawSource.slice(0, headerEnd).toLowerCase();
      const cteMatch   = allHeaders.match(/content-transfer-encoding:\s*(\S+)/);
      const cte        = cteMatch ? cteMatch[1].trim() : '7bit';
      const rawBody    = rawSource.slice(headerEnd + 4);
      const decoded    = decodeMimePart(rawBody, cte);
      if (allHeaders.includes('text/html') || decoded.trimStart().startsWith('<')) {
        htmlBody = decoded;
      } else {
        plainBody = decoded;
      }
    }
  }

  // Choose the richer body: if HTML strips to significantly more text, prefer HTML
  let body = '';
  if (plainBody && htmlBody) {
    const stripped = htmlToPlainText(htmlBody);
    body = stripped.length > plainBody.length * 1.3 ? stripped : plainBody;
  } else if (htmlBody) {
    body = htmlToPlainText(htmlBody);
  } else {
    body = plainBody;
  }

  // Final normalisation
  body = body
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { body, attachments };
}

/**
 * Options for the per-recruiter polling pass.
 *
 * - `ignoreSeenFlag`: when `true`, fetch ALL recently-arrived messages (last
 *   `lookbackMinutes` minutes) regardless of \Seen status, then dedupe via the
 *   `messageId` field on `recruiter_inbox_items`. This is required for the
 *   xgnmail-inbound webhook path because Stalwart/Sieve delivery + the user's
 *   own IMAP client may have already marked messages \Seen by the time we
 *   look. Default `false` keeps the original UI-polling behavior.
 *
 * - `lookbackMinutes`: when `ignoreSeenFlag` is true, how far back to scan.
 *   Defaults to 30.
 */
export interface PollRecruiterOptions {
  ignoreSeenFlag?: boolean;
  lookbackMinutes?: number;
}

async function pollRecruiter(
  recruiter: typeof RECRUITER_ACCOUNTS[0],
  orgId: string,
  opts: PollRecruiterOptions = {}
): Promise<PollResult> {
  const result: PollResult = {
    recruiter: recruiter.email,
    messagesProcessed: 0,
    jobOrdersCreated: [],
    candidatesAdded: [],
    repliesSent: 0,
    callsQueued: 0,
    inboxItemsCreated: [],
    errors: [],
  };

  // Fetch org settings once — check per-recruiter auto-post setting, fallback to global, fallback to env
  const orgRow = await prisma.organization.findUnique({ where: { id: orgId }, select: { settings: true } });
  const orgSettings = (orgRow?.settings as Record<string, any>) || {};
  const recruiterOverride = orgSettings.recruiterSettings?.[recruiter.email];
  const autoPostCeipal = (
    recruiterOverride?.autoPostCeipal !== undefined
      ? recruiterOverride.autoPostCeipal            // per-recruiter setting wins
      : orgSettings.autoPostCeipal                  // fall back to org-global
  ) === true || process.env.AUTO_POST_CEIPAL === 'true';
  if (autoPostCeipal) console.log(`  ⚡ Auto-post to Ceipal: ENABLED (${recruiter.email})`);
  else console.log(`  📋 Auto-post to Ceipal: OFF — jobs will be DRAFT (${recruiter.email})`);

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: recruiter.imapUser, pass: recruiter.pass },
    tls: { rejectUnauthorized: false },
    logger: false,
  });

  try {
    await client.connect();
    await client.mailboxOpen('INBOX');

    // Search strategy depends on caller mode.
    //   UI poll:    seen:false (efficient, but misses any pre-\Seen messages)
    //   Webhook:    since:<lookback>  (catches \Seen messages, dedupes via DB)
    const lookbackMinutes = opts.lookbackMinutes ?? 30;
    const searchCriteria  = opts.ignoreSeenFlag
      ? { since: new Date(Date.now() - lookbackMinutes * 60 * 1000) }
      : { seen: false };
    const uids = await client.search(searchCriteria);
    if (opts.ignoreSeenFlag) {
      console.log(`  🔍 Webhook mode — searching last ${lookbackMinutes}min, found ${Array.isArray(uids)?uids.length:0} candidates`);
    }
    if (!Array.isArray(uids) || !uids.length) {
      await client.logout();
      return result;
    }

    type RawMsg = { uid: number; messageId: string; fromAddr: string; fromName: string; subject: string; body: string; attachments: Array<{ filename: string; content: string }> };
    const messages: RawMsg[] = [];
    const skipUids: number[] = [];

    // When ignoring \Seen, dedupe via DB: pull all messageIds we've already seen
    // for this recruiter so we don't reprocess them.
    let alreadyProcessed = new Set<string>();
    if (opts.ignoreSeenFlag) {
      const seen = await prisma.recruiterInboxItem.findMany({
        where: { orgId, recruiterEmail: recruiter.email, messageId: { not: null } },
        select: { messageId: true },
      });
      alreadyProcessed = new Set(seen.map(s => s.messageId!).filter(Boolean));
      console.log(`  🗂️  ${alreadyProcessed.size} messageIds already in DB — will skip those`);
    }

    for await (const msg of client.fetch(uids as any, { envelope: true, source: true, uid: true })) {
      const env = msg.envelope;
      if (!env) continue;
      const from = env.from?.[0];
      const fromAddr = from?.address || 'unknown';
      const fromName = from?.name || fromAddr;
      const subject = env.subject || '(no subject)';
      const messageId = env.messageId || '';

      if (SKIP_DOMAINS.some(d => fromAddr.endsWith(d))) {
        console.log(`  ⏭️  Skipping internal: ${fromAddr}`);
        skipUids.push(msg.uid);
        continue;
      }

      // Webhook-mode dedupe: skip messages we've already turned into inbox items
      if (messageId && alreadyProcessed.has(messageId)) {
        console.log(`  ⏭️  Already processed messageId=${messageId} ("${subject.slice(0,50)}")`);
        continue;
      }

      const raw = msg.source?.toString() || '';
      const { body, attachments } = extractEmailParts(raw);
      messages.push({ uid: msg.uid, messageId, fromAddr, fromName, subject, body, attachments });
    }

    for (const uid of skipUids) {
      await client.messageFlagsAdd(uid as any, ['\\Seen']);
    }

    for (const msg of messages) {
      const actionsLog: Array<{ action: string; status: string; timestamp: string; detail?: string }> = [];
      const logAction = (action: string, status: 'done' | 'failed' | 'pending', detail?: string) => {
        actionsLog.push({ action, status, timestamp: new Date().toISOString(), detail });
      };

      try {
        console.log(`  📧 "${msg.subject}" from ${msg.fromAddr} (${msg.attachments.length} attachments)`);
        const hasAttachment = msg.attachments.length > 0;
        const classified = await classifyEmail(msg.fromAddr, msg.fromName, msg.subject, msg.body, recruiter.name, hasAttachment);
        console.log(`  🤖 → ${classified.type} (${Math.round((classified.confidence || 0) * 100)}%) — ${classified.suggestedAction}`);

        const autoExecute = (classified.confidence || 0) >= AUTO_EXECUTE_THRESHOLD;
        let jobOrderId: string | undefined;
        let candidateId: string | undefined;
        let callId: string | undefined;
        let resumeParsed = false;

        if (classified.type === 'JOB_ORDER') {
          const d = classified.data;
          const clientName = d.clientName || msg.fromName;
          let company = await prisma.lead.findFirst({
            where: {
              orgId,
              OR: [
                { companyName: { contains: clientName, mode: 'insensitive' } },
                { contactEmail: msg.fromAddr },
              ],
            },
          });
          if (!company) {
            company = await prisma.lead.create({
              data: {
                orgId,
                companyName: d.clientName || msg.fromName,
                contactEmail: msg.fromAddr,
                stage: 'NEW',
                source: 'EMAIL',
              },
            });
          }

          const recruiterUser = await prisma.user.findFirst({ where: { orgId, email: recruiter.email } });

          // ── Rate extraction ────────────────────────────────────────────────
          // Use the LLM-extracted rate string first, then fall back to direct
          // body scan so we never lose rate info even if Ollama returns null.
          const rateStr = (d.rateRange || '').toString().trim();

          // Parse all plausible hourly-rate numbers (2–3 digits, $15–$999 range)
          let rateNums = [...rateStr.matchAll(/\$?\s*(\d{2,3})(?:\.\d+)?/g)]
            .map(m => Math.round(parseFloat(m[1])))
            .filter(n => n >= 15 && n <= 999);
          let rawRateContext = rateStr;

          // Fallback: scan the raw email body for $NN-$NN/hr patterns
          if (!rateNums.length) {
            const m = msg.body.match(
              /\$\s*(\d{2,3})\s*(?:[-–\/to]+\s*\$?\s*(\d{2,3}))?\s*(?:\/hr|per\s*hour|hourly)/i
            );
            if (m) {
              const lo = parseInt(m[1]);
              const hi = m[2] ? parseInt(m[2]) : lo;
              rateNums = [lo, hi];
              rawRateContext = m[0].trim();
            }
          }

          const rateRange = rateNums.length || rawRateContext
            ? {
                min:  rateNums[0] ?? null,
                max:  rateNums[1] ?? rateNums[0] ?? null,
                type: 'hourly',
                raw:  rawRateContext || null,   // full original string, e.g. "$70-$80/hr W2, $85/hr C2C"
              }
            : null;

          // ── Description: always the exact raw email body — no AI modification ──
          // All rate details, submission tables, visa requirements, start dates,
          // interview process — everything is preserved verbatim.
          const fullDescription = msg.body;

          // ── Number of openings: from extraction, fallback to 1 ────────────
          const openings = (typeof d.openings === 'number' && d.openings > 0) ? d.openings : 1;

          const job = await prisma.jobOrder.create({
            data: {
              orgId,
              clientId: company.id,
              title: d.title || msg.subject,
              description: fullDescription,
              booleanSearchString: d.booleanSearchString || null,
              requirements: Array.isArray(d.requirements) ? d.requirements : [],
              location: d.location || '',
              rateRange: rateRange ?? Prisma.JsonNull,
              priority: d.priority || 'MEDIUM',
              status: 'DRAFT',
              openings,
              filled: 0,
              assignedToId: recruiterUser?.id,
            },
          });
          jobOrderId = job.id;
          result.jobOrdersCreated.push(`${job.title} (${job.id})`);
          logAction('create_job_order', 'done', `"${job.title}" for ${clientName}`);
          console.log(`  ✅ Created JobOrder: "${job.title}"`);

          // Generate AI-polished description (always — needed for Ceipal posting quality)
          let ceipalDescription = fullDescription;
          try {
            console.log(`  🤖 Generating AI description for "${job.title}"...`);
            const aiDesc = (await callOllama(buildPolishPrompt(fullDescription, job.title), 1500, 'text')).trim();
            if (aiDesc.length > 100) {
              await prisma.jobOrder.update({ where: { id: job.id }, data: { aiDescription: aiDesc } });
              ceipalDescription = aiDesc;
              console.log(`  ✅ AI description saved (${aiDesc.length} chars)`);
            }
          } catch (e: any) {
            console.log(`  ⚠️  AI description failed (${e.message}) — will use raw email for Ceipal`);
          }

          // Auto-post to Ceipal if enabled in org settings
          if (autoPostCeipal) {
            console.log(`  🚀 Auto-posting "${job.title}" to Ceipal...`);
            try {
              const ceipalResult = await postJobToCeipal({
                title:               job.title,
                description:         ceipalDescription,  // AI-polished if available, raw email fallback
                booleanSearchString: d.booleanSearchString || null,
                requirements:        Array.isArray(d.requirements) ? d.requirements : [],
                location:            d.location || job.location,
                priority:            (d.priority || 'MEDIUM') as any,
                openings,                               // extracted from email, not hardcoded
                clientName:          d.clientName || clientName,
                contractType:        d.contractType || null,
                duration:            d.duration || null,
                remote:              typeof d.remote === 'boolean' ? d.remote : true,
                visaRequirements:    d.visaRequirements || null,
                ...(rateRange && { rateMin: rateRange.min ?? undefined, rateMax: rateRange.max ?? undefined }),
              });

              await prisma.jobOrder.update({
                where: { id: job.id },
                data: {
                  status:         'OPEN',
                  ceipalJobId:    ceipalResult.ceipalJobId,
                  ceipalPostedAt: new Date(),
                },
              });

              logAction('auto_post_ceipal', 'done',
                `Ceipal Job ID: ${ceipalResult.ceipalJobId}${ceipalResult.jobUrl ? ' | ' + ceipalResult.jobUrl : ''}`);
              console.log(`  📤 Ceipal auto-post success — Job ID: ${ceipalResult.ceipalJobId}`);
            } catch (e: any) {
              logAction('auto_post_ceipal', 'failed', e.message);
              console.log(`  ⚠️  Ceipal auto-post failed: ${e.message} — job stays DRAFT`);
            }
          }

        } else if (classified.type === 'CANDIDATE_REPLY' && classified.data?.interest !== 'NOT_INTERESTED') {
          const d = classified.data;
          const existing = await prisma.candidate.findFirst({
            where: { orgId, email: { equals: msg.fromAddr, mode: 'insensitive' } },
          });

          let candidate = existing;
          if (!candidate) {
            const parts = (d.candidateName || msg.fromName).trim().split(/\s+/);
            candidate = await prisma.candidate.create({
              data: {
                orgId,
                firstName: parts[0] || 'Unknown',
                lastName: parts.slice(1).join(' ') || '',
                email: msg.fromAddr,
                phone: d.phone || null,
                skills: Array.isArray(d.skills) ? d.skills : [],
                expectedRate: d.expectedRate || null,
                source: 'EMAIL',
                notes: `Replied to outreach. Availability: ${d.availability || 'unknown'}`,
                status: 'ACTIVE',
              },
            });
            result.candidatesAdded.push(`${candidate.firstName} ${candidate.lastName}`);
            logAction('create_candidate', 'done', `${candidate.firstName} ${candidate.lastName} <${msg.fromAddr}>`);
            console.log(`  ✅ Added Candidate: ${candidate.firstName} ${candidate.lastName}`);
          }
          candidateId = candidate.id;

          // Parse resume attachment if present
          if (hasAttachment && d.hasResume !== false) {
            for (const att of msg.attachments) {
              const isResume = /resume|cv/i.test(att.filename) ||
                /\.(pdf|doc|docx|txt)$/i.test(att.filename);
              if (isResume && att.content.length > 100) {
                console.log(`  📄 Parsing resume: ${att.filename}`);
                const parsed = await parseResumeText(att.content);
                if (parsed) {
                  // Update candidate with parsed info
                  const updates: Record<string, any> = {};
                  if (parsed.phone && !candidate.phone) updates.phone = parsed.phone;
                  if (parsed.currentTitle) updates.currentTitle = parsed.currentTitle;
                  if (parsed.currentCompany) updates.currentCompany = parsed.currentCompany;
                  if (parsed.yearsOfExperience) updates.yearsOfExperience = parsed.yearsOfExperience;
                  if (parsed.location) updates.location = parsed.location;
                  if (parsed.skills?.length > 0) updates.skills = Array.from(new Set([...(candidate.skills || []), ...parsed.skills]));
                  if (Object.keys(updates).length > 0) {
                    await prisma.candidate.update({ where: { id: candidate.id }, data: updates });
                  }
                  resumeParsed = true;
                  logAction('parse_resume', 'done', att.filename);
                  console.log(`  📝 Resume parsed for ${candidate.firstName}`);
                }
                break;
              }
            }
          }

          // Schedule Retell call if interested + has phone + auto-execute
          const phone = classified.data?.phone || candidate.phone;
          if (d.interest === 'INTERESTED' && phone && classified.shouldAutoCall && autoExecute) {
            try {
              const e164 = phone.replace(/\D/g, '');
              const callResult = await createRetellCall({
                toNumber: e164.startsWith('1') ? `+${e164}` : `+1${e164}`,
                metadata: {
                  candidateId: candidate.id,
                  candidateName: `${candidate.firstName} ${candidate.lastName}`,
                  recruiterName: recruiter.name,
                  orgId,
                },
                retellLlmDynamicVariables: {
                  candidate_name: `${candidate.firstName} ${candidate.lastName}`,
                  recruiter_name: recruiter.name,
                  role: 'technical recruiter screening',
                },
              });

              // Log call in DB
              const call = await prisma.call.create({
                data: {
                  orgId,
                  candidateId: candidate.id,
                  direction: 'OUTBOUND',
                  channel: 'RETELL_AI',
                  status: 'INITIATED',
                  fromNumber: process.env.RETELL_FROM_NUMBER || '',
                  toNumber: phone,
                  externalCallId: callResult.callId,
                  retellAgentId: callResult.agentId,
                },
              });
              callId = call.id;
              result.callsQueued++;
              logAction('schedule_call', 'done', `Retell call initiated to ${phone} (callId: ${callResult.callId})`);
              console.log(`  📞 Retell call initiated to ${phone}`);
            } catch (e: any) {
              logAction('schedule_call', 'failed', e.message);
              console.log(`  ⚠️  Retell call failed: ${e.message}`);
            }
          } else if (d.interest === 'INTERESTED' && phone && !autoExecute) {
            // Queue for manual review
            logAction('schedule_call', 'pending', `Phone: ${phone} — awaiting approval`);
          }
        }

        // Send auto-reply
        const replyText = typeof classified.suggestedReply === 'string'
          ? classified.suggestedReply : JSON.stringify(classified.suggestedReply);
        let replySent = false;
        if (replyText && (autoExecute || classified.type !== 'GENERAL')) {
          try {
            const mailer = getSmtpTransporter();
            const smtpFrom = process.env.SMTP_FROM || 'noreply@xgnmail.com';
            await mailer.sendMail({
              from: `${recruiter.name} at InherentTech <${smtpFrom}>`,
              replyTo: `${recruiter.name} <${recruiter.email}>`,
              to: `${msg.fromName} <${msg.fromAddr}>`,
              subject: `Re: ${msg.subject}`,
              inReplyTo: msg.messageId,
              references: msg.messageId,
              text: replyText,
              html: replyText.replace(/\n/g, '<br>'),
            });
            replySent = true;
            result.repliesSent++;
            logAction('send_reply', 'done', `Reply sent to ${msg.fromAddr}`);
            console.log(`  📤 Reply sent to ${msg.fromAddr}`);
          } catch (e: any) {
            logAction('send_reply', 'failed', e.message);
            console.log(`  ⚠️  Reply failed: ${e.message}`);
          }
        } else if (replyText) {
          logAction('send_reply', 'pending', 'Awaiting approval');
        }

        // Save inbox item for dashboard visibility
        const inboxItem = await prisma.recruiterInboxItem.create({
          data: {
            orgId,
            recruiterEmail: recruiter.email,
            fromEmail: msg.fromAddr,
            fromName: msg.fromName,
            subject: msg.subject,
            bodySnippet: msg.body,  // full body stored — @db.Text has no size limit
            messageId: msg.messageId || null,
            classification: classified.type as any,
            confidence: classified.confidence || 0,
            extractedData: classified.data || {},
            suggestedReply: classified.suggestedReply || null,
            suggestedAction: classified.suggestedAction || null,
            status: autoExecute ? 'AUTO_DONE' : 'PENDING',
            replySent,
            replySentAt: replySent ? new Date() : null,
            jobOrderId: jobOrderId || null,
            candidateId: candidateId || null,
            callId: callId || null,
            resumeParsed,
            actionsLog,
          },
        });
        result.inboxItemsCreated.push(inboxItem.id);

        await client.messageFlagsAdd(msg.uid as any, ['\\Seen']);
        result.messagesProcessed++;
      } catch (e: any) {
        result.errors.push(`[${msg.subject}] ${e.message}`);
        console.log(`  ❌ Error: ${e.message}`);
      }
    }

    await client.logout();
  } catch (e: any) {
    result.errors.push(e.message);
    try { await client.logout(); } catch {}
  }

  return result;
}

export async function pollAllInboxes(
  orgId: string,
  recruiters = RECRUITER_ACCOUNTS,
  opts: PollRecruiterOptions = {}
): Promise<PollSummary> {
  const results: PollResult[] = [];
  for (const recruiter of recruiters) {
    const r = await pollRecruiter(recruiter, orgId, opts);
    results.push(r);
  }
  return {
    totalMessages: results.reduce((s, r) => s + r.messagesProcessed, 0),
    totalJobs: results.reduce((s, r) => s + r.jobOrdersCreated.length, 0),
    totalCandidates: results.reduce((s, r) => s + r.candidatesAdded.length, 0),
    totalCalls: results.reduce((s, r) => s + r.callsQueued, 0),
    results,
  };
}
