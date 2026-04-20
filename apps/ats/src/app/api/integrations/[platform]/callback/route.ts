/**
 * GET /api/integrations/[platform]/callback
 *
 * OAuth callback — exchanges the authorization code for an access token
 * and saves it to the org's settings JSON.
 *
 * After saving, redirects to /settings#integrations.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://ats.aiocrm.com').replace(/\/$/, '');

interface TokenResponse {
  access_token:  string;
  token_type?:   string;
  expires_in?:   number;
  refresh_token?: string;
  scope?:        string;
}

async function exchangeLinkedIn(code: string, redirectUri: string): Promise<TokenResponse> {
  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  redirectUri,
      client_id:     process.env.LINKEDIN_CLIENT_ID || '',
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
    }).toString(),
  });
  if (!res.ok) throw new Error(`LinkedIn token exchange failed: ${await res.text()}`);
  return res.json();
}

async function exchangeTwitter(code: string, redirectUri: string): Promise<TokenResponse> {
  const credentials = Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type:     'authorization_code',
      code,
      redirect_uri:   redirectUri,
      code_verifier:  'challenge',   // matches the plain code_challenge in connect route
    }).toString(),
  });
  if (!res.ok) throw new Error(`Twitter token exchange failed: ${await res.text()}`);
  return res.json();
}

async function exchangeFacebook(code: string, redirectUri: string): Promise<TokenResponse> {
  const res = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
    client_id:     process.env.FACEBOOK_APP_ID || '',
    client_secret: process.env.FACEBOOK_APP_SECRET || '',
    redirect_uri:  redirectUri,
    code,
  })}`, { method: 'GET' });
  if (!res.ok) throw new Error(`Facebook token exchange failed: ${await res.text()}`);
  const data = await res.json() as any;

  // Exchange short-lived token for long-lived Page token
  const longLivedRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
    grant_type:        'fb_exchange_token',
    client_id:         process.env.FACEBOOK_APP_ID || '',
    client_secret:     process.env.FACEBOOK_APP_SECRET || '',
    fb_exchange_token: data.access_token,
  })}`);
  if (!longLivedRes.ok) return data;
  return longLivedRes.json();
}

async function exchangeGoogle(code: string, redirectUri: string): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  redirectUri,
      client_id:     process.env.GOOGLE_CLIENT_ID     || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    }).toString(),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;
  const { searchParams } = request.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Decode state early so we know if this is recruiter-scoped
  let orgId          = '';
  let recruiterEmail = '';

  // ── DEBUG: full callback URL + all cookies ──────────────────────────────────
  console.log(`[callback] full URL: ${request.nextUrl.toString()}`);
  console.log(`[callback] all cookies: ${JSON.stringify([...request.cookies.getAll().map(c => `${c.name}=${c.value}`)])}`);
  console.log(`[callback] ${platform} hit — code=${!!code} state=${state?.slice(0,40)}… error=${error}`);

  if (!code || !state) {
    console.log(`[callback] missing code or state → integrations`);
    return NextResponse.redirect(`${APP_URL}/settings?tab=integrations&error=missing_code`);
  }

  try {
    // Try hex first (new encoding), then base64url, then standard base64
    let decoded: any;
    try {
      decoded = JSON.parse(Buffer.from(state, 'hex').toString());
    } catch {
      try {
        decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
      } catch {
        decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      }
    }
    orgId          = decoded.orgId          || '';
    recruiterEmail = decoded.recruiterEmail || '';
    console.log(`[callback] decoded state → orgId=${orgId} recruiterEmail="${recruiterEmail}"`);
  } catch {
    console.log(`[callback] state decode failed — raw state: ${state}`);
    return NextResponse.redirect(`${APP_URL}/settings?tab=integrations&error=invalid_state`);
  }

  // Primary fallback: cookie set by connect route
  const cookieEmail = request.cookies.get('oauth_recruiter_email')?.value || '';
  console.log(`[callback] cookie oauth_recruiter_email="${cookieEmail}"`);
  if (!recruiterEmail && cookieEmail) {
    recruiterEmail = cookieEmail;
    console.log(`[callback] using cookie as recruiterEmail: "${recruiterEmail}"`);
  }

  // Redirect destination differs: recruiter flow → recruiters tab; org flow → integrations tab
  const redirectTo = recruiterEmail
    ? `${APP_URL}/settings?tab=recruiters`
    : `${APP_URL}/settings?tab=integrations`;

  console.log(`[callback] recruiterEmail="${recruiterEmail}" → redirectTo=${redirectTo}`);

  if (error) {
    return NextResponse.redirect(`${redirectTo}&error=${encodeURIComponent(error)}`);
  }

  if (!orgId) {
    return NextResponse.redirect(`${redirectTo}&error=missing_org`);
  }

  const redirectUri = `${APP_URL}/api/integrations/${platform}/callback`;

  try {
    let tokenData: TokenResponse;
    let settingsPatch: Record<string, any> = {};

    switch (platform) {
      case 'linkedin': {
        tokenData = await exchangeLinkedIn(code, redirectUri);

        // Get the member's numeric ID from /v2/userinfo (requires openid scope).
        // Returns sub = numeric LinkedIn member ID → urn:li:member:{sub} for UGC Posts.
        // Fallback: /v2/introspectToken (authorized_user field).
        let liPersonUrn = '';
        let liOrgUrn    = '';

        // Step 1: /v2/userinfo (openid scope) → sub is OIDC subject identifier
        // LinkedIn returns a pseudonymous alphanumeric id (e.g. "-nIgmA7Lve"),
        // NOT the legacy numeric member ID. UGC Posts accepts it as
        // urn:li:person:{sub} (verified empirically — returned 201).
        try {
          const uiRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
          });
          if (uiRes.ok) {
            const ui = await uiRes.json() as { sub?: string; id?: string };
            const sub = ui.sub || ui.id || '';
            if (sub) {
              // Numeric sub → urn:li:member:{digits}; alphanumeric → urn:li:person:{sub}
              liPersonUrn = /^\d+$/.test(sub)
                ? `urn:li:member:${sub}`
                : `urn:li:person:${sub}`;
            }
            console.log(`[linkedin callback] userinfo sub=${sub} → ${liPersonUrn}`);
          } else {
            console.log(`[linkedin callback] userinfo failed: ${uiRes.status} (token may lack openid scope)`);
          }
        } catch (e: any) {
          console.log(`[linkedin callback] userinfo error: ${e.message}`);
        }

        // Step 2: fallback → token introspection (authorized_user = full URN)
        if (!liPersonUrn) {
          try {
            const introRes = await fetch('https://api.linkedin.com/v2/introspectToken', {
              method:  'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body:    new URLSearchParams({
                token:         tokenData.access_token,
                client_id:     process.env.LINKEDIN_CLIENT_ID     || '',
                client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
              }).toString(),
            });
            if (introRes.ok) {
              const intro = await introRes.json() as { authorized_user?: string };
              liPersonUrn = intro.authorized_user || '';
              console.log(`[linkedin callback] introspect fallback: ${liPersonUrn}`);
            }
          } catch { /* ignore */ }
        }

        if (!recruiterEmail) {
          // Org-level: try to fetch the LinkedIn company page org ID
          try {
            const orgRes = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&count=1', {
              headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
            });
            const orgData = orgRes.ok ? await orgRes.json() as any : null;
            liOrgUrn = orgData?.elements?.[0]?.organization?.split(':').pop() || '';
          } catch { /* ignore */ }
        }

        settingsPatch = {
          linkedinAccessToken:    tokenData.access_token,
          linkedinPersonUrn:      liPersonUrn,   // full URN — used directly as UGC Posts author
          linkedinOrganizationId: liOrgUrn,
          linkedinConnectedAt:    new Date().toISOString(),
        };
        break;
      }
      case 'twitter': {
        tokenData = await exchangeTwitter(code, redirectUri);
        settingsPatch = {
          twitterAccessToken:    tokenData.access_token,
          twitterRefreshToken:   tokenData.refresh_token,
          twitterConnectedAt:    new Date().toISOString(),
        };
        break;
      }
      case 'facebook': {
        tokenData = await exchangeFacebook(code, redirectUri);
        // Fetch managed pages and get the first page's access token
        const pagesRes = await fetch(
          `https://graph.facebook.com/v19.0/me/accounts?access_token=${tokenData.access_token}`
        );
        const pagesData = pagesRes.ok ? await pagesRes.json() as any : null;
        const firstPage = pagesData?.data?.[0];
        settingsPatch = {
          facebookPageId:         firstPage?.id   || '',
          facebookPageToken:      firstPage?.access_token || tokenData.access_token,
          facebookPageName:       firstPage?.name || '',
          facebookConnectedAt:    new Date().toISOString(),
        };
        break;
      }
      case 'google': {
        tokenData = await exchangeGoogle(code, redirectUri);
        settingsPatch = {
          googleAccessToken:  tokenData.access_token,
          googleRefreshToken: tokenData.refresh_token,
          googleConnectedAt:  new Date().toISOString(),
        };
        break;
      }
      default:
        return NextResponse.redirect(`${redirectTo}&error=unknown_platform`);
    }

    // Save to org settings — either per-recruiter or org-level
    const org     = await prisma.organization.findUnique({ where: { id: orgId }, select: { settings: true } });
    const current = (org?.settings as Record<string, any>) || {};

    if (recruiterEmail) {
      // Per-recruiter: normalize patch keys → compact format stored under social[platform]
      let socialPatch: Record<string, any>;
      switch (platform) {
        case 'linkedin':
          socialPatch = {
            accessToken:    settingsPatch.linkedinAccessToken,
            personUrn:      settingsPatch.linkedinPersonUrn,      // full URN e.g. urn:li:member:123
            organizationId: settingsPatch.linkedinOrganizationId,
            connectedAt:    settingsPatch.linkedinConnectedAt,
          };
          break;
        case 'twitter':
          socialPatch = {
            accessToken:   settingsPatch.twitterAccessToken,
            refreshToken:  settingsPatch.twitterRefreshToken,
            connectedAt:   settingsPatch.twitterConnectedAt,
          };
          break;
        case 'facebook':
          socialPatch = {
            pageId:      settingsPatch.facebookPageId,
            pageToken:   settingsPatch.facebookPageToken,
            pageName:    settingsPatch.facebookPageName,
            connectedAt: settingsPatch.facebookConnectedAt,
          };
          break;
        case 'google':
          socialPatch = {
            accessToken:  settingsPatch.googleAccessToken,
            refreshToken: settingsPatch.googleRefreshToken,
            connectedAt:  settingsPatch.googleConnectedAt,
          };
          break;
        default:
          socialPatch = settingsPatch;
      }

      const recruiterSettings = { ...(current.recruiterSettings || {}) };
      recruiterSettings[recruiterEmail] = {
        ...(recruiterSettings[recruiterEmail] || {}),
        social: {
          ...((recruiterSettings[recruiterEmail]?.social) || {}),
          [platform]: socialPatch,
        },
      };
      await prisma.organization.update({
        where: { id: orgId },
        data:  { settings: { ...current, recruiterSettings } },
      });
    } else {
      // Org-level: store at top level of settings (original flat structure)
      await prisma.organization.update({
        where: { id: orgId },
        data:  { settings: { ...current, ...settingsPatch } },
      });
    }

    const successParam = recruiterEmail
      ? `&connected=${platform}&recruiter=${encodeURIComponent(recruiterEmail)}`
      : `&connected=${platform}`;
    const successResponse = NextResponse.redirect(`${redirectTo}${successParam}`);
    successResponse.cookies.delete('oauth_recruiter_email'); // clear one-time cookie
    return successResponse;
  } catch (e: any) {
    console.error(`[integrations] ${platform} callback error:`, e.message);
    const errResponse = NextResponse.redirect(`${redirectTo}&error=${encodeURIComponent(e.message.slice(0, 100))}`);
    errResponse.cookies.delete('oauth_recruiter_email');
    return errResponse;
  }
}
