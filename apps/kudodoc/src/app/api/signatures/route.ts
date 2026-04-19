import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * GET /api/signatures
 * List signature requests for organization
 * Query params: status, documentId, page, limit, sortBy, sortOrder
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || 'default';
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const documentId = searchParams.get('documentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: any = { orgId };
    if (status) where.status = status;
    if (documentId) where.documentId = documentId;

    const [signatures, total] = await Promise.all([
      prisma.signatureRequest.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          document: { select: { id: true, title: true, status: true } },
          signer: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.signatureRequest.count({ where }),
    ]);

    return NextResponse.json({
      data: signatures,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/signatures
 * Create signature request(s) for a document
 * Body: { documentId, signers: [{ email, name, order }] }
 * Updates document status to PENDING_SIGNATURE
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || 'default';
    const body = await request.json();
    const userEmail = request.headers.get('x-user-email') || 'system@inherenttech.ai';
    const userName = body.requestedByName || 'System';
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip || undefined;

    if (!body.documentId || !body.signers || !Array.isArray(body.signers)) {
      return NextResponse.json(
        { error: 'documentId and signers array are required' },
        { status: 400 }
      );
    }

    if (body.signers.length === 0) {
      return NextResponse.json({ error: 'At least one signer is required' }, { status: 400 });
    }

    // Verify document exists
    const document = await prisma.document.findUnique({
      where: { id: body.documentId },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Create signature requests
    const signatureRequests = await Promise.all(
      body.signers.map((signer: any, index: number) =>
        prisma.signatureRequest.create({
          data: {
            orgId,
            documentId: body.documentId,
            signerEmail: signer.email.toLowerCase().trim(),
            signerName: signer.name?.trim() || null,
            signerId: signer.userId || null,
            order: signer.order !== undefined ? signer.order : index,
            status: 'PENDING',
          },
          include: {
            document: { select: { id: true, title: true } },
            signer: { select: { id: true, name: true, email: true } },
          },
        })
      )
    );

    // Update document status to PENDING_SIGNATURE
    const updatedDocument = await prisma.document.update({
      where: { id: body.documentId },
      data: { status: 'PENDING_SIGNATURE' },
    });

    // Create audit trail
    const signerNames = signatureRequests.map(s => s.signerName || s.signerEmail).join(', ');
    await prisma.documentAuditTrail.create({
      data: {
        documentId: body.documentId,
        orgId,
        action: 'SIGNATURE_REQUESTED',
        actorEmail: userEmail,
        actorName: userName,
        ipAddress,
        metadata: {
          signerCount: signatureRequests.length,
          signerNames,
          signatureRequestIds: signatureRequests.map(s => s.id),
        },
      },
    });

    return NextResponse.json(
      { signatureRequests, document: updatedDocument },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
