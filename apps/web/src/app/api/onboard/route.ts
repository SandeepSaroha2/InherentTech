import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

// POST /api/onboard — Create new org, user, and trial subscription
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orgName, adminEmail, adminName, password, planTier } = body;

  if (!orgName || !adminEmail || !adminName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Check for existing org/user
    const existingUser = await prisma.user.findFirst({ where: { email: adminEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Get the requested plan (default to FREE)
    const plan = await prisma.plan.findFirst({
      where: { tier: planTier || 'FREE', isActive: true },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Create organization
    const org = await prisma.organization.create({
      data: {
        name: orgName,
        slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      },
    });

    // Create admin user
    const user = await prisma.user.create({
      data: {
        orgId: org.id,
        email: adminEmail,
        name: adminName,
        role: 'OWNER',
      },
    });

    // Create trial subscription (14-day trial)
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        orgId: org.id,
        planId: plan.id,
        status: 'TRIALING',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: trialEnd,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId: org.id,
        userId: user.id,
        action: 'ORG_CREATED',
        entity: 'Organization',
        entityId: org.id,
        metadata: { planTier: plan.tier, trialEndsAt: trialEnd.toISOString() },
      },
    });

    return NextResponse.json({
      message: 'Organization created successfully',
      org: { id: org.id, name: org.name, slug: org.slug },
      user: { id: user.id, email: user.email, role: user.role },
      subscription: {
        id: subscription.id,
        plan: plan.name,
        tier: plan.tier,
        status: subscription.status,
        trialEndsAt: trialEnd.toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
