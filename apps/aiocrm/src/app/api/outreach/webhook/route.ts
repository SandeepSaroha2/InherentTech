import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * POST /api/outreach/webhook
 * Receives webhook events from eCafy when emails are opened, clicked, replied, bounced, etc.
 * Configure in eCafy: webhook URL = https://crm.inherenttech.com/api/outreach/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body.event;
    const email = body.email || body.recipient;
    const campaignId = body.campaign_id || body.campaignId;
    const timestamp = body.timestamp || new Date().toISOString();

    if (!event || !email) {
      return NextResponse.json({ error: 'Missing event or email' }, { status: 400 });
    }

    // Find the matching outreach message
    const message = await prisma.outreachMessage.findFirst({
      where: {
        recipientEmail: email,
        campaign: {
          targetCriteria: { path: ['ecafyCampaignId'], equals: campaignId },
        },
      },
    });

    if (message) {
      const updates: any = {};

      switch (event) {
        case 'sent':
        case 'delivered':
          updates.status = 'DELIVERED';
          updates.sentAt = new Date(timestamp);
          break;
        case 'opened':
          updates.status = 'OPENED';
          updates.openedAt = new Date(timestamp);
          // Update campaign open count
          await prisma.outreachCampaign.update({
            where: { id: message.campaignId },
            data: { openCount: { increment: 1 } },
          });
          break;
        case 'clicked':
          updates.status = 'OPENED'; // Keep as opened
          break;
        case 'replied':
          updates.status = 'REPLIED';
          updates.repliedAt = new Date(timestamp);
          await prisma.outreachCampaign.update({
            where: { id: message.campaignId },
            data: { replyCount: { increment: 1 } },
          });
          break;
        case 'bounced':
          updates.status = 'BOUNCED';
          break;
        case 'unsubscribed':
        case 'complained':
          updates.status = 'FAILED';
          break;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.outreachMessage.update({
          where: { id: message.id },
          data: updates,
        });
      }
    }

    // Log the webhook event regardless
    await prisma.auditLog.create({
      data: {
        orgId: message?.orgId || 'unknown',
        userId: '',
        action: `ECAFY_${event.toUpperCase()}`,
        entity: 'OutreachMessage',
        entityId: message?.id || '',
        metadata: { email, campaignId, event, timestamp },
      },
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('eCafy webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
