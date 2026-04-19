/**
 * GET  /api/settings  — fetch org-level settings
 * PATCH /api/settings — update org-level settings (merges partial JSON)
 *
 * Known settings keys:
 *   autoPostCeipal  boolean  — auto-post job orders to Ceipal when detected by poller
 *   currency        string   — e.g. "USD"
 *   timezone        string   — e.g. "America/New_York"
 *   defaultPayRate  number
 *   defaultBillRate number
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

export async function GET(request: NextRequest) {
  const orgId = request.headers.get('x-org-id') || '';
  if (!orgId) return NextResponse.json({ error: 'x-org-id required' }, { status: 400 });

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, plan: true, settings: true },
  });
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  // Merge defaults so callers always get full shape
  const defaults = {
    autoPostCeipal:  false,
    currency:        'USD',
    timezone:        'America/New_York',
    defaultPayRate:  55,
    defaultBillRate: 85,
  };

  return NextResponse.json({
    orgId:    org.id,
    orgName:  org.name,
    plan:     org.plan,
    settings: { ...defaults, ...(org.settings as Record<string, any> || {}) },
  });
}

export async function PATCH(request: NextRequest) {
  const orgId = request.headers.get('x-org-id') || '';
  if (!orgId) return NextResponse.json({ error: 'x-org-id required' }, { status: 400 });

  const body = await request.json();
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'JSON body required' }, { status: 400 });
  }

  // Read current settings, then deep-merge the patch
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { settings: true },
  });
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  const current = (org.settings as Record<string, any>) || {};
  const updated = { ...current, ...body };

  await prisma.organization.update({
    where: { id: orgId },
    data:  { settings: updated },
  });

  return NextResponse.json({ success: true, settings: updated });
}
