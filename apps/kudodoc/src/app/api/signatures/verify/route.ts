import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

/**
 * POST /api/signatures/verify
 * Verify a document's signatures
 * Returns: all signature requests, full audit trail, document integrity check
 * Body: { documentId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: body.documentId },
      include: {
        template: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get all signature requests
    const signatureRequests = await prisma.signatureRequest.findMany({
      where: { documentId: body.documentId },
      orderBy: { order: 'asc' },
      include: {
        signer: { select: { id: true, name: true, email: true } },
      },
    });

    // Get full audit trail
    const auditTrail = await prisma.documentAuditTrail.findMany({
      where: { documentId: body.documentId },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate document integrity metrics
    const signatureChain = signatureRequests
      .filter((sr: any) => sr.status === 'SIGNED')
      .map((sr: any, index: number) => ({
        order: sr.order,
        signer: sr.signerName || sr.signerEmail,
        email: sr.signerEmail,
        signedAt: sr.signedAt,
        ipAddress: sr.ipAddress,
        sequenceValid: index === 0 || sr.order > signatureRequests[index - 1].order,
      }));

    const integrityCheck = {
      documentId: document.id,
      documentTitle: document.title,
      documentStatus: document.status,
      createdAt: document.createdAt,
      lastModified: document.updatedAt,
      createdBy: document.createdBy,
      totalSignersRequired: signatureRequests.length,
      signersCompleted: signatureRequests.filter(sr => sr.status === 'SIGNED').length,
      signersPending: signatureRequests.filter(sr => sr.status === 'PENDING').length,
      signersDeclined: signatureRequests.filter(sr => sr.status === 'DECLINED').length,
      signatureChainValid: signatureChain.every(s => s.sequenceValid),
      completionDate:
        signatureRequests.filter(sr => sr.status === 'SIGNED').length === signatureRequests.length
          ? signatureRequests.reduce((max, sr) => (sr.signedAt && sr.signedAt > max ? sr.signedAt : max), new Date(0))
          : null,
      firstSignedAt: signatureChain.length > 0 ? signatureChain[0].signedAt : null,
      lastSignedAt: signatureChain.length > 0 ? signatureChain[signatureChain.length - 1].signedAt : null,
    };

    return NextResponse.json({
      document,
      signatureRequests,
      auditTrail,
      integrityCheck,
      signatureChain,
      verification: {
        isComplete: integrityCheck.signersCompleted === integrityCheck.totalSignersRequired,
        isPartiallyComplete: integrityCheck.signersCompleted > 0 && integrityCheck.signersCompleted < integrityCheck.totalSignersRequired,
        chainValid: integrityCheck.signatureChainValid,
        allSignersIdentified: signatureRequests.every(sr => sr.signerId),
        hasDeclines: integrityCheck.signersDeclined > 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
