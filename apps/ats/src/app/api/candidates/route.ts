import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';
import { agentEvents } from '../../../lib/agent-hooks';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = request.headers.get('x-org-id') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const visa = searchParams.get('visa');
    const search = searchParams.get('search');
    const skills = searchParams.get('skills')?.split(',').filter(Boolean);

    const where: any = { orgId };
    if (status) where.status = status;
    if (visa) where.visaStatus = visa;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { currentTitle: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (skills?.length) where.skills = { hasSome: skills };

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.candidate.count({ where }),
    ]);

    return NextResponse.json({ data: candidates, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const userId = request.headers.get('x-user-id') || '';
    const body = await request.json();
    const candidate = await prisma.candidate.create({
      data: {
        orgId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        visaStatus: body.visaStatus || 'OTHER',
        currentTitle: body.currentTitle,
        currentCompany: body.currentCompany,
        skills: body.skills || [],
        yearsOfExperience: body.yearsOfExperience,
        expectedRate: body.expectedRate,
        resumeUrl: body.resumeUrl,
        linkedinUrl: body.linkedinUrl,
        location: body.location,
        source: body.source,
        notes: body.notes,
        status: 'ACTIVE',
      },
    });

    // Trigger agent event for new candidate
    agentEvents.candidateCreated(
      {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone ?? undefined,
        currentTitle: candidate.currentTitle ?? undefined,
        currentCompany: candidate.currentCompany ?? undefined,
        skills: candidate.skills,
        yearsOfExperience: candidate.yearsOfExperience ?? undefined,
      },
      orgId,
      userId
    );

    return NextResponse.json(candidate, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
