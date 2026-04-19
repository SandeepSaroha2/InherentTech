import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';
import { createCrossAppEvent, dispatchCrossAppEvent, CROSS_APP_EVENTS } from '@inherenttech/shared';

// POST /api/jobs/:id/publish
// Body: { publish: true/false }
// Makes the job visible/hidden on the public job board
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const orgId = req.headers.get('x-org-id') || 'default';

  try {
    const { publish } = await req.json();

    const job = await prisma.jobOrder.findFirst({
      where: { id: params.id, orgId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Update job with public visibility flag
    // Using the existing status field: OPEN = published, ON_HOLD = unpublished
    const updated = await prisma.jobOrder.update({
      where: { id: params.id },
      data: {
        status: publish ? 'OPEN' : 'ON_HOLD',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        userId: req.headers.get('x-user-id') || 'system',
        action: publish ? 'JOB_PUBLISHED' : 'JOB_UNPUBLISHED',
        entity: 'JobOrder',
        entityId: params.id,
        metadata: { previousStatus: job.status, newStatus: updated.status },
      },
    });

    // Dispatch cross-app event to JobPlatform
    const eventType = publish ? CROSS_APP_EVENTS.JOB_PUBLISHED : CROSS_APP_EVENTS.JOB_UNPUBLISHED;
    await dispatchCrossAppEvent(
      createCrossAppEvent('ats', 'jobplatform', eventType, {
        jobId: params.id,
        jobTitle: job.title,
        previousStatus: job.status,
        newStatus: updated.status,
        orgId,
      })
    );

    return NextResponse.json({
      message: publish ? 'Job published to job board' : 'Job removed from job board',
      jobId: params.id,
      status: updated.status,
    });
  } catch (error: any) {
    console.error('[Job Publish Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
