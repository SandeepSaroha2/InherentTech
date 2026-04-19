import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

// Helper: Extract orgId from request context (middleware would set this)
function getOrgIdFromRequest(req: NextRequest): string | null {
  const orgId = req.headers.get('x-org-id');
  return orgId;
}

// GET /api/billing — Current subscription with plan details
export async function GET(req: NextRequest) {
  const orgId = getOrgIdFromRequest(req);

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { orgId },
      include: {
        plan: true,
        usageRecords: {
          where: {
            period: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        tier: subscription.plan.tier,
        price: subscription.plan.price,
        annualPrice: subscription.plan.annualPrice,
        limits: {
          maxUsers: subscription.plan.maxUsers,
          maxCandidates: subscription.plan.maxCandidates,
          maxJobOrders: subscription.plan.maxJobOrders,
          maxDocuments: subscription.plan.maxDocuments,
          maxEmailsMonth: subscription.plan.maxEmailsMonth,
          maxAgentRuns: subscription.plan.maxAgentRuns,
          storageGb: subscription.plan.storageGb,
        },
        features: subscription.plan.features,
      },
      usage: subscription.usageRecords.reduce((acc, record) => {
        acc[record.metric] = record.value;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/billing — Upgrade/downgrade plan
export async function PATCH(req: NextRequest) {
  const orgId = getOrgIdFromRequest(req);

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
  }

  const body = await req.json();
  const { planTier } = body;

  if (!planTier) {
    return NextResponse.json({ error: 'Plan tier required' }, { status: 400 });
  }

  try {
    // Get new plan
    const newPlan = await prisma.plan.findFirst({
      where: { tier: planTier, isActive: true },
    });

    if (!newPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Update subscription
    const subscription = await prisma.subscription.update({
      where: { orgId },
      data: {
        planId: newPlan.id,
        // In production, would trigger Stripe plan change here
      },
      include: { plan: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        action: 'SUBSCRIPTION_UPGRADED',
        entity: 'Subscription',
        entityId: subscription.id,
        metadata: { oldPlan: subscription.planId, newPlan: newPlan.id },
      },
    });

    return NextResponse.json({
      message: 'Subscription updated successfully',
      subscription: {
        id: subscription.id,
        plan: subscription.plan.name,
        tier: subscription.plan.tier,
        status: subscription.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
