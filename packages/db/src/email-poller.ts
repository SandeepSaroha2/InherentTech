/**
 * InherentTech Email Poller CLI
 * Polls recruiter inboxes, classifies inbound emails, updates ATS, sends replies.
 *
 * Usage (one-shot):  npx tsx src/email-poller.ts
 * Usage (daemon):    npx tsx src/email-poller.ts --watch
 */

import * as fs from 'fs';
import * as path from 'path';

// Load root .env (for CLI usage outside Next.js)
const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

import { pollAllInboxes } from './email-poller-core';

const POLL_INTERVAL_MS = 60_000; // 1 minute
const ORG_ID = process.env.ORG_ID || process.env.DEFAULT_ORG_ID || '';

async function pollOnce() {
  console.log(`\n[${new Date().toISOString()}] Running email poll...`);
  const summary = await pollAllInboxes(ORG_ID);

  for (const r of summary.results) {
    console.log(`\n📮 ${r.recruiter}`);
    if (r.messagesProcessed === 0 && r.errors.length === 0) {
      console.log('  No new messages.');
    }
    if (r.jobOrdersCreated.length) console.log(`  📋 Job orders created: ${r.jobOrdersCreated.join(', ')}`);
    if (r.candidatesAdded.length)  console.log(`  👤 Candidates added: ${r.candidatesAdded.join(', ')}`);
    if (r.repliesSent)             console.log(`  📤 Replies sent: ${r.repliesSent}`);
    if (r.errors.length)           console.log(`  ❌ Errors: ${r.errors.join('; ')}`);
  }

  console.log(`\n✅ Poll complete — ${summary.totalMessages} message(s) processed, ${summary.totalJobs} job(s) created, ${summary.totalCandidates} candidate(s) added.`);
}

async function main() {
  const watch = process.argv.includes('--watch');

  await pollOnce();

  if (watch) {
    console.log(`\nWatching for new emails every ${POLL_INTERVAL_MS / 1000}s... (Ctrl+C to stop)`);
    setInterval(pollOnce, POLL_INTERVAL_MS);
  }
}

main().catch(console.error);
