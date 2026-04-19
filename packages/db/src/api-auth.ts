import { supabaseAdmin } from './supabase';
import { NextRequest, NextResponse } from 'next/server';

export type ApiAuthUser = {
  id: string;
  email: string;
  orgId: string;
  role: string;
};

/**
 * Validate a Supabase JWT from the Authorization header and return the user.
 * Use in API routes: const user = await authenticateRequest(request);
 */
export async function authenticateRequest(request: NextRequest): Promise<ApiAuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email!,
    orgId: user.user_metadata?.org_id || '',
    role: user.user_metadata?.role || 'EMPLOYEE',
  };
}

/**
 * Middleware helper: returns 401 JSON response if not authenticated.
 * Usage:
 *   const { user, errorResponse } = await requireAuth(request);
 *   if (errorResponse) return errorResponse;
 *   // user is guaranteed non-null here
 */
export async function requireAuth(request: NextRequest): Promise<{
  user: ApiAuthUser | null;
  errorResponse: NextResponse | null;
}> {
  const user = await authenticateRequest(request);
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized', message: 'Valid authentication token required' },
        { status: 401 }
      ),
    };
  }
  return { user, errorResponse: null };
}
