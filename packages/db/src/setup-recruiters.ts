/**
 * Setup Recruiters Script
 * Creates User records in DB, creates Supabase auth accounts,
 * and sends welcome/invite emails via xgnmail.com SMTP.
 *
 * Run: npx tsx src/setup-recruiters.ts  (from packages/db)
 */
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { getSmtpTransporter, SMTP_FROM } from './smtp';

const prisma = new PrismaClient();

const RECRUITERS = [
  { email: 'Preeti@xgnmail.com', name: 'Preeti' },
  { email: 'Priya@xgnmail.com',  name: 'Priya'  },
  { email: 'Parul@xgnmail.com',  name: 'Parul'  },
  { email: 'Pritisha@xgnmail.com', name: 'Pritisha' },
  { email: 'Pari@xgnmail.com',   name: 'Pari'   },
];

const PLATFORM_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000';

function inviteEmailHtml(name: string, loginUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1d4ed8;">Welcome to InherentTech Platform, ${name}!</h2>
      <p>You've been added as a <strong>Recruiter</strong> on the InherentTech staffing platform.</p>
      <p>You can now log in and start working on job orders assigned to you.</p>
      <p style="margin: 28px 0;">
        <a href="${loginUrl}"
           style="background: #1d4ed8; color: white; padding: 12px 28px; border-radius: 6px;
                  text-decoration: none; font-weight: bold; display: inline-block;">
          Log In to Platform
        </a>
      </p>
      <p style="color: #6b7280; font-size: 13px;">
        If you have trouble logging in, use the "Forgot Password" option on the login page
        or contact your administrator.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">InherentTech Solutions · Chandler, AZ</p>
    </div>
  `;
}

async function sendInviteEmail(name: string, email: string): Promise<void> {
  const mailer = getSmtpTransporter();
  const loginUrl = `${PLATFORM_URL}/login`;

  await mailer.sendMail({
    from: `InherentTech Platform <${SMTP_FROM}>`,
    to: email,
    subject: `Welcome to InherentTech Platform — Action Required`,
    html: inviteEmailHtml(name, loginUrl),
    text: `Hi ${name},\n\nYou've been added as a Recruiter on the InherentTech platform.\n\nLog in at: ${loginUrl}\n\nIf you need to reset your password, use the "Forgot Password" option.\n\n— InherentTech Solutions`,
  });
}

async function main() {
  console.log('🚀 Setting up recruiters...\n');

  const org = await prisma.organization.findUnique({ where: { slug: 'inherenttech' } });
  if (!org) throw new Error('Organization "inherenttech" not found. Run npm run db:seed first.');
  console.log(`✅ Organization: ${org.name} (${org.id})\n`);

  // Lazy-init Supabase admin (service key needed for creating auth users)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  for (const recruiter of RECRUITERS) {
    const email = recruiter.email.toLowerCase();
    console.log(`─── ${recruiter.name} <${email}> ───`);
    try {
      // 1. Upsert User record in Prisma DB
      await prisma.user.upsert({
        where: { email },
        update: { name: recruiter.name, role: 'RECRUITER', isActive: true },
        create: { orgId: org.id, email, name: recruiter.name, role: 'RECRUITER', isActive: true },
      });
      console.log(`  ✅ DB record upserted`);

      // 2. Create Supabase auth user (so they can log in)
      if (supabaseAdmin) {
        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { org_id: org.id, role: 'RECRUITER', name: recruiter.name },
        });
        if (error && !error.message.includes('already been registered')) {
          console.log(`  ⚠️  Supabase auth: ${error.message}`);
        } else {
          console.log(`  ✅ Supabase auth user created`);
        }
      }

      // 3. Send invite email via xgnmail SMTP
      await sendInviteEmail(recruiter.name, email);
      console.log(`  📧 Invite email sent via xgnmail.com`);

    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
    console.log('');
  }

  console.log('🎉 Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
