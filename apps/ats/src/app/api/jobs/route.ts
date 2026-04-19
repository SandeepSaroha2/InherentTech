import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';
import { agentEvents } from '../../../lib/agent-hooks';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = request.headers.get('x-org-id') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const where: any = { orgId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const jobs = await prisma.jobOrder.findMany({
      where,
      include: {
        client: { select: { id: true, companyName: true } },
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ data: jobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const userId = request.headers.get('x-user-id') || '';
    const body = await request.json();
    const job = await prisma.jobOrder.create({
      data: {
        orgId,
        clientId: body.clientId,
        title: body.title,
        description: body.description,
        requirements: body.requirements || [],
        location: body.location,
        rateRange: body.rateRange,
        openings: body.openings || 1,
        priority: body.priority || 'MEDIUM',
        status: 'OPEN',
        assignedToId: body.assignedToId,
      },
    });

    // Trigger agent event for new job order
    agentEvents.jobOrderCreated(
      {
        id: job.id,
        clientId: job.clientId,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        location: job.location,
        rateRange: job.rateRange,
        openings: job.openings,
        priority: job.priority,
      },
      orgId,
      userId
    );

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
