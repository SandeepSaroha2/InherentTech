import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

// GET /api/audit/export — Export audit logs as CSV for compliance
export async function GET(req: NextRequest) {
  const orgId = req.headers.get('x-org-id') || 'default';
  const { searchParams } = new URL(req.url);
  const entity = searchParams.get('entity');
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: any = { orgId };
  if (entity) where.entity = entity;
  if (action) where.action = { contains: action };
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });

  // Convert to CSV
  const headers = ['Timestamp', 'Entity', 'Action', 'User Name', 'User Email', 'IP Address', 'Metadata'];
  const rows = logs.map(log => [
    log.createdAt.toISOString(),
    log.entity,
    log.action,
    log.user?.name || 'Unknown',
    log.user?.email || 'Unknown',
    log.ipAddress || 'Unknown',
    JSON.stringify(log.metadata || {}),
  ]);

  const csv = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  // Stream response as CSV file
  const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
