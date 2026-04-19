import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

export async function GET(req: NextRequest) {
  try {
    const email = req.headers.get('x-user-email');

    if (!email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const applications = await prisma.submission.findMany({
      where: {
        candidate: { email },
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        jobOrder: {
          select: {
            id: true,
            title: true,
          },
        },
        updatedAt: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, firstName, lastName, email, phone, resumeUrl, coverLetter, linkedIn } = body;

    // Validate required fields
    if (!jobId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify job exists and is open
    const job = await prisma.jobOrder.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, orgId: true },
    });

    if (!job || job.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Job not found or not available' },
        { status: 404 }
      );
    }

    // Get or create candidate
    let candidate = await prisma.candidate.findUnique({
      where: { orgId_email: { orgId: job.orgId, email } },
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          orgId: job.orgId,
          firstName,
          lastName,
          email,
          phone,
          resumeUrl,
          linkedinUrl: linkedIn,
          source: 'public_job_board',
        },
      });
    } else {
      // Update candidate info if provided
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          phone: phone || candidate.phone,
          resumeUrl: resumeUrl || candidate.resumeUrl,
          linkedinUrl: linkedIn || candidate.linkedinUrl,
        },
      });
    }

    // Get a system user for submissions (use the job's assigned user or first recruiter)
    let submittedById = '';
    if (job.orgId) {
      const user = await prisma.user.findFirst({
        where: {
          orgId: job.orgId,
          role: { in: ['RECRUITER', 'OWNER', 'ADMIN'] },
        },
        select: { id: true },
      });
      submittedById = user?.id || '';
    }

    if (!submittedById) {
      return NextResponse.json(
        { error: 'Unable to process application' },
        { status: 500 }
      );
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        orgId: job.orgId,
        candidateId: candidate.id,
        jobOrderId: jobId,
        submittedById,
        status: 'SUBMITTED',
        internalNotes: coverLetter ? `Cover Letter: ${coverLetter}` : undefined,
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
