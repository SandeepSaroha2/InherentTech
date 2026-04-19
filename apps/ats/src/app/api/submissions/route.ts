import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = request.headers.get('x-org-id') || '';
    const jobId = searchParams.get('jobId');
    const candidateId = searchParams.get('candidateId');
    const status = searchParams.get('status');

    const where: any = { orgId };
    if (jobId) where.jobOrderId = jobId;
    if (candidateId) where.candidateId = candidateId;
    if (status) where.status = status;

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true, email: true, visaStatus: true } },
        jobOrder: { select: { id: true, title: true } },
        submittedBy: { select: { id: true, name: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
    return NextResponse.json({ data: submissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const body = await request.json();

    // Resolve submittedById: the frontend sends the Supabase auth UID (body.submittedById)
    // which differs from the Prisma User.id. Resolve by email first (body.submittedByEmail),
    // then fall back to direct ID lookup, then fall back to the first RECRUITER in the org.
    let submittedById: string = body.submittedById || '';

    if (body.submittedByEmail) {
      const userByEmail = await prisma.user.findFirst({
        where: { email: body.submittedByEmail, orgId },
        select: { id: true },
      });
      if (userByEmail) submittedById = userByEmail.id;
    }

    if (!submittedById) {
      // Final fallback: first recruiter in the org
      const fallbackUser = await prisma.user.findFirst({
        where: { orgId },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      if (fallbackUser) submittedById = fallbackUser.id;
    }

    if (!submittedById) {
      return NextResponse.json({ error: 'Could not resolve submitting user' }, { status: 400 });
    }

    const submission = await prisma.submission.create({
      data: {
        orgId,
        candidateId: body.candidateId,
        jobOrderId: body.jobOrderId,
        submittedById,
        status: 'SUBMITTED',
        billRate: body.billRate,
        payRate: body.payRate,
        internalNotes: body.internalNotes,
        submittedAt: new Date(),
      },
    });
    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
