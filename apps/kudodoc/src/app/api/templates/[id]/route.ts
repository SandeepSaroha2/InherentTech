import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * GET /api/templates/:id
 * Get a single template with document count
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const template = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { documents: true } },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/templates/:id
 * Update a template (name, description, content, fields, category, isActive)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    // Verify template exists
    const existing = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = await prisma.documentTemplate.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description ? body.description.trim() : null }),
        ...(body.content && { content: body.content }),
        ...(body.fields !== undefined && { fields: body.fields }),
        ...(body.category !== undefined && { category: body.category ? body.category.trim() : null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { documents: true } },
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/templates/:id
 * Soft delete template by setting isActive to false
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const template = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const updated = await prisma.documentTemplate.update({
      where: { id: params.id },
      data: { isActive: false },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { documents: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
