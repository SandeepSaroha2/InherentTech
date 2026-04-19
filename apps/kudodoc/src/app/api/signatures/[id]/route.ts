import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * GET /api/signatures/:id
 * Get a single signature request with document info
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: { id: params.id },
      include: {
        document: {
          select: { id: true, title: true, status: true, createdAt: true },
        },
        signer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!signatureRequest) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
    }

    return NextResponse.json(signatureRequest);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/signatures/:id
 * Update signature request status (SIGNED, DECLINED, VIEWED)
 * On SIGNED: set signedAt, ipAddress
 * Checks if all signers have signed → updates document status to SIGNED if yes
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const userEmail = request.headers.get('x-user-email') || 'system@inherenttech.ai';
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip || undefined;

    // Get current signature request
    const currentSignature = await prisma.signatureRequest.findUnique({
      where: { id: params.id },
      include: {
        document: true,
      },
    });

    if (!currentSignature) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
    }

    const updateData: any = { status: body.status };

    // If signing, set signedAt and ipAddress
    if (body.status === 'SIGNED') {
      updateData.signedAt = new Date();
      updateData.ipAddress = ipAddress;
      if (body.signatureImageUrl) {
        updateData.signatureImageUrl = body.signatureImageUrl;
      }
    }

    const signatureRequest = await prisma.signatureRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        document: true,
        signer: { select: { id: true, name: true, email: true } },
      },
    });

    // Create audit trail entry
    if (body.status === 'SIGNED') {
      await prisma.documentAuditTrail.create({
        data: {
          documentId: signatureRequest.documentId,
          orgId: currentSignature.document.orgId,
          action: 'SIGNED',
          actorEmail: body.signerEmail || signatureRequest.signerEmail,
          actorName: signatureRequest.signerName || signatureRequest.signerEmail,
          ipAddress,
          metadata: {
            signatureRequestId: signatureRequest.id,
            order: signatureRequest.order,
          },
        },
      });
    } else if (body.status === 'DECLINED') {
      await prisma.documentAuditTrail.create({
        data: {
          documentId: signatureRequest.documentId,
          orgId: currentSignature.document.orgId,
          action: 'SIGNATURE_DECLINED',
          actorEmail: signatureRequest.signerEmail,
          actorName: signatureRequest.signerName || signatureRequest.signerEmail,
          ipAddress,
          metadata: {
            signatureRequestId: signatureRequest.id,
            reason: body.declineReason || null,
          },
        },
      });
    }

    // Check if all signers have signed
    if (body.status === 'SIGNED') {
      const pendingSignatures = await prisma.signatureRequest.count({
        where: {
          documentId: signatureRequest.documentId,
          status: 'PENDING',
        },
      });

      // If no pending signatures, update document status to SIGNED
      if (pendingSignatures === 0) {
        await prisma.document.update({
          where: { id: signatureRequest.documentId },
          data: { status: 'COMPLETED' },
        });

        await prisma.documentAuditTrail.create({
          data: {
            documentId: signatureRequest.documentId,
            orgId: signatureRequest.document.orgId,
            action: 'ALL_SIGNATURES_COMPLETED',
            actorEmail: 'system@inherenttech.ai',
            actorName: 'System',
            metadata: {
              completedAt: new Date(),
            },
          },
        });
      } else {
        // Update document status to PARTIALLY_SIGNED if there are pending signatures
        const doc = await prisma.document.findUnique({
          where: { id: signatureRequest.documentId },
        });

        if (doc?.status === 'PENDING_SIGNATURE') {
          await prisma.document.update({
            where: { id: signatureRequest.documentId },
            data: { status: 'PARTIALLY_SIGNED' },
          });
        }
      }
    }

    return NextResponse.json(signatureRequest);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
