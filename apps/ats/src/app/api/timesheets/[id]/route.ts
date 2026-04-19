import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

// PATCH /api/timesheets/:id — Submit, approve, reject
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updates: any = {};

    if (body.action === 'submit') {
      updates.status = 'SUBMITTED';
      updates.submittedAt = new Date();
    } else if (body.action === 'approve') {
      updates.status = 'APPROVED';
      updates.approvedById = body.approvedById;
      updates.approvedAt = new Date();
    } else if (body.action === 'reject') {
      updates.status = 'REJECTED';
    } else if (body.hours) {
      updates.hours = body.hours;
      updates.totalHours = body.totalHours;
    }

    const timesheet = await prisma.timesheet.update({ where: { id: params.id }, data: updates });
    return NextResponse.json(timesheet);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
