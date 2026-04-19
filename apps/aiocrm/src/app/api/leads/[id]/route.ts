import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';
import { agentEvents } from '../../../../lib/agent-hooks';

// GET /api/leads/:id — Get single lead with activities
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: { id: true, name: true } } },
        },
        jobOrders: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, status: true, priority: true, openings: true, filled: true },
        },
      },
    });

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/leads/:id — Update lead
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const orgId = request.headers.get('x-org-id') || '';

    // Get current lead to track stage change
    const currentLead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        ...(body.companyName && { companyName: body.companyName }),
        ...(body.contactName && { contactName: body.contactName }),
        ...(body.contactEmail && { contactEmail: body.contactEmail }),
        ...(body.contactPhone && { contactPhone: body.contactPhone }),
        ...(body.stage && { stage: body.stage }),
        ...(body.source && { source: body.source }),
        ...(body.assignedToId !== undefined && { assignedToId: body.assignedToId }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.value !== undefined && { value: body.value }),
      },
      include: { assignedTo: { select: { id: true, name: true } } },
    });

    // Log stage change
    if (body.stage) {
      await prisma.auditLog.create({
        data: {
          orgId,
          userId: body.updatedById || '',
          action: 'STAGE_CHANGE',
          entity: 'Lead',
          entityId: lead.id,
          metadata: { newStage: body.stage },
        },
      });

      // Trigger agent event for stage change
      if (currentLead && currentLead.stage !== body.stage) {
        agentEvents.leadStageChanged(
          lead.id,
          currentLead.stage,
          body.stage,
          {
            companyName: lead.companyName,
            contactName: lead.contactName,
            contactEmail: lead.contactEmail,
          },
          orgId,
          body.updatedById || ''
        );
      }
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/leads/:id
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.lead.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
