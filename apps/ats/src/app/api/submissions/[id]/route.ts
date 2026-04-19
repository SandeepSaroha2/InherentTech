import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';
import { agentEvents } from '../../../../lib/agent-hooks';
import { createCrossAppEvent, dispatchCrossAppEvent, CROSS_APP_EVENTS } from '@inherenttech/shared';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const orgId = request.headers.get('x-org-id') || '';
    const userId = request.headers.get('x-user-id') || '';

    // Get current submission to track status change
    const currentSubmission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: { candidate: true, jobOrder: true },
    });

    const submission = await prisma.submission.update({
      where: { id: params.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.clientFeedback !== undefined && { clientFeedback: body.clientFeedback }),
        ...(body.internalNotes !== undefined && { internalNotes: body.internalNotes }),
        ...(body.billRate !== undefined && { billRate: body.billRate }),
        ...(body.payRate !== undefined && { payRate: body.payRate }),
      },
    });

    // Trigger agent event for submission status change
    if (body.status && currentSubmission && currentSubmission.status !== body.status) {
      agentEvents.submissionStatusChanged(
        submission.id,
        body.status,
        currentSubmission.status,
        {
          candidateId: submission.candidateId,
          candidateName: `${currentSubmission.candidate?.firstName || ''} ${currentSubmission.candidate?.lastName || ''}`.trim(),
          candidateEmail: currentSubmission.candidate?.email || '',
          jobOrderId: submission.jobOrderId,
          jobTitle: currentSubmission.jobOrder?.title || '',
          companyName: body.companyName || 'Unknown Company',
        },
        orgId,
        userId
      );
    }

    // Auto-create placement when ACCEPTED
    if (body.status === 'ACCEPTED') {
      const sub = await prisma.submission.findUnique({
        where: { id: params.id },
        include: { jobOrder: true, candidate: true },
      });
      if (sub) {
        const placement = await prisma.placement.create({
          data: {
            orgId: sub.orgId,
            candidateId: sub.candidateId,
            jobOrderId: sub.jobOrderId,
            submissionId: sub.id,
            startDate: body.startDate ? new Date(body.startDate) : new Date(),
            billRate: sub.billRate || 0,
            payRate: sub.payRate || 0,
            status: 'ACTIVE',
          },
        });

        // Trigger placement creation event
        agentEvents.placementCreated(
          {
            id: placement.id,
            candidateId: placement.candidateId,
            candidateName: `${sub.candidate?.firstName || ''} ${sub.candidate?.lastName || ''}`.trim(),
            jobOrderId: placement.jobOrderId,
            jobTitle: sub.jobOrder?.title || '',
            companyName: body.companyName || 'Unknown Company',
            startDate: placement.startDate.toISOString(),
            billRate: Number(placement.billRate),
            payRate: Number(placement.payRate),
          },
          orgId,
          userId
        );

        // Update job order filled count
        await prisma.jobOrder.update({
          where: { id: sub.jobOrderId },
          data: { filled: { increment: 1 } },
        });

        // Dispatch cross-app event to KudoDoc for onboarding
        await dispatchCrossAppEvent(
          createCrossAppEvent('ats', 'kudodoc', CROSS_APP_EVENTS.PLACEMENT_ONBOARD, {
            placementId: placement.id,
            candidateEmail: sub.candidate?.email,
            candidateName: `${sub.candidate?.firstName || ''} ${sub.candidate?.lastName || ''}`.trim(),
            jobTitle: sub.jobOrder?.title || '',
            jobId: sub.jobOrderId,
            startDate: placement.startDate.toISOString(),
          })
        );
      }
    }

    return NextResponse.json(submission);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
