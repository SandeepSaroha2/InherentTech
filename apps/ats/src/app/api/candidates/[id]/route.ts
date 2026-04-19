import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        submissions: {
          include: {
            jobOrder: { select: { id: true, title: true, status: true } },
            submittedBy: { select: { id: true, name: true } },
          },
          orderBy: { submittedAt: 'desc' },
        },
        interviews: { orderBy: { scheduledAt: 'desc' }, take: 10 },
        placements: { include: { jobOrder: { select: { id: true, title: true } } } },
      },
    });
    if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    return NextResponse.json(candidate);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const candidate = await prisma.candidate.update({ where: { id: params.id }, data: body });
    return NextResponse.json(candidate);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
