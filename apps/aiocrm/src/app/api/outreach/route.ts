import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

// GET /api/outreach — List outreach campaigns
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');

    const where: any = { orgId };
    if (status) where.status = status;
    if (channel) where.channel = channel;

    const campaigns = await prisma.outreachCampaign.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: campaigns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/outreach — Create and optionally launch a campaign via eCafy
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const body = await request.json();

    // Create campaign record in our database
    const campaign = await prisma.outreachCampaign.create({
      data: {
        orgId,
        name: body.name,
        channel: body.channel || 'EMAIL',
        status: 'DRAFT',
        templateSubject: body.subject,
        templateBody: body.body,
        targetCriteria: body.targetCriteria || {},
        createdById: body.userId,
      },
    });

    // If channel is EMAIL and auto-send requested, sync to eCafy
    if (body.channel === 'EMAIL' && body.autoSync) {
      try {
        // Dynamic import to avoid build errors if eCafy isn't configured
        const { createCampaign: ecafyCreate } = await import('@inherenttech/db');
        const ecafyResult = await ecafyCreate({
          name: body.name,
          subject: body.subject,
          body: body.body,
          fromName: body.fromName || 'InherentTech',
          fromEmail: body.fromEmail || 'outreach@inherenttech.com',
          trackOpens: true,
          trackClicks: true,
        });

        // Store eCafy campaign ID in metadata
        await prisma.outreachCampaign.update({
          where: { id: campaign.id },
          data: {
            targetCriteria: {
              ...body.targetCriteria,
              ecafyCampaignId: ecafyResult.id,
            },
          },
        });
      } catch (ecafyError: any) {
        console.warn('eCafy sync failed (non-blocking):', ecafyError.message);
      }
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
