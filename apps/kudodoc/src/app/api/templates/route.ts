import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * GET /api/templates
 * List document templates with filtering and pagination
 * Query params: category, active (boolean string), page, limit, search
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || 'default';
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { orgId };
    if (category) where.category = category;
    if (active !== null && active !== undefined) where.isActive = active === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.documentTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { documents: true } },
        },
      }),
      prisma.documentTemplate.count({ where }),
    ]);

    return NextResponse.json({
      data: templates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/templates
 * Create a new document template
 * Body: { name, description?, content, fields?, category? }
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || 'default';
    const userId = request.headers.get('x-user-id') || 'system';
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const template = await prisma.documentTemplate.create({
      data: {
        orgId,
        name: body.name.trim(),
        description: body.description ? body.description.trim() : null,
        content: body.content,
        fields: body.fields || null,
        category: body.category ? body.category.trim() : null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { documents: true } },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
