import { NextRequest, NextResponse } from 'next/server';
import { prisma, getStripe } from '@inherenttech/db';

// Helper: Extract orgId from request context (middleware would set this)
function getOrgIdFromRequest(req: NextRequest): string | null {
  const orgId = req.headers.get('x-org-id');
  return orgId;
}

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session for plan upgrade
 *
 * Request body:
 * {
 *   planId: string;
 *   billingCycle?: 'monthly' | 'annual'; // defaults to 'monthly'
 * }
 */
export async function POST(req: NextRequest) {
  const orgId = getOrgIdFromRequest(req);

  if (!orgId) {
    return NextResponse.json(
      { error: 'Organization ID required' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { planId, billingCycle = 'monthly' } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      );
    }

    // Get the plan and verify it exists
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { subscription: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    let stripeCustomerId = organization.subscription?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        metadata: {
          orgId,
          orgName: organization.name,
        },
      });
      stripeCustomerId = customer.id;

      // Update subscription record with customer ID
      if (organization.subscription) {
        await prisma.subscription.update({
          where: { id: organization.subscription.id },
          data: { stripeCustomerId },
        });
      }
    }

    // Get the appropriate Stripe price ID
    let stripePriceId: string | null = null;
    if (billingCycle === 'annual' && plan.stripeAnnualPriceId) {
      stripePriceId = plan.stripeAnnualPriceId;
    } else if (plan.stripePriceId) {
      stripePriceId = plan.stripePriceId;
    }

    if (!stripePriceId) {
      return NextResponse.json(
        { error: 'Plan does not have Stripe pricing configured' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${req.nextUrl.origin}/dashboard/billing?success=true&sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/dashboard/billing?canceled=true`,
      metadata: {
        orgId,
        planId,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
