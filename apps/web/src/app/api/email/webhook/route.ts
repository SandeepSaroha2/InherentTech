import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * POST /api/email/webhook
 * Handle Resend webhook events (delivery, bounce, complaint, click, open)
 *
 * Resend sends webhooks for:
 * - email.sent: Email was sent
 * - email.delivered: Email was delivered to recipient's server
 * - email.delivery_delayed: Delivery was delayed
 * - email.bounced: Email bounced (hard or soft)
 * - email.complained: Recipient marked as spam
 * - email.opened: Recipient opened the email
 * - email.clicked: Recipient clicked a link
 *
 * Webhook signature verification should be enabled in Resend dashboard.
 */

interface ResendWebhookEvent {
  type: string;
  id: string;
  created_at: string;
  data?: {
    email_id: string;
    from_email: string;
    to_email: string;
    created_at?: string;
    email?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResendWebhookEvent;

    // Log all webhook events for debugging
    console.log('[Resend Webhook]', {
      type: body.type,
      id: body.id,
      createdAt: body.created_at,
      emailId: body.data?.email_id,
    });

    // Extract message ID (email_id from Resend)
    const messageId = body.data?.email_id;
    if (!messageId) {
      console.warn('[Resend Webhook] No email_id in webhook data');
      return NextResponse.json({ success: true });
    }

    // Update email log based on event type
    switch (body.type) {
      case 'email.sent':
        await prisma.emailLog.updateMany({
          where: { resendId: messageId },
          data: { status: 'sent' },
        }).catch(err => {
          console.error('[Resend Webhook] Failed to update sent status:', err);
        });
        break;

      case 'email.delivered':
        await prisma.emailLog.updateMany({
          where: { resendId: messageId },
          data: { status: 'delivered' },
        }).catch(err => {
          console.error('[Resend Webhook] Failed to update delivered status:', err);
        });
        break;

      case 'email.bounced':
        await prisma.emailLog.updateMany({
          where: { resendId: messageId },
          data: { status: 'bounced' },
        }).catch(err => {
          console.error('[Resend Webhook] Failed to update bounced status:', err);
        });
        break;

      case 'email.complained':
        await prisma.emailLog.updateMany({
          where: { resendId: messageId },
          data: { status: 'complained' },
        }).catch(err => {
          console.error('[Resend Webhook] Failed to update complained status:', err);
        });
        break;

      case 'email.delivery_delayed':
        await prisma.emailLog.updateMany({
          where: { resendId: messageId },
          data: { status: 'delayed' },
        }).catch(err => {
          console.error('[Resend Webhook] Failed to update delayed status:', err);
        });
        break;

      case 'email.opened':
        // Update OutreachMessage if this is a campaign email
        await prisma.outreachMessage.updateMany({
          where: { id: messageId },
          data: { openedAt: new Date() },
        }).catch(err => {
          console.error('[Resend Webhook] Failed to update open status:', err);
        });
        break;

      case 'email.clicked':
        // Track click events (could extend OutreachMessage with clickedAt field in future)
        console.log('[Resend Webhook] Email clicked:', messageId);
        break;

      default:
        console.warn('[Resend Webhook] Unknown event type:', body.type);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Resend Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * Verify webhook signature from Resend
 * (Optional but recommended for production)
 *
 * Setup instructions:
 * 1. Go to Resend dashboard > Webhooks
 * 2. Copy the webhook signing secret
 * 3. Add to .env: RESEND_WEBHOOK_SECRET="whsec_..."
 * 4. Uncomment the verification code below
 */

// import crypto from 'crypto';
//
// function verifyResendSignature(request: NextRequest, body: string): boolean {
//   const signature = request.headers.get('x-resend-signature') || '';
//   const secret = process.env.RESEND_WEBHOOK_SECRET || '';
//
//   if (!secret) {
//     console.warn('[Resend Webhook] RESEND_WEBHOOK_SECRET not set');
//     return true; // In development, allow without verification
//   }
//
//   const hash = crypto
//     .createHmac('sha256', secret)
//     .update(body)
//     .digest('hex');
//
//   return signature === `sha256=${hash}`;
// }
