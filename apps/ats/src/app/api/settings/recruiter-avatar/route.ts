/**
 * POST /api/settings/recruiter-avatar
 *
 * Upload a recruiter's profile picture to Supabase Storage (avatars bucket).
 * Saves the public URL to Organization.settings.recruiterSettings[email].avatarUrl
 *
 * Body: FormData { file: File, email: string }
 * Header: x-org-id
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma, supabaseAdmin, STORAGE_BUCKETS } from '@inherenttech/db';

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    if (!orgId) return NextResponse.json({ error: 'Missing org ID' }, { status: 400 });

    const form = await request.formData();
    const file  = form.get('file') as File | null;
    const email = (form.get('email') as string | null)?.trim();

    if (!file || !email) {
      return NextResponse.json({ error: 'Missing file or email' }, { status: 400 });
    }

    const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `recruiters/${orgId}/${email.replace('@', '_').replace('.', '_')}.${ext}`;

    // Convert Web File → Buffer for Supabase upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.avatars)
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert:      true,
      });

    if (uploadError) throw new Error(uploadError.message);

    // Get public URL (avatars bucket is public)
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(STORAGE_BUCKETS.avatars)
      .getPublicUrl(path);

    // Save avatarUrl into recruiterSettings
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { settings: true } });
    const current         = (org?.settings as Record<string, any>) || {};
    const recruiterSettings = { ...(current.recruiterSettings || {}) };
    recruiterSettings[email] = {
      ...(recruiterSettings[email] || {}),
      avatarUrl: `${publicUrl}?t=${Date.now()}`,
    };

    await prisma.organization.update({
      where: { id: orgId },
      data:  { settings: { ...current, recruiterSettings } },
    });

    return NextResponse.json({ avatarUrl: `${publicUrl}?t=${Date.now()}` });
  } catch (error: any) {
    console.error('[recruiter-avatar]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
