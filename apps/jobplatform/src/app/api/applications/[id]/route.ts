import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const email = req.headers.get('x-user-email');

    if (!email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        updatedAt: true,
        candidate: {
          select: { email: true },
        },
        jobOrder: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Verify the user is the applicant
    if (submission.candidate.email !== email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: submission.id,
      status: submission.status,
      submittedAt: submission.submittedAt,
      jobTitle: submission.jobOrder.title,
      lastUpdate: submission.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}
