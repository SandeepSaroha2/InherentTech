import { NextRequest, NextResponse } from 'next/server';
import { sendBulkEmails, renderEmailTemplate, getEmailTemplate, type EmailMessage, prisma } from '@inherenttech/db';

/**
 * POST /api/email/campaign/send
 * Send bulk emails via Resend (campaign mode)
 *
 * Body:
 * {
 *   campaignId?: string (optional, for tracking)
 *   template: string (template ID)
 *   recipients: Array<{
 *     email: string
 *     variables: Record<string, string>
 *     name?: string
 *   }>
 *   from?: string (defaults to noreply@xgnmail.com)
 *   replyTo?: string
 *   tags?: Array<{ name: string; value: string }>
 * }
 *
 * Returns:
 * {
 *   results: Array<{
 *     email: string
 *     messageId: string
 *     status: 'sent' | 'failed'
 *     error?: string
 *   }>
 *   totalSent: number
 *   totalFailed: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const userId = request.headers.get('x-user-id') || '';
    const body = await request.json();

    // Validate required fields
    if (!body.template) {
      return NextResponse.json(
        { error: 'Missing required field: template' },
        { status: 400 }
      );
    }

    if (!body.recipients || !Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: recipients (non-empty array)' },
        { status: 400 }
      );
    }

    // Get template
    const template = getEmailTemplate(body.template);
    if (!template) {
      return NextResponse.json(
        { error: `Template not found: ${body.template}` },
        { status: 404 }
      );
    }

    // Get sender email (default to xgnmail.com)
    const fromEmail = body.from || 'noreply@xgnmail.com';

    // Build email messages
    const messages: EmailMessage[] = body.recipients.map((recipient: any) => {
      const variables = recipient.variables || {};
      const rendered = renderEmailTemplate(template, variables);

      return {
        from: fromEmail,
        to: recipient.email,
        subject: rendered.subject,
        html: rendered.html,
        replyTo: body.replyTo,
        tags: body.tags,
      };
    });

    // Send bulk emails
    const results = await sendBulkEmails(messages);

    // Log emails in database
    if (orgId) {
      const logs = results.map((result, index) => ({
        orgId,
        fromEmail,
        toEmail: body.recipients[index].email,
        subject: messages[index].subject,
        body: messages[index].html || '',
        status: result.status,
        messageId: result.id,
        resendId: result.id,
      }));

      await Promise.all(
        logs.map(log =>
          prisma.emailLog.create({ data: log }).catch(err => {
            console.error('Failed to log email:', err);
          })
        )
      );
    }

    // Update campaign stats if campaignId provided
    if (body.campaignId) {
      const successCount = results.filter(r => r.status === 'sent').length;
      await prisma.outreachCampaign.update({
        where: { id: body.campaignId },
        data: {
          sentCount: { increment: successCount },
        },
      }).catch(err => {
        console.error('Failed to update campaign:', err);
      });
    }

    const totalSent = results.filter(r => r.status === 'sent').length;
    const totalFailed = results.filter(r => r.status === 'failed').length;

    return NextResponse.json(
      {
        results: results.map((result, index) => ({
          email: body.recipients[index].email,
          messageId: result.id,
          status: result.status,
          error: result.error,
        })),
        totalSent,
        totalFailed,
      },
      {
        status: totalFailed > 0 ? 207 : 201, // 207 Multi-Status if some failed
      }
    );
  } catch (error: any) {
    console.error('Campaign send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send campaign' },
      { status: 500 }
    );
  }
}
