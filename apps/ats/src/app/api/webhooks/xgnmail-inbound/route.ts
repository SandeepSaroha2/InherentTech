/**
 * POST /api/webhooks/xgnmail-inbound
 *
 * Push-based webhook called by the XgnMail mail server (Stalwart) when a new
 * email lands in a recruiter's mailbox. Triggers the ATS inbox pipeline for
 * JUST that recruiter, so we don't have to poll every 5 minutes.
 *
 * ── Auth ──
 *   Authorization: Bearer <WEBHOOK_SECRET>   (env var on both sides)
 *
 * ── Request body (application/json) ──
 *   {
 *     "recruiterEmail": "preeti@xgnmail.com",   // REQUIRED — which mailbox got new mail
 *     "orgId":          "...",                  // OPTIONAL — defaults to x-org-id header or env DEFAULT_ORG_ID
 *     "messageId":      "<abc@...>",            // OPTIONAL — hint only, for traceability
 *     "messageCount":   1,                      // OPTIONAL — hint only
 *     "trigger":        "new-mail"              // OPTIONAL — event kind
 *   }
 *
 * ── Behavior ──
 *   1. Verify Bearer token
 *   2. Resolve orgId + recruiter (must be in RECRUITER_ACCOUNTS)
 *   3. Run pollAllInboxes scoped to ONLY that one recruiter (IMAP fetch is
 *      fast since it's a local network to Stalwart)
 *   4. Return the processing summary
 *
 * ── Example Stalwart Sieve script ──
 *   require ["vnd.stalwart.execute"];
 *   if header :matches "To" "preeti@xgnmail.com" {
 *     execute "curl" [
 *       "-sS",
 *       "-X", "POST",
 *       "-H", "Authorization: Bearer ${WEBHOOK_SECRET}",
 *       "-H", "Content-Type: application/json",
 *       "-d", "{\"recruiterEmail\":\"preeti@xgnmail.com\",\"trigger\":\"new-mail\"}",
 *       "https://ats.aiocrm.com/api/webhooks/xgnmail-inbound"
 *     ];
 *   }
 *
 * ── Health check ──
 *   GET /api/webhooks/xgnmail-inbound   → { status: "ok" }
 */
import { NextRequest, NextResponse } from 'next/server';
import { pollAllInboxes, RECRUITER_ACCOUNTS } from '@inherenttech/db';

export async function POST(request: NextRequest) {
  // ── 1. Bearer auth ────────────────────────────────────────────────
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const auth  = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // ── 2. Parse body ─────────────────────────────────────────────────
  const body = await request.json().catch(() => ({} as any));
  const recruiterEmail = (body.recruiterEmail || '').toString().trim().toLowerCase();
  const messageId      = (body.messageId || '').toString();
  const trigger        = (body.trigger   || 'new-mail').toString();

  if (!recruiterEmail) {
    return NextResponse.json(
      { error: 'recruiterEmail is required in request body' },
      { status: 400 },
    );
  }

  // ── 3. Resolve org ────────────────────────────────────────────────
  const orgId =
    body.orgId ||
    request.headers.get('x-org-id') ||
    process.env.DEFAULT_ORG_ID ||
    '';

  if (!orgId) {
    return NextResponse.json(
      { error: 'orgId not resolvable (set x-org-id header, body.orgId, or DEFAULT_ORG_ID env)' },
      { status: 400 },
    );
  }

  // ── 4. Resolve recruiter (must be configured in RECRUITER_ACCOUNTS) ─
  const recruiter = RECRUITER_ACCOUNTS.find(
    r => r.email.toLowerCase() === recruiterEmail,
  );
  if (!recruiter) {
    return NextResponse.json(
      {
        error: `Unknown recruiter: ${recruiterEmail}`,
        configured: RECRUITER_ACCOUNTS.map(r => r.email),
      },
      { status: 404 },
    );
  }

  console.log(
    `[webhook:xgnmail-inbound] ${trigger} for ${recruiter.email} orgId=${orgId}` +
    (messageId ? ` messageId=${messageId}` : ''),
  );

  // ── 5. Process just this recruiter's inbox ─────────────────────────
  // ignoreSeenFlag: webhook-fired polls must not rely on \Seen because
  // Stalwart/Sieve delivery (or the user's own IMAP client) may have already
  // marked the message read. Dedup happens via DB messageId instead.
  try {
    const startedAt = Date.now();
    const summary   = await pollAllInboxes(orgId, [recruiter], {
      ignoreSeenFlag:  true,
      lookbackMinutes: 30,
    });
    const elapsedMs = Date.now() - startedAt;

    console.log(
      `[webhook:xgnmail-inbound] ${recruiter.email} done in ${elapsedMs}ms — ` +
      `msgs=${summary.totalMessages} jobs=${summary.totalJobs} ` +
      `cands=${summary.totalCandidates} calls=${summary.totalCalls}`,
    );

    return NextResponse.json({
      success:        true,
      triggered:      new Date().toISOString(),
      elapsedMs,
      recruiterEmail: recruiter.email,
      orgId,
      messageId:      messageId || undefined,
      summary,
    });
  } catch (e: any) {
    console.error(`[webhook:xgnmail-inbound] ${recruiter.email} failed:`, e.message);
    return NextResponse.json(
      { error: e.message, recruiterEmail: recruiter.email, orgId },
      { status: 500 },
    );
  }
}

// Simple GET for health check / smoke test from Stalwart
export async function GET() {
  return NextResponse.json({
    status:     'ok',
    endpoint:   'xgnmail-inbound',
    recruiters: RECRUITER_ACCOUNTS.map(r => ({ email: r.email, active: true })),
  });
}
