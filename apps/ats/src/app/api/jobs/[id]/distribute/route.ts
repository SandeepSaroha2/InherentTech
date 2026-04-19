/**
 * POST /api/jobs/:id/distribute
 *
 * Distributes a job to all connected social/job-board channels.
 * Body: { channels?: ('linkedin'|'twitter'|'facebook')[] }  — defaults to all
 *
 * Returns per-channel results so the UI can show what succeeded/skipped.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';
import { distributeJob } from '@inherenttech/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orgId = request.headers.get('x-org-id') || '';
  if (!orgId) return NextResponse.json({ error: 'x-org-id required' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const channels = body.channels || ['linkedin', 'twitter', 'facebook'];

  // Fetch job (include assignedTo user so we can look up per-recruiter tokens)
  const job = await prisma.jobOrder.findFirst({
    where: { id: params.id, orgId },
    include: {
      client:     { select: { companyName: true } },
      assignedTo: { select: { email: true } },
    },
  });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  // Fetch org settings (distribution credentials)
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { settings: true },
  });
  const settings = (org?.settings as Record<string, any>) || {};

  // Overlay per-recruiter social tokens (if the assigned recruiter has connected their accounts)
  // These take precedence for LinkedIn (personal post) and Twitter (OAuth 2.0 Bearer).
  const recruiterEmail = (job.assignedTo as any)?.email || '';
  const recruiterSocial = settings?.recruiterSettings?.[recruiterEmail]?.social || {};

  const mergedSettings = {
    ...settings,
    // LinkedIn: prefer org-level company page; fall back to recruiter personal token + stored personId
    recruiterLinkedinToken:    recruiterSocial.linkedin?.accessToken || '',
    recruiterLinkedinPersonId: recruiterSocial.linkedin?.personId    || '',
    // Twitter: recruiter OAuth 2.0 Bearer + refresh token (from our OAuth flow)
    recruiterTwitterToken:   recruiterSocial.twitter?.accessToken  || '',
    recruiterTwitterRefresh: recruiterSocial.twitter?.refreshToken  || '',
    // Facebook / Google stay org-level only
  };

  // Run distribution
  const results = await distributeJob(job as any, mergedSettings as any, channels);

  // Log results in job's actionsLog (via inbox item if linked, or skip)
  const successCount = results.filter(r => r.success).length;
  const skipCount    = results.filter(r => r.skipped).length;
  const failCount    = results.filter(r => !r.success && !r.skipped).length;

  return NextResponse.json({
    jobId:   job.id,
    title:   job.title,
    results,
    summary: { success: successCount, skipped: skipCount, failed: failCount },
  });
}
