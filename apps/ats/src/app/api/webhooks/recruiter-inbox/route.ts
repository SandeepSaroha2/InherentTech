/**
 * POST /api/webhooks/recruiter-inbox
 *
 * Secure webhook endpoint to trigger Preeti's inbox processing pipeline.
 * Designed to be called by:
 *   - n8n on a schedule (every 5 min)
 *   - Gmail push notifications (Google Cloud Pub/Sub)
 *   - External cron services (cron-job.org, etc.)
 *
 * Authentication: Bearer token via WEBHOOK_SECRET env var.
 *
 * Example n8n HTTP Request node:
 *   URL: https://ats.aiocrm.com/api/webhooks/recruiter-inbox
 *   Method: POST
 *   Headers: Authorization: Bearer <WEBHOOK_SECRET>
 *            x-org-id: inherenttech
 */
import { NextRequest, NextResponse } from 'next/server';
import { pollAllInboxes } from '@inherenttech/db';

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const orgId = request.headers.get('x-org-id') ||
    (await request.json().catch(() => ({}))).orgId ||
    process.env.DEFAULT_ORG_ID ||
    'inherenttech';

  try {
    console.log(`[webhook:recruiter-inbox] Triggered for org: ${orgId}`);
    const summary = await pollAllInboxes(orgId);

    return NextResponse.json({
      success: true,
      triggered: new Date().toISOString(),
      orgId,
      ...summary,
    });
  } catch (e: any) {
    console.error('[webhook:recruiter-inbox]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Allow GET for health-check ping from n8n
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'recruiter-inbox-webhook' });
}
