import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

// GET /api/dashboard — Dashboard KPIs and pipeline data
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';

    const [
      totalLeads,
      leadsByStage,
      recentActivities,
      pipelineValue,
      newLeadsThisMonth,
      wonThisMonth,
    ] = await Promise.all([
      // Total active leads
      prisma.lead.count({ where: { orgId } }),

      // Leads grouped by stage
      prisma.lead.groupBy({
        by: ['stage'],
        where: { orgId },
        _count: true,
        _sum: { value: true },
      }),

      // Recent activities
      prisma.activity.findMany({
        where: { orgId },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          lead: { select: { id: true, companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Total pipeline value
      prisma.lead.aggregate({
        where: { orgId, stage: { notIn: ['WON', 'LOST'] } },
        _sum: { value: true },
      }),

      // New leads this month
      prisma.lead.count({
        where: {
          orgId,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),

      // Won this month
      prisma.lead.count({
        where: {
          orgId,
          stage: 'WON',
          updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ]);

    return NextResponse.json({
      kpis: {
        totalLeads,
        pipelineValue: pipelineValue._sum.value || 0,
        newLeadsThisMonth,
        wonThisMonth,
      },
      pipeline: leadsByStage.map((s: any) => ({
        stage: s.stage,
        count: s._count,
        value: s._sum.value || 0,
      })),
      recentActivities,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
