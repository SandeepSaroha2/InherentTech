import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = request.headers.get('x-org-id') || '';
    const placementId = searchParams.get('placementId');
    const status = searchParams.get('status');

    const where: any = { orgId };
    if (placementId) where.placementId = placementId;
    if (status) where.status = status;

    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        placement: {
          include: {
            candidate: { select: { firstName: true, lastName: true } },
            jobOrder: { select: { title: true } },
          },
        },
        approvedBy: { select: { name: true } },
      },
      orderBy: { weekStarting: 'desc' },
    });
    return NextResponse.json({ data: timesheets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const body = await request.json();
    const timesheet = await prisma.timesheet.create({
      data: {
        orgId,
        placementId: body.placementId,
        weekStarting: new Date(body.weekStarting),
        hours: body.hours,
        totalHours: body.totalHours,
        status: 'DRAFT',
      },
    });
    return NextResponse.json(timesheet, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
