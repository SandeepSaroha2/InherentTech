import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

// Helper: Check if user is super admin (in production, verify via auth middleware)
function isSuperAdmin(req: NextRequest): boolean {
  const adminToken = req.headers.get('x-admin-token');
  // In production, validate against env variable or auth service
  return adminToken === process.env.ADMIN_SECRET_TOKEN;
}

// GET /api/admin/orgs — List all organizations with subscription info
export async function GET(req: NextRequest) {
  if (!isSuperAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
  }

  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        skip,
        take: limit,
        include: {
          users: { select: { id: true, email: true, role: true } },
          subscription: {
            include: { plan: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organization.count(),
    ]);

    const data = organizations.map((org: any) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      createdAt: org.createdAt,
      userCount: org.users.length,
      users: org.users,
      subscription: org.subscription ? {
        id: org.subscription.id,
        plan: org.subscription.plan.name,
        tier: org.subscription.plan.tier,
        status: org.subscription.status,
        currentPeriodStart: org.subscription.currentPeriodStart,
        currentPeriodEnd: org.subscription.currentPeriodEnd,
        trialEndsAt: org.subscription.trialEndsAt,
        stripeCustomerId: org.subscription.stripeCustomerId,
      } : null,
    }));

    return NextResponse.json({
      organizations: data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
