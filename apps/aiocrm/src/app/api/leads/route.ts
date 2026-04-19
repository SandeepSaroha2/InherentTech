import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';
import { agentEvents } from '../../../lib/agent-hooks';

// GET /api/leads — List leads with filtering, sorting, pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = request.headers.get('x-org-id') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const stage = searchParams.get('stage');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: any = { orgId };
    if (stage) where.stage = stage;
    if (assignedTo) where.assignedToId = assignedTo;
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: { assignedTo: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      data: leads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/leads — Create a new lead
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const body = await request.json();

    const lead = await prisma.lead.create({
      data: {
        orgId,
        companyName: body.companyName,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        stage: body.stage || 'NEW',
        source: body.source,
        assignedToId: body.assignedToId,
        notes: body.notes,
        value: body.value,
      },
      include: { assignedTo: { select: { id: true, name: true } } },
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        orgId,
        userId: body.createdById || '',
        action: 'CREATE',
        entity: 'Lead',
        entityId: lead.id,
        metadata: { companyName: lead.companyName },
      },
    });

    // Trigger agent event for new lead
    agentEvents.leadCreated(
      {
        id: lead.id,
        companyName: lead.companyName,
        contactName: lead.contactName,
        contactEmail: lead.contactEmail,
        contactPhone: lead.contactPhone,
        source: lead.source,
        value: lead.value,
      },
      orgId,
      body.createdById || ''
    );

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
