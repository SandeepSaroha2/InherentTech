import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

function getOrgIdFromRequest(req: NextRequest): string | null {
  const orgId = req.headers.get('x-org-id');
  return orgId;
}

// GET /api/billing/usage — Usage metrics for current period
export async function GET(req: NextRequest) {
  const orgId = getOrgIdFromRequest(req);

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
  }

  try {
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get subscription and plan limits
    const subscription = await prisma.subscription.findUnique({
      where: { orgId },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Get usage records for current month
    const usageRecords = await prisma.usageRecord.findMany({
      where: {
        orgId,
        period: currentPeriod,
      },
    });

    // Count actual usage
    const [userCount, candidateCount, jobOrderCount, documentCount] = await Promise.all([
      prisma.user.count({ where: { orgId } }),
      prisma.candidate.count({ where: { orgId } }),
      prisma.jobOrder.count({ where: { orgId } }),
      prisma.document.count({ where: { orgId } }),
    ]);

    // Email count for current month
    const emailCount = await prisma.emailLog.count({
      where: {
        orgId,
        createdAt: {
          gte: new Date(currentPeriod + '-01'),
          lt: new Date(new Date(currentPeriod + '-01').setMonth(new Date(currentPeriod + '-01').getMonth() + 1)),
        },
      },
    });

    // Agent runs count for current month
    const agentRunCount = await prisma.agentExecution.count({
      where: {
        orgId,
        createdAt: {
          gte: new Date(currentPeriod + '-01'),
          lt: new Date(new Date(currentPeriod + '-01').setMonth(new Date(currentPeriod + '-01').getMonth() + 1)),
        },
      },
    });

    // Estimate storage (placeholder - would need actual file tracking)
    const storageGb = 0.5; // Placeholder

    const metrics = {
      users: { used: userCount, limit: subscription.plan.maxUsers, percentage: (userCount / subscription.plan.maxUsers) * 100 },
      candidates: { used: candidateCount, limit: subscription.plan.maxCandidates, percentage: (candidateCount / subscription.plan.maxCandidates) * 100 },
      jobOrders: { used: jobOrderCount, limit: subscription.plan.maxJobOrders, percentage: (jobOrderCount / subscription.plan.maxJobOrders) * 100 },
      documents: { used: documentCount, limit: subscription.plan.maxDocuments, percentage: (documentCount / subscription.plan.maxDocuments) * 100 },
      emails: { used: emailCount, limit: subscription.plan.maxEmailsMonth, percentage: (emailCount / subscription.plan.maxEmailsMonth) * 100 },
      agentRuns: { used: agentRunCount, limit: subscription.plan.maxAgentRuns, percentage: subscription.plan.maxAgentRuns === 0 ? 0 : (agentRunCount / subscription.plan.maxAgentRuns) * 100 },
      storage: { used: storageGb, limit: subscription.plan.storageGb, percentage: (storageGb / subscription.plan.storageGb) * 100 },
    };

    return NextResponse.json({
      period: currentPeriod,
      metrics,
      quotaStatus: Object.values(metrics).map(m => ({ ...m, exceeded: m.used > m.limit })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
