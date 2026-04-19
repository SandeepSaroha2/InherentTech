/**
 * Job Distribution Module — posts jobs to LinkedIn, Twitter/X, Facebook, and generates XML feeds.
 *
 * Credentials are stored per-org in Organization.settings JSON:
 *   linkedinAccessToken    string  — OAuth 2.0 access token for LinkedIn Share API
 *   linkedinOrganizationId string  — LinkedIn company page URN (e.g. "123456789")
 *   twitterApiKey          string  — Twitter/X API Key (OAuth 1.0a)
 *   twitterApiSecret       string  — Twitter/X API Secret
 *   twitterAccessToken     string  — Twitter/X Access Token (user context)
 *   twitterAccessSecret    string  — Twitter/X Access Token Secret
 *   facebookPageId         string  — Facebook Page ID
 *   facebookPageToken      string  — Long-lived Facebook Page Access Token
 *   jobBoardUrl            string  — Public job board base URL (e.g. https://jobs.inherenttech.com)
 *
 * Each function returns a DistributionResult describing what happened.
 */

export interface JobForDistribution {
  id:          string;
  title:       string;
  description: string;
  location:    string | null;
  requirements: string[];
  rateRange:   { min?: number; max?: number; type?: string } | null;
  openings:    number;
  createdAt:   Date;
  client?:     { companyName: string } | null;
  jobNumber?:  number | null;
}

export interface DistributionResult {
  platform:    'linkedin' | 'twitter' | 'facebook' | 'xml_feed';
  success:     boolean;
  postId?:     string;          // platform's ID for the created post
  url?:        string;          // URL of the post on the platform
  error?:      string;
  skipped?:    boolean;         // true if credentials not configured
  skipReason?: string;
}

export interface OrgDistributionSettings {
  // Org-level (company page / account) credentials
  linkedinAccessToken?:    string;
  linkedinOrganizationId?: string;
  twitterApiKey?:          string;
  twitterApiSecret?:       string;
  twitterAccessToken?:     string;
  twitterAccessSecret?:    string;
  facebookPageId?:         string;
  facebookPageToken?:      string;
  jobBoardUrl?:            string;
  // Per-recruiter overrides (injected by distribute route from recruiterSettings[email].social)
  recruiterLinkedinToken?:    string;   // personal w_member_social OAuth 2.0 token
  recruiterLinkedinPersonUrn?: string;  // full URN from introspect: "urn:li:member:123" or "urn:li:person:abc"
  /** @deprecated use recruiterLinkedinPersonUrn */ recruiterLinkedinPersonId?: string;
  recruiterTwitterToken?:     string;   // personal OAuth 2.0 Bearer token (from our /connect flow)
  recruiterTwitterRefresh?:   string;   // OAuth 2.0 refresh token (offline.access scope)
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function jobUrl(settings: OrgDistributionSettings, jobId: string): string {
  const base = (settings.jobBoardUrl || process.env.JOB_BOARD_URL || 'https://jobs.inherenttech.com').replace(/\/$/, '');
  return `${base}/jobs/${jobId}`;
}

function rateLabel(rateRange: JobForDistribution['rateRange']): string {
  if (!rateRange) return '';
  const { min, max } = rateRange;
  if (min && max && min !== max) return ` · $${min}–$${max}/hr`;
  if (min) return ` · $${min}/hr`;
  return '';
}

function buildJobPostText(job: JobForDistribution, url: string): string {
  const topReqs = (job.requirements || []).slice(0, 4).join(' · ');
  const rate = rateLabel(job.rateRange);
  const location = job.location ? ` · ${job.location}` : '';
  return [
    `🚀 We're hiring: ${job.title}${location}${rate}`,
    topReqs ? `\n🛠 ${topReqs}` : '',
    `\n📋 Apply here: ${url}`,
    '\n#Jobs #Hiring #TechJobs #Staffing #InherentTech',
  ].filter(Boolean).join('');
}

// ── LinkedIn Share API ─────────────────────────────────────────────────────────

/**
 * Post a job as a link share on the LinkedIn company page.
 * Uses the LinkedIn UGC Post API (ugcPosts endpoint).
 * Scope required: w_organization_social
 */
export async function postToLinkedIn(
  job: JobForDistribution,
  settings: OrgDistributionSettings,
): Promise<DistributionResult> {
  // Prefer org-level company page; fall back to recruiter personal token
  const token  = settings.linkedinAccessToken || settings.recruiterLinkedinToken;
  const orgUrn = settings.linkedinOrganizationId;
  const isPersonal = !settings.linkedinAccessToken && !!settings.recruiterLinkedinToken;

  if (!token) {
    return {
      platform:   'linkedin',
      success:    false,
      skipped:    true,
      skipReason: 'LinkedIn not connected — add access token and organization ID in Settings → Integrations',
    };
  }

  const url  = jobUrl(settings, job.id);
  const text = buildJobPostText(job, url);

  // Resolve author URN:
  //   - Org-level company page:  urn:li:organization:{numericId}
  //   - Personal (recruiter):    the personUrn stored at connect time via /v2/introspectToken
  //     Stored as full URN: "urn:li:member:123456789" (from introspect) or
  //     "urn:li:person:ALPHANUMERIC" (from /v2/me fallback).
  let author: string;
  if (!isPersonal && orgUrn) {
    author = `urn:li:organization:${orgUrn}`;
  } else {
    // Use the full personUrn stored at connect time (preferred) or legacy personId
    const storedUrn = settings.recruiterLinkedinPersonUrn || '';
    const legacyId  = settings.recruiterLinkedinPersonId  || '';

    if (storedUrn) {
      // Already a full URN (urn:li:member:… or urn:li:person:…)
      author = storedUrn;
    } else if (legacyId) {
      // Older tokens — build urn:li:member if numeric, urn:li:person if alphanumeric
      author = /^\d+$/.test(legacyId)
        ? `urn:li:member:${legacyId}`
        : `urn:li:person:${legacyId}`;
    } else {
      // No stored URN — try live introspect (client-credential call, no user scope needed)
      let resolvedUrn = '';
      try {
        const introRes = await fetch('https://api.linkedin.com/v2/introspectToken', {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body:    new URLSearchParams({
            token:         token,
            client_id:     process.env.LINKEDIN_CLIENT_ID     || '',
            client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
          }).toString(),
        });
        if (introRes.ok) {
          const intro = await introRes.json() as { authorized_user?: string };
          resolvedUrn = intro.authorized_user || '';
        }
      } catch { /* ignore */ }

      if (!resolvedUrn) {
        return {
          platform: 'linkedin',
          success:  false,
          error:    'Could not resolve LinkedIn member URN — reconnect LinkedIn in Settings → Recruiters',
        };
      }
      author = resolvedUrn;
    }
  }

  const payload = {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary:    { text },
        shareMediaCategory: 'ARTICLE',
        media: [{
          status:      'READY',
          description: { text: (job.description || '').slice(0, 256) },
          originalUrl: url,
          title:       { text: job.title },
        }],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  try {
    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method:  'POST',
      headers: {
        'Authorization':  `Bearer ${token}`,
        'Content-Type':   'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`LinkedIn API ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json() as { id?: string };
    const postId = data.id || '';
    return {
      platform: 'linkedin',
      success:  true,
      postId,
      url: `https://www.linkedin.com/feed/update/${postId}`,
    };
  } catch (e: any) {
    return { platform: 'linkedin', success: false, error: e.message };
  }
}

// ── Twitter / X API v2 ─────────────────────────────────────────────────────────

/**
 * Post a tweet announcing the new job.
 * Uses Twitter API v2 with OAuth 1.0a user context.
 * Requires: API Key + Secret + Access Token + Access Token Secret.
 */
export async function postToTwitter(
  job: JobForDistribution,
  settings: OrgDistributionSettings,
): Promise<DistributionResult> {
  // Per-recruiter: OAuth 2.0 Bearer token (from our /connect OAuth flow)
  const recruiterBearer = settings.recruiterTwitterToken;
  // Org-level: OAuth 1.0a credentials
  const apiKey        = settings.twitterApiKey        || process.env.TWITTER_API_KEY;
  const apiSecret     = settings.twitterApiSecret     || process.env.TWITTER_API_SECRET;
  const accessToken   = settings.twitterAccessToken   || process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret  = settings.twitterAccessSecret  || process.env.TWITTER_ACCESS_SECRET;

  const hasOAuth2 = !!recruiterBearer;
  const hasOAuth1 = !!(apiKey && apiSecret && accessToken && accessSecret);

  if (!hasOAuth2 && !hasOAuth1) {
    return {
      platform:   'twitter',
      success:    false,
      skipped:    true,
      skipReason: 'Twitter/X not connected — add API credentials in Settings → Integrations',
    };
  }

  const url  = jobUrl(settings, job.id);
  // Twitter max 280 chars — keep it punchy
  const location = job.location ? ` | ${job.location}` : '';
  const rate = rateLabel(job.rateRange);
  let tweet = `🚀 Hiring: ${job.title}${location}${rate}\n\nApply: ${url}\n\n#Hiring #TechJobs #IT`;
  if (tweet.length > 280) tweet = `🚀 Hiring: ${job.title}${location}\n\nApply: ${url}\n\n#Hiring #TechJobs`;

  /**
   * Attempt to post a tweet. If we get a 401 and have a refresh token,
   * refresh the access token once and retry automatically.
   */
  const attemptTweet = async (bearer: string | undefined, oauth1: boolean): Promise<DistributionResult> => {
    const tweetBody = JSON.stringify({ text: tweet });
    const authHeader = oauth1
      ? buildOAuth1Header('POST', 'https://api.twitter.com/2/tweets', {}, apiKey!, apiSecret!, accessToken!, accessSecret!)
      : `Bearer ${bearer}`;

    const res = await fetch('https://api.twitter.com/2/tweets', {
      method:  'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body:    tweetBody,
    });

    if (res.ok) {
      const data = await res.json() as { data?: { id?: string } };
      const tweetId = data.data?.id || '';
      return { platform: 'twitter', success: true, postId: tweetId, url: `https://x.com/i/web/status/${tweetId}` };
    }

    const errText = await res.text();

    // 401 + OAuth2 + refresh token → try refreshing once
    if (res.status === 401 && !oauth1 && settings.recruiterTwitterRefresh) {
      const credentials = Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString('base64');

      const refreshRes = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type:    'refresh_token',
          refresh_token: settings.recruiterTwitterRefresh,
        }).toString(),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json() as { access_token?: string };
        const newBearer = refreshData.access_token;
        if (newBearer) {
          const retry = await fetch('https://api.twitter.com/2/tweets', {
            method:  'POST',
            headers: { 'Authorization': `Bearer ${newBearer}`, 'Content-Type': 'application/json' },
            body:    tweetBody,
          });
          if (retry.ok) {
            const retryData = await retry.json() as { data?: { id?: string } };
            const tweetId = retryData.data?.id || '';
            return { platform: 'twitter', success: true, postId: tweetId, url: `https://x.com/i/web/status/${tweetId}` };
          }
          const retryErr = await retry.text();
          throw new Error(`Twitter API ${retry.status} (after refresh): ${retryErr.slice(0, 300)}`);
        }
      }
      throw new Error(`Twitter token expired and refresh failed — please reconnect Twitter in Settings → Recruiters`);
    }

    throw new Error(`Twitter API ${res.status}: ${errText.slice(0, 300)}`);
  };

  try {
    return await attemptTweet(recruiterBearer, !hasOAuth2 && hasOAuth1);
  } catch (e: any) {
    return { platform: 'twitter', success: false, error: e.message };
  }
}

// ── Facebook Page Feed API ─────────────────────────────────────────────────────

/**
 * Post a link share to the Facebook company page.
 * Uses Graph API with a long-lived Page Access Token.
 * Requires: page_id + page_access_token.
 */
export async function postToFacebook(
  job: JobForDistribution,
  settings: OrgDistributionSettings,
): Promise<DistributionResult> {
  const pageId    = settings.facebookPageId    || process.env.FACEBOOK_PAGE_ID;
  const pageToken = settings.facebookPageToken || process.env.FACEBOOK_PAGE_TOKEN;

  if (!pageId || !pageToken) {
    return {
      platform:   'facebook',
      success:    false,
      skipped:    true,
      skipReason: 'Facebook not connected — add Page ID and Page Token in Settings → Integrations',
    };
  }

  const url     = jobUrl(settings, job.id);
  const message = buildJobPostText(job, url);

  try {
    const params = new URLSearchParams({
      message,
      link:         url,
      access_token: pageToken,
    });

    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook API ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json() as { id?: string; error?: { message: string } };
    if (data.error) throw new Error(data.error.message);

    const postId = data.id || '';
    return {
      platform: 'facebook',
      success:  true,
      postId,
      url:      `https://www.facebook.com/${postId.replace('_', '/posts/')}`,
    };
  } catch (e: any) {
    return { platform: 'facebook', success: false, error: e.message };
  }
}

// ── Distribute to all configured channels ─────────────────────────────────────

export async function distributeJob(
  job: JobForDistribution,
  settings: OrgDistributionSettings,
  channels: ('linkedin' | 'twitter' | 'facebook')[] = ['linkedin', 'twitter', 'facebook'],
): Promise<DistributionResult[]> {
  const results: DistributionResult[] = [];
  const tasks: Promise<DistributionResult>[] = [];

  if (channels.includes('linkedin')) tasks.push(postToLinkedIn(job, settings));
  if (channels.includes('twitter'))  tasks.push(postToTwitter(job, settings));
  if (channels.includes('facebook')) tasks.push(postToFacebook(job, settings));

  const settled = await Promise.allSettled(tasks);
  for (const s of settled) {
    if (s.status === 'fulfilled') results.push(s.value);
    else results.push({ platform: 'linkedin', success: false, error: s.reason?.message });
  }
  return results;
}

// ── XML Job Feed ───────────────────────────────────────────────────────────────

/**
 * Generate an Indeed/ZipRecruiter/SimplyHired-compatible XML job feed.
 * Host the output at a public URL and submit it to each job board's partner portal.
 */
export function generateXmlFeed(
  jobs: JobForDistribution[],
  settings: OrgDistributionSettings & { publisherName?: string; publisherUrl?: string },
): string {
  const publisher    = settings.publisherName || 'InherentTech Staffing';
  const publisherUrl = (settings.publisherUrl || settings.jobBoardUrl || process.env.JOB_BOARD_URL || 'https://jobs.inherenttech.com').replace(/\/$/, '');

  const jobItems = jobs.map(job => {
    const jobPageUrl = `${publisherUrl}/jobs/${job.id}`;
    const rr         = job.rateRange as any;
    const salary     = rr?.min && rr?.max ? `$${rr.min}–$${rr.max}/hr` : rr?.min ? `$${rr.min}/hr` : '';
    const location   = job.location || 'Remote';
    const isRemote   = /remote/i.test(location);

    // Split "City, ST" into city + state
    const locationParts = location.split(',').map((s: string) => s.trim());
    const city  = locationParts[0] || '';
    const state = locationParts[1] || '';

    const descHtml = (job.description || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const reqHtml = job.requirements?.length
      ? `<ul>${job.requirements.map(r => `<li>${r.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('')}</ul>`
      : '';

    return `  <job>
    <title><![CDATA[${job.title}]]></title>
    <date><![CDATA[${job.createdAt.toUTCString()}]]></date>
    <referencenumber><![CDATA[${job.jobNumber ? `INH-${String(job.jobNumber).padStart(4, '0')}` : job.id}]]></referencenumber>
    <url><![CDATA[${jobPageUrl}]]></url>
    <company><![CDATA[${publisher}]]></company>
    <city><![CDATA[${city}]]></city>
    <state><![CDATA[${state}]]></state>
    <country><![CDATA[US]]></country>
    <postalcode><![CDATA[]]></postalcode>
    <description><![CDATA[${descHtml}${reqHtml ? '\n' + reqHtml : ''}]]></description>
    ${salary ? `<salary><![CDATA[${salary}]]></salary>` : ''}
    <jobtype><![CDATA[contract]]></jobtype>
    <category><![CDATA[Information Technology]]></category>
    ${isRemote ? '<remotetype><![CDATA[Remote]]></remotetype>' : ''}
  </job>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher><![CDATA[${publisher}]]></publisher>
  <publisherurl><![CDATA[${publisherUrl}]]></publisherurl>
  <lastBuildDate><![CDATA[${new Date().toUTCString()}]]></lastBuildDate>
${jobItems}
</source>`;
}

// ── OAuth 1.0a HMAC-SHA1 helper (Twitter) ────────────────────────────────────
// Node.js built-in crypto — no external deps needed

function buildOAuth1Header(
  method: string, url: string,
  params: Record<string, string>,
  consumerKey: string, consumerSecret: string,
  token: string, tokenSecret: string,
): string {
  // Dynamic import to avoid issues in edge runtimes
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto') as typeof import('crypto');

  const nonce     = crypto.randomBytes(16).toString('hex');
  const timestamp = String(Math.floor(Date.now() / 1000));

  const oauthParams: Record<string, string> = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        timestamp,
    oauth_token:            token,
    oauth_version:          '1.0',
  };

  const allParams: Record<string, string> = { ...params, ...oauthParams };
  const sortedParams = Object.keys(allParams).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&');

  const sigBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature  = crypto.createHmac('sha1', signingKey)
    .update(sigBaseString).digest('base64');

  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams).sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}
