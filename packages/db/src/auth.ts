import { supabase, supabaseAdmin } from './supabase';

export type AuthUser = {
  id: string;
  email: string;
  orgId: string;
  role: string;
};

// Sign up a new user with org assignment
export async function signUp(email: string, password: string, metadata: { orgId: string; role: string; name: string }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        org_id: metadata.orgId,
        role: metadata.role,
        name: metadata.name,
      },
    },
  });
  if (error) throw error;
  return data;
}

// Sign in with email/password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Sign in with magic link
export async function signInWithMagicLink(email: string, redirectTo?: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}

// Sign in with Google OAuth
export async function signInWithGoogle(redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get current session
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// Get current user with org context
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email!,
    orgId: user.user_metadata?.org_id || '',
    role: user.user_metadata?.role || 'EMPLOYEE',
  };
}

// Admin: Update user role (requires service key)
export async function adminUpdateUserRole(userId: string, role: string) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { role },
  });
  if (error) throw error;
}

// Admin: Invite user to org
export async function adminInviteUser(email: string, orgId: string, role: string) {
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { org_id: orgId, role },
  });
  if (error) throw error;
  return data;
}

// Listen for auth state changes
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
