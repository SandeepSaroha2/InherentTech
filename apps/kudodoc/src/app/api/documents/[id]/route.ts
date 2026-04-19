import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * GET /api/documents/:id
 * Get full document with template, signature requests, and audit trail
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        template: {
          select: { id: true, name: true, category: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        signatureRequests: {
          orderBy: { order: 'asc' },
          include: {
            signer: { select: { id: true, name: true, email: true } },
          },
        },
        documentAuditTrail: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/documents/:id
 * Update document (title, content, status)
 * Log status changes to audit trail
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const userEmail = request.headers.get('x-user-email') || 'system@inherenttech.ai';
    const userName = body.updatedByName || 'System';
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip || undefined;

    // Get current document to track status changes
    const currentDocument = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!currentDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.content !== undefined) updateData.content = body.content;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const document = await prisma.document.update({
      where: { id: params.id },
      data: updateData,
      include: {
        template: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        signatureRequests: {
          include: { signer: { select: { id: true, name: true, email: true } } },
        },
        documentAuditTrail: { orderBy: { createdAt: 'desc' } },
      },
    });

    // Log status change
    if (body.status && currentDocument.status !== body.status) {
      await prisma.documentAuditTrail.create({
        data: {
          documentId: document.id,
          orgId: currentDocument.orgId,
          action: `STATUS_CHANGED_TO_${body.status}`,
          actorEmail: userEmail,
          actorName: userName,
          ipAddress,
          metadata: {
            oldStatus: currentDocument.status,
            newStatus: body.status,
          },
        },
      });
    }

    // Log other updates
    if (body.title || body.content) {
      const changes: any = {};
      if (body.title) changes.titleUpdated = true;
      if (body.content) changes.contentUpdated = true;

      await prisma.documentAuditTrail.create({
        data: {
          documentId: document.id,
          orgId: currentDocument.orgId,
          action: 'UPDATED',
          actorEmail: userEmail,
          actorName: userName,
          ipAddress,
          metadata: changes,
        },
      });
    }

    return NextResponse.json(document);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/:id
 * Delete document only if status is DRAFT
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot delete document with status: ${document.status}. Only DRAFT documents can be deleted.` },
        { status: 400 }
      );
    }

    // Delete audit trail entries first (cascade)
    await prisma.documentAuditTrail.deleteMany({
      where: { documentId: params.id },
    });

    // Delete signature requests (cascade)
    await prisma.signatureRequest.deleteMany({
      where: { documentId: params.id },
    });

    // Delete document
    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Document deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
