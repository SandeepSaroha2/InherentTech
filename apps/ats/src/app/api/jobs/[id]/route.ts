import { NextRequest, NextResponse } from 'next/server';
import { prisma, postJobToCeipal } from '@inherenttech/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('x-org-id') || '';

    const job = await prisma.jobOrder.findFirst({
      where: { id: params.id, orgId },
      include: {
        client: { select: { id: true, companyName: true } },
        assignedTo: { select: { id: true, name: true } },
        submissions: {
          include: {
            candidate: { select: { id: true, firstName: true, lastName: true, email: true, currentTitle: true, visaStatus: true } },
            submittedBy: { select: { id: true, name: true } },
          },
          orderBy: { submittedAt: 'desc' },
        },
        // Include the most recent linked inbox item so the job page can show
        // contract/visa/duration details that were extracted from the original email.
        inboxItems: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { extractedData: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const body = await request.json();

    const job = await prisma.jobOrder.update({
      where: { id: params.id },
      data: {
        ...(body.status                !== undefined && { status: body.status }),
        ...(body.priority              !== undefined && { priority: body.priority }),
        ...(body.title                 !== undefined && { title: body.title }),
        ...(body.description           !== undefined && { description: body.description }),
        ...(body.aiDescription         !== undefined && { aiDescription: body.aiDescription }),
        ...(body.booleanSearchString   !== undefined && { booleanSearchString: body.booleanSearchString }),
        ...(body.requirements          !== undefined && { requirements: body.requirements }),
        ...(body.rateRange             !== undefined && { rateRange: body.rateRange }),
        ...(body.location              !== undefined && { location: body.location }),
        ...(body.openings              !== undefined && { openings: body.openings }),
        ...(body.assignedToId          !== undefined && { assignedToId: body.assignedToId }),
      },
    });

    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/jobs/[id]
 * Post this job order to Ceipal ATS.
 * Reads all available extracted fields from the job + its linked inbox item.
 * Accepts optional field overrides in body (edits made in the review modal).
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const overrides = await request.json().catch(() => ({}));

    const job = await prisma.jobOrder.findFirst({
      where: { id: params.id, orgId },
      include: {
        client: { select: { companyName: true } },
        inboxItems: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { extractedData: true },
        },
      },
    });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Pull extracted metadata from linked inbox item (contractType, duration, etc.)
    const ed = (job.inboxItems?.[0]?.extractedData || {}) as Record<string, any>;

    // Apply any overrides (edits made in the review modal)
    const title        = overrides.title               ?? job.title;
    const description  = overrides.description         ?? job.description ?? '';
    const boolStr      = overrides.booleanSearchString ?? job.booleanSearchString;
    const requirements = overrides.requirements        ?? job.requirements;
    const location     = overrides.location            ?? job.location;
    const rateRange    = job.rateRange as any;
    const priority     = overrides.priority            ?? job.priority;
    const openings     = overrides.openings            ?? job.openings;
    const contractType = overrides.contractType        ?? ed.contractType;
    const duration     = overrides.duration            ?? ed.duration;
    const remote       = overrides.remote              ?? ed.remote;
    const visaReqs     = overrides.visaRequirements    ?? ed.visaRequirements;

    const result = await postJobToCeipal({
      title,
      description,
      booleanSearchString: boolStr,
      requirements,
      location,
      rateMin:  overrides.rateMin != null ? parseFloat(overrides.rateMin) : (rateRange?.min ?? null),
      rateMax:  overrides.rateMax != null ? parseFloat(overrides.rateMax) : (rateRange?.max ?? null),
      openings:  typeof openings === 'number' ? openings : 1,
      priority:  priority as any,
      clientName: job.client?.companyName,
      contractType,
      duration,
      remote:   remote === true,
      visaRequirements: visaReqs,
    });

    // Persist updated fields + Ceipal metadata
    const updatedJob = await prisma.jobOrder.update({
      where: { id: params.id },
      data: {
        title,
        description,
        booleanSearchString: boolStr ?? undefined,
        requirements,
        location: location ?? undefined,
        status:        'OPEN',
        ceipalJobId:   result.ceipalJobId,
        ceipalPostedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      ceipalJobId: result.ceipalJobId,
      jobUrl:      result.jobUrl,
      job:         updatedJob,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
