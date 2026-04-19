import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * GET /api/email/stats
 * Get email analytics and metrics
 *
 * Query params:
 * - period?: 'day' | 'week' | 'month' | 'all' (default: 'month')
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
    }

    // Build where clause
    const where: any = {
      orgId,
      createdAt: { gte: startDate },
    };

    // Query email logs
    const logs = await prisma.emailLog.findMany({
      where,
      select: {
        id: true,
        status: true,
      },
    });

    // Calculate stats
    const totalSent = logs.length;
    const totalDelivered = logs.filter(l => l.status === 'sent').length;
    const totalFailed = logs.filter(l => l.status === 'failed').length;
    const totalQueued = logs.filter(l => l.status === 'queued').length;

    // Calculate rates
    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0.0';
    const failureRate = totalSent > 0 ? ((totalFailed / totalSent) * 100).toFixed(1) : '0.0';

    // Get status breakdown
    const statusBreakdown = await prisma.emailLog.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    return NextResponse.json({
      period,
      dateRange: { start: startDate.toISOString(), end: now.toISOString() },
      summary: {
        totalSent,
        totalDelivered,
        totalFailed,
        totalQueued,
        deliveryRate: parseFloat(deliveryRate),
        failureRate: parseFloat(failureRate),
      },
      byStatus: statusBreakdown.map(s => ({
        status: s.status,
        count: s._count,
      })),
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('Email stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email stats' },
      { status: 500 }
    );
  }
}
