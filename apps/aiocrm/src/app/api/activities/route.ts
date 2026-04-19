import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

// GET /api/activities — List activities for org with optional lead filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = request.headers.get('x-org-id') || '';
    const leadId = searchParams.get('leadId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { orgId };
    if (leadId) where.leadId = leadId;
    if (type) where.type = type;

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        lead: { select: { id: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ data: activities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/activities — Log a new activity
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const body = await request.json();

    const activity = await prisma.activity.create({
      data: {
        orgId,
        leadId: body.leadId,
        userId: body.userId,
        type: body.type,
        subject: body.subject,
        description: body.description,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
      },
      include: {
        user: { select: { id: true, name: true } },
        lead: { select: { id: true, companyName: true } },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
