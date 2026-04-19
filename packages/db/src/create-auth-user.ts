/**
 * Create auth user + send welcome email with temp password via xgnmail SMTP
 * Run: npx tsx src/create-auth-user.ts  (from packages/db)
 */
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { getSmtpTransporter, SMTP_FROM } from './smtp';

const prisma = new PrismaClient();

const RECRUITER = { email: 'preeti@xgnmail.com', name: 'Preeti' };
const TEMP_PASSWORD = 'InherentTech@2026!';
const PLATFORM_URL = 'http://localhost:4001'; // ATS app

function welcomeEmailHtml(name: string, email: string, tempPassword: string, loginUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #1e40af; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Welcome to InherentTech ATS</h1>
        <p style="color: #93c5fd; margin: 6px 0 0;">Your Recruiter Account is Ready</p>
      </div>
      <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 15px; color: #111827;">Hi <strong>${name}</strong>,</p>
        <p style="color: #374151;">Your recruiter account has been set up on the InherentTech Applicant Tracking System. Use the credentials below to log in.</p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Your Login Credentials</p>
          <p style="margin: 4px 0; font-size: 15px; color: #111827;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0; font-size: 15px; color: #111827;"><strong>Temporary Password:</strong> <code style="background: #eff6ff; padding: 2px 8px; border-radius: 4px; color: #1d4ed8;">${tempPassword}</code></p>
        </div>

        <p style="text-align: center; margin: 28px 0;">
          <a href="${loginUrl}" style="background: #1d4ed8; color: white; padding: 13px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
            Log In to ATS
          </a>
        </p>

        <p style="color: #ef4444; font-size: 13px; text-align: center;">
          ⚠️ Please change your password immediately after your first login.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

        <p style="font-size: 13px; color: #6b7280;">
          You have been set up with <strong>Recruiter</strong> access. You can view and work on job orders assigned to you, manage candidates, schedule interviews, and track submissions.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">InherentTech Solutions · Chandler, AZ · <a href="mailto:admin@inherenttech.com" style="color: #9ca3af;">admin@inherenttech.com</a></p>
      </div>
    </div>
  `;
}

async function main() {
  console.log(`\n🚀 Setting up auth for ${RECRUITER.name}...\n`);

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // 1. Create Supabase auth user with temp password
  console.log('1. Creating Supabase auth user...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: RECRUITER.email,
    password: TEMP_PASSWORD,
    email_confirm: true, // skip email confirmation, we send our own
    user_metadata: {
      name: RECRUITER.name,
      role: 'RECRUITER',
    },
  });

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      console.log(`   ℹ️  Auth user already exists — updating password...`);
      // Find existing user and update password
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existing = users.find(u => u.email === RECRUITER.email);
      if (existing) {
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: TEMP_PASSWORD,
          user_metadata: { name: RECRUITER.name, role: 'RECRUITER' },
        });
        console.log(`   ✅ Password reset to temp password`);
      }
    } else {
      throw new Error(`Supabase auth error: ${authError.message}`);
    }
  } else {
    console.log(`   ✅ Auth user created (id: ${authData.user?.id})`);
  }

  // 2. Ensure DB user record is up to date
  console.log('2. Verifying DB record...');
  const org = await prisma.organization.findUnique({ where: { slug: 'inherenttech' } });
  if (!org) throw new Error('Organization not found');

  await prisma.user.upsert({
    where: { email: RECRUITER.email },
    update: { name: RECRUITER.name, role: 'RECRUITER', isActive: true },
    create: { orgId: org.id, email: RECRUITER.email, name: RECRUITER.name, role: 'RECRUITER', isActive: true },
  });
  console.log(`   ✅ DB record confirmed`);

  // 3. Send welcome email with credentials via xgnmail
  console.log('3. Sending welcome email via xgnmail...');
  const mailer = getSmtpTransporter();
  await mailer.sendMail({
    from: `InherentTech Platform <${SMTP_FROM}>`,
    to: RECRUITER.email,
    subject: 'Your InherentTech ATS Account is Ready',
    html: welcomeEmailHtml(RECRUITER.name, RECRUITER.email, TEMP_PASSWORD, `${PLATFORM_URL}/login`),
    text: `Hi ${RECRUITER.name},\n\nYour ATS account is ready.\n\nEmail: ${RECRUITER.email}\nTemp Password: ${TEMP_PASSWORD}\n\nLogin at: ${PLATFORM_URL}/login\n\nPlease change your password after first login.\n\n— InherentTech Solutions`,
  });
  console.log(`   ✅ Welcome email sent to ${RECRUITER.email}`);

  console.log('\n🎉 Done! Preeti can now log in at http://localhost:4001/login');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
