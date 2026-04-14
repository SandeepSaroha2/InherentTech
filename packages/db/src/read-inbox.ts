/**
 * Read Preeti's inbox via IMAP (imapflow)
 * Run: npx tsx src/read-inbox.ts  (from packages/db)
 */
import { ImapFlow } from 'imapflow';

const IMAP_HOST = 'box.xgnmail.com';
const IMAP_PORT = 993;
const USER = 'preeti'; // Stalwart uses short username (no domain)
const PASS = 'Preeti@2026';

async function readInbox() {
  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: USER, pass: PASS },
    tls: { rejectUnauthorized: false },
    logger: false,
  });

  await client.connect();
  console.log('✅ Connected and authenticated as', USER);

  const mailbox = await client.mailboxOpen('INBOX');
  console.log(`📬 INBOX: ${mailbox.exists} messages\n`);

  if (mailbox.exists === 0) {
    console.log('No messages found.');
    await client.logout();
    return;
  }

  // Fetch last 5 messages
  const start = Math.max(1, mailbox.exists - 4);
  console.log('Recent emails:\n');

  for await (const msg of client.fetch(`${start}:*`, { envelope: true, bodyStructure: true })) {
    const env = msg.envelope;
    if (!env) continue;
    const from = env.from?.[0];
    const fromStr = from ? `${from.name || ''} <${from.address}>`.trim() : 'unknown';
    console.log(`  [${msg.seq}] From: ${fromStr}`);
    console.log(`       Subject: ${env.subject || '(no subject)'}`);
    console.log(`       Date: ${env.date?.toISOString() || ''}`);
    console.log('');
  }

  // Fetch body of the most recent message
  console.log(`\nFetching body of most recent message (#${mailbox.exists})...\n`);
  for await (const msg of client.fetch(`${mailbox.exists}:${mailbox.exists}`, { envelope: true, source: true })) {
    const raw = msg.source?.toString() || '';
    // Strip headers — find double CRLF
    const bodyStart = raw.indexOf('\r\n\r\n');
    const body = bodyStart > -1 ? raw.slice(bodyStart + 4) : raw;
    console.log('--- Email Headers ---');
    if (bodyStart > -1) console.log(raw.slice(0, bodyStart).slice(0, 500));
    console.log('\n--- Email Body (preview) ---');
    console.log(body.slice(0, 2000));
  }

  await client.logout();
}

readInbox().catch(console.error);
