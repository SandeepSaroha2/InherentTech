import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.jobOrder.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        location: true,
        description: true,
        requirements: true,
        rateRange: true,
        openings: true,
        filled: true,
        createdAt: true,
        status: true,
      },
    });

    if (!job || job.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Job not found or not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...job,
      availableOpenings: job.openings - job.filled,
      postedDate: job.createdAt,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}
