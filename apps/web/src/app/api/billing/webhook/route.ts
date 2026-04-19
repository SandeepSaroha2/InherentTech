import { NextRequest, NextResponse } from 'next/server';
import { getStripe, prisma } from '@inherenttech/db';
import type Stripe from 'stripe';

/**
 * POST /api/billing/webhook
 * Handles Stripe webhook events for subscription lifecycle management
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 * Creates/updates subscription in database
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const orgId = session.metadata?.orgId;
  const planId = session.metadata?.planId;
  const customerId = session.customer;

  if (!orgId || !planId || typeof customerId !== 'string') {
    console.error('Missing metadata in checkout session:', {
      orgId,
      planId,
      customerId,
    });
    return;
  }

  try {
    const stripe = getStripe();

    // Get the subscription details from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      console.error('No subscription found for customer:', customerId);
      return;
    }

    const stripeSubscription = subscriptions.data[0];

    // Update or create subscription in database
    await prisma.subscription.upsert({
      where: { orgId },
      update: {
        planId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSubscription.id,
        status: mapStripeSubscriptionStatus(
          stripeSubscription.status
        ),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
      create: {
        orgId,
        planId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSubscription.id,
        status: mapStripeSubscriptionStatus(
          stripeSubscription.status
        ),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    // Update organization plan field
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        plan: (await prisma.plan.findUnique({ where: { id: planId } }))
          ?.tier || 'free',
      },
    });

    console.log('Subscription created/updated:', {
      orgId,
      stripeSubscriptionId: stripeSubscription.id,
    });
  } catch (error: any) {
    console.error('Error handling checkout.session.completed:', error);
  }
}

/**
 * Handle subscription updates (plan changes, cancellation, etc.)
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const orgId = subscription.metadata?.orgId;

  if (!orgId) {
    console.error('Missing orgId in subscription metadata');
    return;
  }

  try {
    await prisma.subscription.update({
      where: { orgId },
      data: {
        status: mapStripeSubscriptionStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    console.log('Subscription updated:', {
      orgId,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('Error handling customer.subscription.updated:', error);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const orgId = subscription.metadata?.orgId;

  if (!orgId) {
    console.error('Missing orgId in subscription metadata');
    return;
  }

  try {
    await prisma.subscription.update({
      where: { orgId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Optionally downgrade organization to free plan
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        plan: 'free',
      },
    });

    console.log('Subscription cancelled:', { orgId });
  } catch (error: any) {
    console.error('Error handling customer.subscription.deleted:', error);
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) {
    return;
  }

  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        stripeSubscriptionId: String(invoice.subscription),
      },
    });

    if (subscription) {
      console.log('Invoice payment succeeded for subscription:', {
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
      });
    }
  } catch (error: any) {
    console.error('Error handling invoice.payment_succeeded:', error);
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) {
    return;
  }

  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        stripeSubscriptionId: String(invoice.subscription),
      },
    });

    if (subscription) {
      // Update subscription status to PAST_DUE
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'PAST_DUE',
        },
      });

      console.log('Invoice payment failed for subscription:', {
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
      });
    }
  } catch (error: any) {
    console.error('Error handling invoice.payment_failed:', error);
  }
}

/**
 * Map Stripe subscription status to internal SubscriptionStatus enum
 */
function mapStripeSubscriptionStatus(
  stripeStatus: string
): 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' {
  switch (stripeStatus) {
    case 'trialing':
      return 'TRIALING';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELLED';
    case 'incomplete':
    case 'incomplete_expired':
      return 'EXPIRED';
    default:
      return 'ACTIVE';
  }
}
