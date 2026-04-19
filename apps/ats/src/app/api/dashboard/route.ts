import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';

    const [
      activeCandidates,
      openJobs,
      pendingSubmissions,
      activePlacements,
      upcomingInterviews,
      recentSubmissions,
    ] = await Promise.all([
      prisma.candidate.count({ where: { orgId, status: 'ACTIVE' } }),
      prisma.jobOrder.count({ where: { orgId, status: 'OPEN' } }),
      prisma.submission.count({ where: { orgId, status: { in: ['SUBMITTED', 'CLIENT_REVIEW'] } } }),
      prisma.placement.count({ where: { orgId, status: 'ACTIVE' } }),
      prisma.interview.findMany({
        where: { orgId, scheduledAt: { gte: new Date() }, status: 'SCHEDULED' },
        include: {
          candidate: { select: { firstName: true, lastName: true } },
          submission: { include: { jobOrder: { select: { title: true } } } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
      prisma.submission.findMany({
        where: { orgId },
        include: {
          candidate: { select: { firstName: true, lastName: true } },
          jobOrder: { select: { title: true } },
          submittedBy: { select: { name: true } },
        },
        orderBy: { submittedAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      kpis: { activeCandidates, openJobs, pendingSubmissions, activePlacements },
      upcomingInterviews,
      recentSubmissions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
