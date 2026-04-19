import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';
import { createCrossAppEvent, dispatchCrossAppEvent, CROSS_APP_EVENTS } from '@inherenttech/shared';

// POST /api/placements/onboard
// Body: { placementId }
// Creates employment agreement, NDA, W-4, I-9, direct deposit docs
export async function POST(req: NextRequest) {
  const orgId = req.headers.get('x-org-id') || 'default';
  const userId = req.headers.get('x-user-id') || 'system';

  try {
    const { placementId } = await req.json();

    // Get placement with candidate and job details
    const placement = await prisma.placement.findFirst({
      where: { id: placementId, orgId },
      include: {
        candidate: true,
        jobOrder: true,
      },
    });

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 });
    }

    // Get onboarding document templates
    const templates = await prisma.documentTemplate.findMany({
      where: {
        orgId,
        isActive: true,
        category: { in: ['EMPLOYMENT', 'LEGAL', 'ONBOARDING', 'FINANCIAL'] },
      },
    });

    const createdDocs: any[] = [];

    for (const template of templates) {
      // Interpolate template fields with placement data
      let content = template.content;
      const fieldValues: Record<string, string> = {
        candidateName: `${placement.candidate.firstName} ${placement.candidate.lastName}`,
        candidateEmail: placement.candidate.email,
        candidatePhone: placement.candidate.phone || '',
        jobTitle: placement.jobOrder.title,
        clientName: placement.jobOrder.clientId || 'Client',
        startDate: placement.startDate.toISOString().split('T')[0],
        endDate: placement.endDate?.toISOString().split('T')[0] || 'TBD',
        billRate: String(placement.billRate),
        payRate: String(placement.payRate),
        companyName: 'InherentTech Solutions LLC',
        today: new Date().toISOString().split('T')[0],
      };

      // Replace {{fieldName}} placeholders
      for (const [key, value] of Object.entries(fieldValues)) {
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }

      // Create the document
      const doc = await prisma.document.create({
        data: {
          orgId,
          templateId: template.id,
          title: `${template.name} - ${fieldValues.candidateName}`,
          content,
          status: 'DRAFT',
          createdById: userId,
        },
      });

      // Create signature request for the candidate
      await prisma.signatureRequest.create({
        data: {
          orgId,
          documentId: doc.id,
          signerEmail: placement.candidate.email,
          signerName: `${placement.candidate.firstName} ${placement.candidate.lastName}`,
          order: 1,
          status: 'PENDING',
        },
      });

      // Update document status
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: 'PENDING_SIGNATURE' },
      });

      // Create audit trail
      await prisma.documentAuditTrail.create({
        data: {
          documentId: doc.id,
          orgId,
          action: `Document created from template "${template.name}" for placement onboarding`,
          actorEmail: 'system@inherenttech.com',
          actorName: 'System (Placement Onboarding)',
        },
      });

      createdDocs.push({ id: doc.id, title: doc.title, template: template.name });
    }

    // Dispatch cross-app event to KudoDoc
    await dispatchCrossAppEvent(
      createCrossAppEvent('ats', 'kudodoc', CROSS_APP_EVENTS.PLACEMENT_ONBOARD, {
        placementId,
        candidateEmail: placement.candidate.email,
        candidateName: `${placement.candidate.firstName} ${placement.candidate.lastName}`,
        jobTitle: placement.jobOrder.title,
        documentCount: createdDocs.length,
      })
    );

    return NextResponse.json({
      message: `${createdDocs.length} onboarding documents created`,
      documents: createdDocs,
      placementId,
    });
  } catch (error: any) {
    console.error('[Placements Onboard Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
