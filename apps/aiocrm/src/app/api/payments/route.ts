import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

// GET /api/payments — Payment overview for CRM
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';

    const [
      totalInvoiced,
      totalPaid,
      overdueInvoices,
      recentInvoices,
    ] = await Promise.all([
      prisma.invoice.aggregate({ where: { orgId }, _sum: { totalAmount: true } }),
      prisma.invoice.aggregate({ where: { orgId, status: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.invoice.count({ where: { orgId, status: 'OVERDUE' } }),
      prisma.invoice.findMany({
        where: { orgId },
        include: {
          placement: {
            include: {
              candidate: { select: { firstName: true, lastName: true } },
              jobOrder: { select: { title: true, client: { select: { companyName: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      kpis: {
        totalInvoiced: totalInvoiced._sum.totalAmount || 0,
        totalPaid: totalPaid._sum.totalAmount || 0,
        outstanding: (Number(totalInvoiced._sum.totalAmount || 0) - Number(totalPaid._sum.totalAmount || 0)),
        overdueCount: overdueInvoices,
      },
      recentInvoices,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
