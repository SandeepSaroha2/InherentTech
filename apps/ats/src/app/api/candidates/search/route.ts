import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * GET /api/candidates/search?q=react+typescript&visa=H1B&minRate=50&maxRate=100&minExp=3
 *
 * Advanced candidate search with:
 * - Full-text search across name, title, skills, location
 * - Visa status filter
 * - Rate range filter
 * - Experience range filter
 * - Skills matching
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = request.headers.get('x-org-id') || '';
    const q = searchParams.get('q') || '';
    const visa = searchParams.get('visa');
    const minRate = searchParams.get('minRate') ? parseFloat(searchParams.get('minRate')!) : undefined;
    const maxRate = searchParams.get('maxRate') ? parseFloat(searchParams.get('maxRate')!) : undefined;
    const minExp = searchParams.get('minExp') ? parseInt(searchParams.get('minExp')!) : undefined;
    const maxExp = searchParams.get('maxExp') ? parseInt(searchParams.get('maxExp')!) : undefined;
    const skills = searchParams.get('skills')?.split(',').filter(Boolean);
    const status = searchParams.get('status') || 'ACTIVE';
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { orgId };
    if (status) where.status = status;
    if (visa) where.visaStatus = visa;

    // Rate range
    if (minRate !== undefined || maxRate !== undefined) {
      where.expectedRate = {};
      if (minRate !== undefined) where.expectedRate.gte = minRate;
      if (maxRate !== undefined) where.expectedRate.lte = maxRate;
    }

    // Experience range
    if (minExp !== undefined || maxExp !== undefined) {
      where.yearsOfExperience = {};
      if (minExp !== undefined) where.yearsOfExperience.gte = minExp;
      if (maxExp !== undefined) where.yearsOfExperience.lte = maxExp;
    }

    // Skills filter
    if (skills?.length) {
      where.skills = { hasSome: skills };
    }

    // Text search
    if (q) {
      const terms = q.split(/\s+/).filter(Boolean);
      where.AND = terms.map(term => ({
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { currentTitle: { contains: term, mode: 'insensitive' } },
          { currentCompany: { contains: term, mode: 'insensitive' } },
          { location: { contains: term, mode: 'insensitive' } },
          { skills: { has: term } },
        ],
      }));
    }

    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: [
        { yearsOfExperience: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Score candidates based on search relevance
    const scored = candidates.map((c: any) => {
      let score = 0;
      const qLower = q.toLowerCase();
      if (c.currentTitle?.toLowerCase().includes(qLower)) score += 10;
      if (skills?.length) {
        const matched = skills.filter((s: string) => c.skills.some((cs: string) => cs.toLowerCase() === s.toLowerCase()));
        score += matched.length * 5;
      }
      if (c.yearsOfExperience && c.yearsOfExperience >= 5) score += 3;
      return { ...c, _relevanceScore: score };
    });

    scored.sort((a: any, b: any) => b._relevanceScore - a._relevanceScore);

    return NextResponse.json({
      data: scored,
      total: scored.length,
      query: { q, visa, minRate, maxRate, minExp, skills, status },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
