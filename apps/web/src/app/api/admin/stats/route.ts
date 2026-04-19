import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

function isSuperAdmin(req: NextRequest): boolean {
  const adminToken = req.headers.get('x-admin-token');
  return adminToken === process.env.ADMIN_SECRET_TOKEN;
}

// GET /api/admin/stats — Platform-wide statistics
export async function GET(req: NextRequest) {
  if (!isSuperAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
  }

  try {
    const [
      totalOrgs,
      totalUsers,
      totalActiveSubscriptions,
      subscriptionsByStatus,
      subscriptionsByTier,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.subscription.findMany({
        include: { plan: true },
      }),
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    const mrrByPlan = subscriptionsByTier.reduce((acc, sub) => {
      const tier = sub.plan.tier;
      const price = sub.plan.price;
      if (!acc[tier]) acc[tier] = 0;
      acc[tier] += price;
      return acc;
    }, {} as Record<string, number>);

    const totalMrr = Object.values(mrrByPlan).reduce((a, b) => a + b, 0);

    // Distribution by plan tier
    const planDistribution = subscriptionsByTier.reduce((acc, sub) => {
      const tier = sub.plan.tier;
      if (!acc[tier]) acc[tier] = 0;
      acc[tier]++;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      platform: {
        totalOrganizations: totalOrgs,
        totalUsers,
        totalActiveSubscriptions,
      },
      subscriptions: {
        byStatus: subscriptionsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byTier: planDistribution,
        mrr: totalMrr,
        mrrByPlan,
      },
      topPlans: Object.entries(planDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tier, count]) => ({ tier, count })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
