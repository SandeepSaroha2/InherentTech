/**
 * GET /api/integrations/[platform]/connect
 *
 * Initiates the OAuth flow for a given platform.
 * Redirects the browser to the platform's authorization page.
 *
 * Supported platforms: linkedin | twitter | facebook | google
 *
 * Required env vars per platform:
 *   LinkedIn:  LINKEDIN_CLIENT_ID, LINKEDIN_REDIRECT_URI
 *   Twitter:   TWITTER_CLIENT_ID,  TWITTER_REDIRECT_URI  (OAuth 2.0 PKCE)
 *   Facebook:  FACEBOOK_APP_ID,    FACEBOOK_REDIRECT_URI
 */
import { NextRequest, NextResponse } from 'next/server';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://ats.aiocrm.com').replace(/\/$/, '');

const CONFIGS: Record<string, {
  authUrl:  string;
  clientId: string;
  scope:    string;
  extras?:  Record<string, string>;
}> = {
  linkedin: {
    authUrl:  'https://www.linkedin.com/oauth/v2/authorization',
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    // IMPORTANT: dropped `openid` because LinkedIn was rejecting our OAuth with
    //   `unauthorized_scope_error — Scope "r_liteprofile" is not authorized`
    // even though the OIDC product appears enabled. w_member_social alone is
    // sufficient to POST as the member; we capture the member URN post-login
    // via /v2/userinfo (best-effort — works IF the token has openid implicitly).
    scope:    'w_member_social',
    extras:   { response_type: 'code' },
  },
  twitter: {
    authUrl:  'https://twitter.com/i/oauth2/authorize',
    clientId: process.env.TWITTER_CLIENT_ID || '',
    scope:    'tweet.read tweet.write users.read offline.access',
    extras:   {
      response_type:         'code',
      code_challenge_method: 'plain',
      code_challenge:        'challenge',  // In production use PKCE S256
    },
  },
  facebook: {
    authUrl:  'https://www.facebook.com/v19.0/dialog/oauth',
    clientId: process.env.FACEBOOK_APP_ID || '',
    scope:    'pages_manage_posts,pages_read_engagement',
    extras:   { response_type: 'code' },
  },
  google: {
    authUrl:  'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    // Business Profile API scope for posting to Google Business locations
    scope:    'https://www.googleapis.com/auth/business.manage openid email profile',
    extras:   { response_type: 'code', access_type: 'offline', prompt: 'consent' },
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;
  const config = CONFIGS[platform];

  // ── DEBUG: dump the full incoming URL so we can confirm query params ──────
  console.log(`[connect] full URL: ${request.nextUrl.toString()}`);

  if (!config) {
    return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 });
  }

  if (!config.clientId) {
    return NextResponse.json({
      error: `${platform} client ID not configured. Add ${platform.toUpperCase().replace('TWITTER','TWITTER')}_CLIENT_ID to your environment variables.`,
      setupRequired: true,
    }, { status: 400 });
  }

  // Store orgId (and optional recruiterEmail) in state so callback routes correctly
  const orgId          = request.headers.get('x-org-id') || request.nextUrl.searchParams.get('orgId') || '';
  const recruiterEmail = request.nextUrl.searchParams.get('recruiterEmail') || '';
  const redirectUri    = `${APP_URL}/api/integrations/${platform}/callback`;

  console.log(`[connect] platform=${platform} orgId=${orgId} recruiterEmail="${recruiterEmail}"`);

  const statePayload: Record<string, string> = { orgId, platform };
  if (recruiterEmail) statePayload.recruiterEmail = recruiterEmail;

  // Use hex encoding — only [0-9a-f] chars, completely URL-safe, no base64 edge cases
  const stateHex = Buffer.from(JSON.stringify(statePayload)).toString('hex');
  console.log(`[connect] state payload: ${JSON.stringify(statePayload)}`);
  console.log(`[connect] state hex: ${stateHex}`);

  const authParams = new URLSearchParams({
    client_id:     config.clientId,
    redirect_uri:  redirectUri,
    scope:         config.scope,
    state:         stateHex,
    ...config.extras,
  });

  const response = NextResponse.redirect(`${config.authUrl}?${authParams.toString()}`);

  // Belt-and-suspenders: store recruiterEmail in a short-lived cookie.
  // sameSite:'none' + secure:true is the most permissive option — always sent on
  // cross-site requests including OAuth redirects back from LinkedIn.
  if (recruiterEmail) {
    response.cookies.set('oauth_recruiter_email', recruiterEmail, {
      httpOnly: true,
      path:     '/api/integrations',
      maxAge:   600,
      sameSite: 'none',
      secure:   true,  // required for sameSite:none; HTTPS via Cloudflare tunnel
    });
    console.log(`[connect] set cookie oauth_recruiter_email="${recruiterEmail}"`);
  } else {
    response.cookies.delete('oauth_recruiter_email');
    console.log(`[connect] cleared oauth_recruiter_email cookie (org-level connect)`);
  }

  return response;
}
