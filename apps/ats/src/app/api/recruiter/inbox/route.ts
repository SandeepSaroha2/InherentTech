/**
 * GET  /api/recruiter/inbox        — Preeti's AI-processed inbox items
 * POST /api/recruiter/inbox        — Approve / reject / act on an inbox item
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma, postJobToCeipal } from '@inherenttech/db';
import { createRetellCall } from '@inherenttech/db';
import { getSmtpTransporter } from '@inherenttech/db';

export async function GET(request: NextRequest) {
  const orgId = request.headers.get('x-org-id') || '';
  if (!orgId) return NextResponse.json({ error: 'x-org-id required' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');           // PENDING | APPROVED | REJECTED | AUTO_DONE
  const classification = searchParams.get('type');     // JOB_ORDER | CANDIDATE_REPLY | GENERAL
  const recruiterEmail = searchParams.get('recruiter');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: Record<string, any> = { orgId };
  if (status) where.status = status;
  if (classification) where.classification = classification;
  if (recruiterEmail) where.recruiterEmail = recruiterEmail;

  const [items, total] = await Promise.all([
    prisma.recruiterInboxItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        jobOrder: { select: { id: true, title: true, status: true, ceipalJobId: true, ceipalPostedAt: true } },
        candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        call: { select: { id: true, status: true, externalCallId: true, duration: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.recruiterInboxItem.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const orgId = request.headers.get('x-org-id') || '';
  if (!orgId) return NextResponse.json({ error: 'x-org-id required' }, { status: 400 });

  const body = await request.json();
  const { itemId, action, reviewedById, overrides } = body as {
    itemId: string;
    action: 'approve' | 'reject' | 'send_reply' | 'schedule_call' | 'post_job' | 'approve_and_post_ceipal';
    reviewedById?: string;
    overrides?: Record<string, any>; // optional field overrides (e.g. edited reply text, job details)
  };

  if (!itemId || !action) {
    return NextResponse.json({ error: 'itemId and action required' }, { status: 400 });
  }

  const item = await prisma.recruiterInboxItem.findFirst({ where: { id: itemId, orgId } });
  if (!item) return NextResponse.json({ error: 'Inbox item not found' }, { status: 404 });

  const actionsLog = Array.isArray(item.actionsLog) ? (item.actionsLog as any[]) : [];
  const log = (a: string, s: 'done' | 'failed', d?: string) =>
    actionsLog.push({ action: a, status: s, timestamp: new Date().toISOString(), detail: d });

  try {
    if (action === 'reject') {
      await prisma.recruiterInboxItem.update({
        where: { id: itemId },
        data: { status: 'REJECTED', reviewedById, reviewedAt: new Date(), actionsLog },
      });
      return NextResponse.json({ success: true, status: 'REJECTED' });
    }

    if (action === 'send_reply') {
      const replyText = overrides?.replyText || item.suggestedReply;
      if (!replyText) return NextResponse.json({ error: 'No reply text' }, { status: 400 });

      const mailer = getSmtpTransporter();
      const recruiterEmail = item.recruiterEmail;
      const recruiterName = recruiterEmail.split('@')[0].charAt(0).toUpperCase() +
        recruiterEmail.split('@')[0].slice(1);

      await mailer.sendMail({
        from: `${recruiterName} at InherentTech <${process.env.SMTP_FROM || 'noreply@xgnmail.com'}>`,
        replyTo: `${recruiterName} <${recruiterEmail}>`,
        to: `${item.fromName} <${item.fromEmail}>`,
        subject: `Re: ${item.subject}`,
        inReplyTo: item.messageId || undefined,
        references: item.messageId || undefined,
        text: replyText,
        html: replyText.replace(/\n/g, '<br>'),
      });

      log('send_reply', 'done', `Sent to ${item.fromEmail}`);
      await prisma.recruiterInboxItem.update({
        where: { id: itemId },
        data: { replySent: true, replySentAt: new Date(), actionsLog, reviewedById, reviewedAt: new Date(), status: 'APPROVED' },
      });
      return NextResponse.json({ success: true, action: 'reply_sent' });
    }

    if (action === 'schedule_call') {
      const candidateData = item.extractedData as Record<string, any>;
      const phone = overrides?.phone || candidateData?.phone;
      if (!phone) return NextResponse.json({ error: 'No phone number available' }, { status: 400 });

      const candidateId = item.candidateId;
      let candidateName = overrides?.candidateName || `${item.fromName}`;
      if (candidateId) {
        const c = await prisma.candidate.findUnique({ where: { id: candidateId } });
        if (c) candidateName = `${c.firstName} ${c.lastName}`;
      }

      const e164 = phone.replace(/\D/g, '');
      const callResult = await createRetellCall({
        toNumber: e164.startsWith('1') ? `+${e164}` : `+1${e164}`,
        metadata: { candidateId: candidateId || '', candidateName, orgId },
        retellLlmDynamicVariables: {
          candidate_name: candidateName,
          recruiter_name: item.recruiterEmail.split('@')[0],
          role: 'technical recruiter screening',
        },
      });

      const call = await prisma.call.create({
        data: {
          orgId,
          candidateId: candidateId || null,
          direction: 'OUTBOUND',
          channel: 'RETELL_AI',
          status: 'INITIATED',
          fromNumber: process.env.RETELL_FROM_NUMBER || '',
          toNumber: phone,
          externalCallId: callResult.callId,
          retellAgentId: callResult.agentId,
        },
      });

      log('schedule_call', 'done', `Retell call to ${phone} (callId: ${callResult.callId})`);
      await prisma.recruiterInboxItem.update({
        where: { id: itemId },
        data: { callId: call.id, actionsLog, reviewedById, reviewedAt: new Date(), status: 'APPROVED' },
      });
      return NextResponse.json({ success: true, action: 'call_scheduled', callId: call.id, retellCallId: callResult.callId });
    }

    if (action === 'post_job' && item.jobOrderId) {
      // Publish the job to the job board
      await prisma.jobOrder.update({
        where: { id: item.jobOrderId },
        data: { status: 'OPEN' },
      });
      log('post_job', 'done', `JobOrder ${item.jobOrderId} published`);
      await prisma.recruiterInboxItem.update({
        where: { id: itemId },
        data: { actionsLog, reviewedById, reviewedAt: new Date(), status: 'APPROVED' },
      });
      return NextResponse.json({ success: true, action: 'job_posted', jobOrderId: item.jobOrderId });
    }

    if (action === 'approve') {
      // Generic approve — mark all pending actions as done
      log('approve', 'done', 'Preeti approved all suggested actions');
      await prisma.recruiterInboxItem.update({
        where: { id: itemId },
        data: { status: 'APPROVED', reviewedById, reviewedAt: new Date(), actionsLog },
      });
      return NextResponse.json({ success: true, status: 'APPROVED' });
    }

    if (action === 'approve_and_post_ceipal' && item.jobOrderId) {
      // Fetch the linked job order
      const job = await prisma.jobOrder.findUnique({
        where: { id: item.jobOrderId },
        include: { client: { select: { companyName: true } } },
      });
      if (!job) return NextResponse.json({ error: 'Linked job order not found' }, { status: 404 });

      // Merge in any edits made in the review modal
      const title              = overrides?.title              ?? job.title;
      const description        = overrides?.description        ?? job.description ?? '';
      const booleanSearchString = overrides?.booleanSearchString ?? job.booleanSearchString;
      const requirements       = overrides?.requirements       ?? job.requirements;
      const location           = overrides?.location           ?? job.location;
      const rr                 = (job.rateRange as any) || {};
      const rateMin            = overrides?.rateMin            ?? rr.min;
      const rateMax            = overrides?.rateMax            ?? rr.max;
      const priority           = overrides?.priority           ?? job.priority;

      // Post to Ceipal
      const ceipalResult = await postJobToCeipal({
        title, description, booleanSearchString, requirements,
        location, rateMin, rateMax, priority: priority as any,
        openings: job.openings,
        clientName: job.client?.companyName,
      });

      // Update job order: save edits + mark OPEN + store Ceipal ID
      await prisma.jobOrder.update({
        where: { id: item.jobOrderId },
        data: {
          title, description, booleanSearchString, requirements,
          ...(location !== undefined && { location }),
          status:         'OPEN',
          ceipalJobId:    ceipalResult.ceipalJobId,
          ceipalPostedAt: new Date(),
        },
      });

      log('approve_and_post_ceipal', 'done',
        `Posted to Ceipal — Job ID: ${ceipalResult.ceipalJobId}${ceipalResult.jobUrl ? ' | ' + ceipalResult.jobUrl : ''}`);

      await prisma.recruiterInboxItem.update({
        where: { id: itemId },
        data: { status: 'APPROVED', reviewedById, reviewedAt: new Date(), actionsLog },
      });

      return NextResponse.json({
        success:      true,
        action:       'posted_to_ceipal',
        ceipalJobId:  ceipalResult.ceipalJobId,
        jobUrl:       ceipalResult.jobUrl,
        jobOrderId:   item.jobOrderId,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (e: any) {
    log(action, 'failed', e.message);
    await prisma.recruiterInboxItem.update({ where: { id: itemId }, data: { actionsLog } }).catch(() => {});
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
