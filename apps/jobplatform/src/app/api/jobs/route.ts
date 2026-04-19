import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const location = searchParams.get('location');
    const type = searchParams.get('type'); // FULL_TIME, CONTRACT, PART_TIME
    const skills = searchParams.get('skills'); // comma-separated
    const remote = searchParams.get('remote');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      status: 'OPEN', // Only show open jobs publicly
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requirements: { hasSome: [search] } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (skills) {
      // Jobs that mention any of the provided skills in requirements
      const skillArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillArray.length > 0) {
        where.requirements = { hasSome: skillArray };
      }
    }

    if (remote === 'true') {
      where.location = { contains: 'Remote', mode: 'insensitive' };
    }

    const [jobs, total] = await Promise.all([
      prisma.jobOrder.findMany({
        where,
        select: {
          id: true,
          title: true,
          location: true,
          description: true,
          requirements: true,
          rateRange: true,
          openings: true,
          filled: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobOrder.count({ where }),
    ]);

    return NextResponse.json({
      jobs: jobs.map((job: any) => ({
        ...job,
        availableOpenings: job.openings - job.filled,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
