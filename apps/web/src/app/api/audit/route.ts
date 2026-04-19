import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

// GET /api/audit — Query audit logs with filters
export async function GET(req: NextRequest) {
  const orgId = req.headers.get('x-org-id') || 'default';
  const { searchParams } = new URL(req.url);
  const entity = searchParams.get('entity');
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where: any = { orgId };
  if (entity) where.entity = entity;
  if (action) where.action = { contains: action };
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
