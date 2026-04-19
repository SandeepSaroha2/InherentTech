/**
 * POST /api/email-poll
 * Triggers a one-shot poll of all recruiter inboxes.
 * Processes new emails via Claude, updates ATS DB, sends auto-replies.
 */
import { NextRequest, NextResponse } from 'next/server';
import { pollAllInboxes } from '@inherenttech/db';

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    if (!orgId) return NextResponse.json({ error: 'x-org-id required' }, { status: 400 });

    const summary = await pollAllInboxes(orgId);

    return NextResponse.json({ success: true, ...summary });
  } catch (e: any) {
    console.error('[email-poll]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
