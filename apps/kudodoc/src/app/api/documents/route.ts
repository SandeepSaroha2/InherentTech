import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * Helper function to interpolate template variables
 * Replaces {{fieldName}} with values from fieldValues object
 */
function interpolateTemplate(template: string, fieldValues?: Record<string, any>): string {
  if (!fieldValues) return template;

  let result = template;
  for (const [key, value] of Object.entries(fieldValues)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }
  return result;
}

/**
 * GET /api/documents
 * List documents with filtering, search, and pagination
 * Query params: status, templateId, search, page, limit, sortBy, sortOrder
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || 'default';
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const templateId = searchParams.get('templateId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: any = { orgId };
    if (status) where.status = status;
    if (templateId) where.templateId = templateId;
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          template: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { signatureRequests: true, documentAuditTrail: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      data: documents,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/documents
 * Create a new document, optionally from a template
 * Body: { title, content?, templateId?, fieldValues?, expiresAt? }
 * If templateId is provided, fetches template and interpolates {{field}} placeholders
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || 'default';
    const userId = request.headers.get('x-user-id') || 'system';
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let content = body.content || '';

    // If templateId provided, fetch template and interpolate
    if (body.templateId) {
      const template = await prisma.documentTemplate.findUnique({
        where: { id: body.templateId },
      });

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      // Interpolate template with field values
      content = interpolateTemplate(template.content, body.fieldValues);
    }

    const document = await prisma.document.create({
      data: {
        orgId,
        templateId: body.templateId || null,
        title: body.title.trim(),
        content,
        status: 'DRAFT',
        fileUrl: body.fileUrl || null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdById: userId,
      },
      include: {
        template: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { signatureRequests: true, documentAuditTrail: true } },
      },
    });

    // Create initial audit trail entry
    await prisma.documentAuditTrail.create({
      data: {
        documentId: document.id,
        orgId,
        action: 'CREATED',
        actorEmail: request.headers.get('x-user-email') || 'system@inherenttech.ai',
        actorName: body.createdByName || 'System',
        ipAddress: request.headers.get('x-forwarded-for') || request.ip || undefined,
        metadata: { templateId: body.templateId, title: body.title },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
