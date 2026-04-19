import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * POST /api/payments/webhook
 * Receives Stripe webhook events for payment status updates.
 * Configure in Stripe Dashboard: webhook URL = https://crm.inherenttech.com/api/payments/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature') || '';

    // Parse event (in production, verify signature with webhook secret)
    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const eventType = event.type;
    const data = event.data?.object;

    switch (eventType) {
      case 'invoice.paid': {
        // Find and update our invoice by stripePaymentId or invoice number
        if (data.metadata?.invoiceId) {
          await prisma.invoice.update({
            where: { id: data.metadata.invoiceId },
            data: {
              status: 'PAID',
              paidAt: new Date(),
              stripePaymentId: data.payment_intent,
            },
          });
        }
        break;
      }
      case 'invoice.payment_failed': {
        if (data.metadata?.invoiceId) {
          await prisma.invoice.update({
            where: { id: data.metadata.invoiceId },
            data: { status: 'OVERDUE' },
          });
        }
        break;
      }
      case 'checkout.session.completed': {
        // Handle successful checkout — could be job posting payment, subscription, etc.
        console.log(`[InherentPayments] Checkout completed: ${data.id}`);
        break;
      }
      case 'customer.subscription.deleted': {
        console.log(`[InherentPayments] Subscription cancelled: ${data.id}`);
        break;
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: data.metadata?.orgId || 'system',
        userId: '',
        action: `PAYMENT_${eventType.replace(/\./g, '_').toUpperCase()}`,
        entity: 'Payment',
        entityId: data.id || '',
        metadata: { type: eventType, provider: 'stripe' },
      },
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Payment webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
