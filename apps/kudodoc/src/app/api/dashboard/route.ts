import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * GET /api/dashboard
 * Get KPIs for KudoDoc dashboard
 * Returns: totalDocuments, pendingSignatures, completedToday, totalTemplates,
 *          recentDocuments (last 5), pendingSignatureRequests (next 5)
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || 'default';

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Parallel queries for performance
    const [
      totalDocuments,
      pendingSignatures,
      completedToday,
      totalTemplates,
      recentDocuments,
      pendingSignatureRequests,
      documentsByStatus,
      templatesByCategory,
    ] = await Promise.all([
      // Total documents count
      prisma.document.count({ where: { orgId } }),

      // Pending signatures count
      prisma.signatureRequest.count({
        where: { orgId, status: 'PENDING' },
      }),

      // Documents completed today
      prisma.document.count({
        where: {
          orgId,
          status: 'COMPLETED',
          updatedAt: { gte: today, lt: tomorrow },
        },
      }),

      // Total templates
      prisma.documentTemplate.count({
        where: { orgId, isActive: true },
      }),

      // Recent documents (last 5)
      prisma.document.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          createdBy: { select: { name: true, email: true } },
          _count: { select: { signatureRequests: true } },
        },
      }),

      // Pending signature requests (next 5 by createdAt)
      prisma.signatureRequest.findMany({
        where: { orgId, status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 5,
        include: {
          document: { select: { id: true, title: true } },
        },
      }),

      // Documents grouped by status
      prisma.document.groupBy({
        by: ['status'],
        where: { orgId },
        _count: { id: true },
      }),

      // Templates grouped by category
      prisma.documentTemplate.groupBy({
        by: ['category'],
        where: { orgId, isActive: true },
        _count: { id: true },
      }),
    ]);

    // Format status breakdown
    const statusBreakdown = documentsByStatus.reduce(
      (acc: Record<string, number>, item: { status: string; _count: { id: number } }) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Format category breakdown
    const categoryBreakdown = templatesByCategory.reduce(
      (acc: Record<string, number>, item: { category: string | null; _count: { id: number } }) => {
        const category = item.category || 'Uncategorized';
        acc[category] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate signature completion rate
    const totalSignatureRequests = await prisma.signatureRequest.count({
      where: { orgId },
    });

    const completedSignatures = await prisma.signatureRequest.count({
      where: { orgId, status: 'SIGNED' },
    });

    const signatureCompletionRate =
      totalSignatureRequests > 0
        ? Math.round((completedSignatures / totalSignatureRequests) * 100)
        : 0;

    return NextResponse.json({
      kpis: {
        totalDocuments,
        pendingSignatures,
        completedToday,
        totalTemplates,
        signatureCompletionRate,
        totalSignatureRequests,
        completedSignatures,
      },
      breakdown: {
        byStatus: statusBreakdown,
        byCategory: categoryBreakdown,
      },
      recent: {
        documents: recentDocuments,
        pendingSignatures: pendingSignatureRequests,
      },
      timestamp: new Date(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
