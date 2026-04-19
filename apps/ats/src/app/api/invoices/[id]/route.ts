import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.paidAt && { paidAt: new Date(body.paidAt) }),
        ...(body.stripePaymentId && { stripePaymentId: body.stripePaymentId }),
      },
    });
    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
