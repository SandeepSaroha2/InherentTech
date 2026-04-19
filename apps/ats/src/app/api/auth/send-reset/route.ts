import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSmtpTransporter } from '@inherenttech/db';

const SMTP_FROM = process.env.SMTP_FROM || 'noreply@xgnmail.com';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const origin = request.headers.get('origin') || 'http://localhost:4001';
    const redirectTo = `${origin}/reset-password`;

    // Generate reset link via Supabase admin (no email sent by Supabase)
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

    if (error) {
      // Don't leak whether user exists — return success regardless
      console.error('Reset link generation error:', error.message);
      return NextResponse.json({ success: true });
    }

    const resetLink = data.properties?.action_link;
    if (!resetLink) return NextResponse.json({ success: true });

    // Send via xgnmail SMTP
    const mailer = getSmtpTransporter();
    await mailer.sendMail({
      from: `InherentTech Platform <${SMTP_FROM}>`,
      to: email,
      subject: 'Reset Your InherentTech ATS Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1e40af;">Password Reset Request</h2>
          <p>We received a request to reset your password for your InherentTech ATS account.</p>
          <p style="margin: 28px 0; text-align: center;">
            <a href="${resetLink}"
               style="background: #1d4ed8; color: white; padding: 13px 32px; border-radius: 6px;
                      text-decoration: none; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </p>
          <p style="color: #6b7280; font-size: 13px;">
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">InherentTech Solutions · Chandler, AZ</p>
        </div>
      `,
      text: `Reset your InherentTech ATS password by visiting:\n\n${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('send-reset error:', error.message);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}
