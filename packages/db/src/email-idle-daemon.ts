/**
 * IMAP IDLE Daemon — real-time email processing for recruiter mailboxes.
 *
 * Keeps a persistent IMAP IDLE connection open per recruiter mailbox.
 * The mail server pushes an EXISTS notification the instant new mail arrives —
 * client.idle() resolves immediately and we process within < 1 second.
 *
 * Fallback: if no server push arrives within 25 min, re-enters IDLE
 * (RFC 2177 recommends refreshing before 29 min).
 *
 * Usage:
 *   npx tsx src/email-idle-daemon.ts
 *   npm run email:idle   (from packages/db)
 */

import { ImapFlow } from 'imapflow';
import { pollAllInboxes, RECRUITER_ACCOUNTS } from './email-poller-core';

const ORG_ID = process.env.DEFAULT_ORG_ID || 'f50cd314-0567-4382-ba7e-2b70aecf2a6c';
const IMAP_HOST = 'box.xgnmail.com';
const IMAP_PORT = 993;
const RECONNECT_DELAY_MS = 5_000;
const IDLE_TIMEOUT_MS   = 25 * 60 * 1000; // 25 min — refresh before 29 min RFC limit

let shuttingDown = false;

function log(name: string, msg: string) {
  console.log(`[${new Date().toISOString()}] [${name}] ${msg}`);
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Watch one recruiter mailbox with IMAP IDLE.
 * client.idle() blocks until the server pushes a notification (EXISTS, FLAGS, etc.)
 * — this happens immediately when new mail arrives.
 */
async function watchMailbox(recruiter: typeof RECRUITER_ACCOUNTS[0]) {
  while (!shuttingDown) {
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
      log(recruiter.name, '📬 Connected');

      const lock = await client.getMailboxLock('INBOX');
      try {
        // Process any mail that landed while the daemon was offline
        const unseenOnConnect = await client.search({ seen: false });
        if (Array.isArray(unseenOnConnect) && unseenOnConnect.length > 0) {
          log(recruiter.name, `📨 ${unseenOnConnect.length} unread on connect — processing`);
          await runPoll(recruiter);
        } else {
          log(recruiter.name, '⏳ Mailbox current — entering IDLE');
        }

        // Main IDLE loop
        while (!shuttingDown) {
          // We use the 'exists' event to detect new mail in real-time.
          // ImapFlow emits 'exists' with { count, prevCount } when the server
          // sends an EXISTS update (RFC 3501 §7.3.1) — new mail fires this
          // immediately with count > prevCount.
          //
          // client.idle() keeps the IMAP IDLE command active on the wire.
          // We race it against:
          //   (a) existsPromise — resolves the instant new mail arrives
          //   (b) sleep(IDLE_TIMEOUT_MS) — 25-min refresh before RFC 29-min limit
          //
          // When (a) wins we break out to poll; when (b) wins we re-enter IDLE.
          // client.idle() auto-terminates after we stop awaiting it (returns void).

          let resolveOnExists!: (reason: string) => void;
          const existsPromise = new Promise<string>(
            r => { resolveOnExists = r; }
          );

          const onExists = (data: { count: number; prevCount: number }) => {
            if (data.count > data.prevCount) {
              log(recruiter.name, `📩 EXISTS push: ${data.prevCount} → ${data.count}`);
              resolveOnExists('exists');
            }
          };

          client.on('exists', onExists);

          const result = await Promise.race([
            client.idle().then(() => 'idle-done'),
            existsPromise,
            sleep(IDLE_TIMEOUT_MS).then(() => 'timeout'),
          ]);

          client.off('exists', onExists);

          if (shuttingDown) break;

          if (result === 'timeout') {
            // Refresh IDLE — send DONE then re-enter
            log(recruiter.name, '🔄 IDLE refresh (25 min)');
            continue;
          }

          // New mail or server push — check for unseen messages
          const unseen = await client.search({ seen: false });
          if (Array.isArray(unseen) && unseen.length > 0) {
            log(recruiter.name, `⚡ ${result === 'exists' ? 'Push' : 'Server update'} — ${unseen.length} new message(s)`);
            await runPoll(recruiter);
          }
          // If push was for something else (flags, expunge) just re-enter IDLE silently
        }
      } finally {
        lock.release();
      }
    } catch (err: any) {
      if (!shuttingDown) {
        log(recruiter.name, `⚠️  ${err.message} — reconnecting in ${RECONNECT_DELAY_MS / 1000}s`);
      }
    } finally {
      try { await client.logout(); } catch {}
    }

    if (!shuttingDown) await sleep(RECONNECT_DELAY_MS);
  }
}

async function runPoll(recruiter: typeof RECRUITER_ACCOUNTS[0]) {
  try {
    const summary = await pollAllInboxes(ORG_ID, [recruiter]);
    log(recruiter.name,
      `✅ Done — ${summary.totalMessages} msg, ${summary.totalJobs} job(s), ` +
      `${summary.totalCandidates} candidate(s), ${summary.totalCalls} call(s)`
    );
  } catch (err: any) {
    log(recruiter.name, `❌ Poll error: ${err.message}`);
  }
}

// Graceful shutdown
async function shutdown(sig: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[${new Date().toISOString()}] ${sig} — shutting down`);
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Start ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[${new Date().toISOString()}] 🚀 IMAP IDLE Daemon`);
  console.log(`[${new Date().toISOString()}]    Mailboxes : ${RECRUITER_ACCOUNTS.map(r => r.email).join(', ')}`);
  console.log(`[${new Date().toISOString()}]    Org       : ${ORG_ID}`);
  console.log('');
  await Promise.all(RECRUITER_ACCOUNTS.map(r => watchMailbox(r)));
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
