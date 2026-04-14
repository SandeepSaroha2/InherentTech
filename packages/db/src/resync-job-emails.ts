/**
 * One-time script: re-fetch job emails from preeti@xgnmail.com and
 * update job descriptions + boolean search strings for jobs that were
 * created before the full-description fix was applied.
 *
 * Also creates missing RecruiterInboxItems (e.g. Kronos job).
 *
 * Run: npx tsx packages/db/src/resync-job-emails.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Load root .env
const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
    if (m) process.env[m[1]] = m[2];
  }
}

import { ImapFlow } from 'imapflow';
import { prisma } from './client';

const OLLAMA_BASE = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const IMAP_HOST = 'box.xgnmail.com';
const IMAP_PORT = 993;
const ORG_ID    = 'f50cd314-0567-4382-ba7e-2b70aecf2a6c';

// Direct UID → Job ID mapping (confirmed from DB + inbox)
const UID_TO_JOB: Record<number, string> = {
  4: 'ba5e6467-a6e9-4e99-b97a-a88b4232fb5a', // Kronos/UKG Engineer
  5: 'dfb8b025-bc90-4a6c-9f1c-b4dd3bcfc15d', // Business System Analyst (BA with Payment)
  6: '7174dcac-bb3e-4876-a47c-fb373c87aa4f', // Golang Backend Engineer
  7: '3c7e66df-66ee-4948-b041-6789de6cc017', // SAP BPC Consultant
  8: '8471b75c-cc45-4f7e-ae75-dcebf06810f5', // SAP MM/Ariba Analyst
};
const JOB_UIDS = Object.keys(UID_TO_JOB).map(Number);

function log(...args: any[]) {
  console.log('[resync]', ...args);
}

/** Strip HTML tags and decode common entities */
function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/Â/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Extract body text from raw email source */
function extractBody(raw: string): string {
  const decoded = raw
    .replace(/=\r\n/g, '')
    .replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));

  // Try to find text/plain part
  const plainMatch = decoded.match(/Content-Type: text\/plain[\s\S]*?\r?\n\r?\n([\s\S]*?)(?=--|\z)/i);
  if (plainMatch && plainMatch[1].trim().length > 100) {
    return plainMatch[1].trim();
  }

  // Fall back to text/html, strip tags
  const htmlMatch = decoded.match(/Content-Type: text\/html[\s\S]*?\r?\n\r?\n([\s\S]*?)(?=--[^\n]|\z)/i);
  if (htmlMatch && htmlMatch[1].trim().length > 50) {
    return htmlToText(htmlMatch[1]);
  }

  // Last resort: strip everything after headers
  const headerEnd = decoded.indexOf('\r\n\r\n');
  const body = headerEnd > -1 ? decoded.slice(headerEnd + 4) : decoded;
  return htmlToText(body);
}

interface ClassifiedJob {
  title: string;
  description: string;
  booleanSearchString: string;
  requirements: string[];
  location: string | null;
  rateMin: number | null;
  rateMax: number | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  clientName: string | null;
  isJobOrder: boolean;
}

async function classifyEmail(
  from: string, subject: string, body: string
): Promise<ClassifiedJob | null> {
  const prompt = `You are a recruiter assistant. Analyze this email and extract job order details.

From: ${from}
Subject: ${subject}
Body:
${body.slice(0, 6000)}

Respond with a JSON object (no markdown):
{
  "isJobOrder": true,
  "title": "...",
  "description": "COMPREHENSIVE job description — include ALL details. Minimum 3 paragraphs.",
  "booleanSearchString": "ready-to-use LinkedIn boolean string",
  "requirements": ["req 1", "req 2"],
  "location": "city, state or Remote or null",
  "rateMin": null,
  "rateMax": null,
  "priority": "MEDIUM",
  "clientName": "company name or null"
}`;

  const res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0, num_predict: 1500 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama error ${res.status}`);
  const json = await res.json() as any;
  const text = json.choices?.[0]?.message?.content || '';
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in response');
  const data = JSON.parse(cleaned.slice(start, end + 1));
  return data.isJobOrder ? data : null;
}

async function main() {
  log('Connecting to IMAP...');
  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: 'preeti', pass: 'Preeti@2026' },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');

  const emails: Array<{ uid: number; subject: string; from: string; messageId: string; body: string }> = [];

  try {
    for await (const msg of client.fetch(JOB_UIDS, { envelope: true, source: true })) {
      const env  = msg.envelope;
      if (!env) continue;
      const raw  = msg.source?.toString('utf8') ?? '';
      const body = extractBody(raw);
      emails.push({
        uid:       msg.uid,
        subject:   env.subject || '',
        from:      env.from?.[0]?.address || '',
        messageId: env.messageId || `uid-${msg.uid}`,
        body,
      });
      log(`Fetched UID ${msg.uid}: "${env.subject}" (body ${body.length} chars)`);
    }
  } finally {
    lock.release();
    await client.logout();
  }

  // Get existing jobs for context
  const existingJobs = await prisma.jobOrder.findMany({
    where: { orgId: ORG_ID },
    select: { id: true, title: true, description: true, booleanSearchString: true },
  });
  const existingInbox = await prisma.recruiterInboxItem.findMany({
    where: { orgId: ORG_ID },
    select: { id: true, jobOrderId: true, subject: true },
  });

  log(`\nFound ${existingJobs.length} jobs, ${existingInbox.length} inbox items\n`);

  for (const email of emails) {
    const jobId = UID_TO_JOB[email.uid];
    log(`\n--- UID ${email.uid}: "${email.subject}" → job ${jobId} ---`);

    const matchedJob = existingJobs.find(j => j.id === jobId);
    if (!matchedJob) {
      log(`  Job not found in DB — skipping`);
      continue;
    }

    log(`  Job: "${matchedJob.title}" | current desc length: ${matchedJob.description?.length ?? 0}`);

    // Use email body as description (same logic as the fixed poller)
    const finalDescription = (matchedJob.description && matchedJob.description.length > 200)
      ? matchedJob.description   // already good — don't overwrite
      : email.body;              // use full email body

    if (finalDescription === matchedJob.description) {
      log(`  Description already looks good (${matchedJob.description!.length} chars) — skipping update`);
    } else {
      await prisma.jobOrder.update({
        where: { id: matchedJob.id },
        data: { description: finalDescription },
      });
      log(`  ✅ Updated description to ${finalDescription.length} chars`);
    }

    // Create inbox item if missing
    const existingItem = existingInbox.find(i => i.jobOrderId === matchedJob.id);
    if (!existingItem) {
      log(`  Creating missing inbox item...`);
      await prisma.recruiterInboxItem.create({
        data: {
          orgId:          ORG_ID,
          recruiterEmail: 'preeti@xgnmail.com',
          fromEmail:      email.from,
          fromName:       email.from.split('@')[0],
          subject:        email.subject,
          bodySnippet:    email.body.slice(0, 500),
          messageId:      email.messageId,
          classification: 'JOB_ORDER',
          confidence:     0.95,
          extractedData:  { title: matchedJob.title, isJobOrder: true } as any,
          status:         'APPROVED',
          jobOrderId:     matchedJob.id,
          actionsLog:     [],
        },
      });
      log(`  ✅ Created inbox item`);
    } else {
      log(`  Inbox item already exists (${existingItem.id})`);
    }
  }

  log('\n✅ Resync complete!');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
