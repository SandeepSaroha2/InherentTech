import { NextRequest, NextResponse } from 'next/server';
import { prisma, getStripe } from '@inherenttech/db';

// Helper: Extract orgId from request context (middleware would set this)
function getOrgIdFromRequest(req: NextRequest): string | null {
  const orgId = req.headers.get('x-org-id');
  return orgId;
}

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session for managing subscription
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
    // Get subscription with Stripe customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { orgId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (!subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer associated with this organization' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Create Stripe Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${req.nextUrl.origin}/dashboard/billing`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
