import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, renderEmailTemplate, getEmailTemplate, type EmailMessage } from '@inherenttech/db';
import { prisma } from '@inherenttech/db';

/**
 * POST /api/email/send
 * Send an email via Resend with optional template rendering
 *
 * Body:
 * {
 *   to: string | string[]
 *   subject: string
 *   html?: string
 *   text?: string
 *   template?: string (template ID)
 *   variables?: Record<string, string>
 *   cc?: string[]
 *   bcc?: string[]
 *   attachments?: Array<{ filename: string; content: string; contentType: string }>
 *   from?: string (defaults to noreply@xgnmail.com)
 *   replyTo?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const userId = request.headers.get('x-user-id') || '';
    const body = await request.json();

    // Get sender email (default to xgnmail.com)
    const fromEmail = body.from || 'noreply@xgnmail.com';

    let htmlContent = body.html || '';
    let subjectLine = body.subject || '';

    // Render template if provided
    if (body.template) {
      const template = getEmailTemplate(body.template);
      if (!template) {
        return NextResponse.json(
          { error: `Template not found: ${body.template}` },
          { status: 404 }
        );
      }

      const variables = body.variables || {};
      const rendered = renderEmailTemplate(template, variables);
      htmlContent = rendered.html;
      subjectLine = rendered.subject;
    }

    // Build email message
    const message: EmailMessage = {
      from: fromEmail,
      to: body.to,
      subject: subjectLine,
      html: htmlContent,
      text: body.text,
      cc: body.cc,
      bcc: body.bcc,
      replyTo: body.replyTo,
      attachments: body.attachments,
    };

    // Send email
    const result = await sendEmail(message);

    // Log email in database
    if (result.status === 'sent') {
      await prisma.emailLog.create({
        data: {
          orgId,
          fromEmail: message.from,
          toEmail: Array.isArray(message.to) ? message.to.join(',') : message.to,
          subject: message.subject,
          body: message.html || message.text || '',
          status: 'sent',
          messageId: result.id,
        },
      }).catch(err => {
        console.error('Failed to log email:', err);
      });
    }

    return NextResponse.json(result, {
      status: result.status === 'failed' ? 400 : 201,
    });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
