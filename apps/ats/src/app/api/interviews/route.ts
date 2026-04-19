import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = request.headers.get('x-org-id') || '';
    const candidateId = searchParams.get('candidateId');
    const upcoming = searchParams.get('upcoming');

    const where: any = { orgId };
    if (candidateId) where.candidateId = candidateId;
    if (upcoming === 'true') {
      where.scheduledAt = { gte: new Date() };
      where.status = 'SCHEDULED';
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        submission: { include: { jobOrder: { select: { id: true, title: true } } } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return NextResponse.json({ data: interviews });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const body = await request.json();
    const interview = await prisma.interview.create({
      data: {
        orgId,
        submissionId: body.submissionId,
        candidateId: body.candidateId,
        interviewerName: body.interviewerName,
        interviewerEmail: body.interviewerEmail,
        scheduledAt: new Date(body.scheduledAt),
        duration: body.duration || 60,
        type: body.type || 'VIDEO',
        status: 'SCHEDULED',
      },
    });
    return NextResponse.json(interview, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
