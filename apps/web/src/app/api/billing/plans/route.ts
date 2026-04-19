import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

// GET /api/billing/plans — List all available plans
export async function GET(req: NextRequest) {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    return NextResponse.json({
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        description: plan.description,
        price: plan.price,
        annualPrice: plan.annualPrice,
        currency: plan.currency,
        features: plan.features,
        limits: {
          maxUsers: plan.maxUsers,
          maxCandidates: plan.maxCandidates,
          maxJobOrders: plan.maxJobOrders,
          maxDocuments: plan.maxDocuments,
          maxEmailsMonth: plan.maxEmailsMonth,
          maxAgentRuns: plan.maxAgentRuns,
          storageGb: plan.storageGb,
        },
        stripePriceId: plan.stripePriceId,
        stripeAnnualPriceId: plan.stripeAnnualPriceId,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
