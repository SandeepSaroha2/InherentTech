import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

// GET /api/invoices — List invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = request.headers.get('x-org-id') || '';
    const status = searchParams.get('status');

    const where: any = { orgId };
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        placement: {
          include: {
            candidate: { select: { firstName: true, lastName: true } },
            jobOrder: { select: { title: true, client: { select: { companyName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ data: invoices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/invoices — Generate invoice from approved timesheets
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const body = await request.json();
    const { placementId, timesheetIds } = body;

    // Get approved timesheets
    const timesheets = await prisma.timesheet.findMany({
      where: {
        id: { in: timesheetIds },
        placementId,
        status: 'APPROVED',
      },
    });

    if (timesheets.length === 0) {
      return NextResponse.json({ error: 'No approved timesheets found' }, { status: 400 });
    }

    // Get placement for bill rate
    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
    });

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 });
    }

    // Calculate amounts
    const totalHours = timesheets.reduce((sum, ts) => sum + Number(ts.totalHours), 0);
    const amount = totalHours * Number(placement.billRate);
    const tax = amount * 0; // Tax-exempt staffing services (configurable)
    const totalAmount = amount + tax;

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({ where: { orgId } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, '0')}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        orgId,
        placementId,
        timesheetIds: timesheetIds,
        invoiceNumber,
        amount,
        tax,
        totalAmount,
        status: 'DRAFT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Net 30
      },
    });

    // Mark timesheets as invoiced
    await prisma.timesheet.updateMany({
      where: { id: { in: timesheetIds } },
      data: { status: 'INVOICED' },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
