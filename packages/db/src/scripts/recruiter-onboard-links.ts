/**
 * recruiter-onboard-links.ts
 *
 * Generates OAuth connect links for every recruiter × every social platform.
 * Also shows current connection status from the DB.
 *
 * Usage:
 *   npx tsx packages/db/src/scripts/recruiter-onboard-links.ts
 *   npx tsx packages/db/src/scripts/recruiter-onboard-links.ts --open   # open all unconnected links in browser
 *   npx tsx packages/db/src/scripts/recruiter-onboard-links.ts --email preeti@xgnmail.com  # one recruiter only
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { execSync } from 'child_process';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const prisma = new PrismaClient();

// ── Config ─────────────────────────────────────────────────────────────────────

const APP_URL      = (process.env.NEXT_PUBLIC_APP_URL || 'https://ats.aiocrm.com').replace(/\/$/, '');
const ORG_SLUG     = 'inherenttech'; // used to look up the org

const RECRUITERS = [
  { name: 'Preeti',   email: 'preeti@xgnmail.com'   },
  { name: 'Priya',    email: 'priya@xgnmail.com'    },
  { name: 'Parul',    email: 'parul@xgnmail.com'    },
  { name: 'Pritisha', email: 'pritisha@xgnmail.com' },
  { name: 'Pari',     email: 'pari@xgnmail.com'     },
];

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn',        color: '\x1b[34m', env: 'LINKEDIN_CLIENT_ID'  },
  { id: 'twitter',  label: 'Twitter / X',     color: '\x1b[90m', env: 'TWITTER_CLIENT_ID'   },
  { id: 'facebook', label: 'Facebook',        color: '\x1b[34m', env: 'FACEBOOK_APP_ID'     },
  { id: 'google',   label: 'Google Business', color: '\x1b[31m', env: 'GOOGLE_CLIENT_ID'    },
] as const;

type PlatformId = typeof PLATFORMS[number]['id'];

// ── Colours ────────────────────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
};

function isConnected(social: any, platform: PlatformId): boolean {
  if (!social) return false;
  switch (platform) {
    case 'linkedin': return !!social.linkedin?.accessToken;
    case 'twitter':  return !!social.twitter?.accessToken;
    case 'facebook': return !!social.facebook?.pageToken;
    case 'google':   return !!social.google?.accessToken;
  }
}

function buildConnectUrl(orgId: string, recruiterEmail: string, platform: string): string {
  const state = Buffer.from(JSON.stringify({ orgId, platform, recruiterEmail })).toString('base64');
  // Build the full OAuth URL via our connect route params
  return `${APP_URL}/api/integrations/${platform}/connect?orgId=${encodeURIComponent(orgId)}&recruiterEmail=${encodeURIComponent(recruiterEmail)}`;
}

function envConfigured(envKey: string): boolean {
  return !!(process.env[envKey] && process.env[envKey]!.trim().length > 0);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args         = process.argv.slice(2);
  const openBrowser  = args.includes('--open');
  const filterEmail  = args.find(a => a.startsWith('--email'))?.split('=')[1]
                    || (args.indexOf('--email') !== -1 ? args[args.indexOf('--email') + 1] : null);

  // Find org
  const org = await prisma.organization.findFirst({
    where: { name: { contains: 'Inherent', mode: 'insensitive' } },
    select: { id: true, name: true, settings: true },
  });

  if (!org) {
    console.error(`${C.red}✗ Could not find InherentTech org in DB${C.reset}`);
    process.exit(1);
  }

  const orgSettings     = (org.settings as Record<string, any>) || {};
  const recruiterSettings = orgSettings.recruiterSettings || {};

  const recruiters = filterEmail
    ? RECRUITERS.filter(r => r.email === filterEmail)
    : RECRUITERS;

  if (filterEmail && recruiters.length === 0) {
    console.error(`${C.red}✗ No recruiter found with email: ${filterEmail}${C.reset}`);
    process.exit(1);
  }

  console.log(`\n${C.bold}${C.cyan}╔══════════════════════════════════════════════════════╗`);
  console.log(`║      InherentTech Recruiter Social Onboarding         ║`);
  console.log(`╚══════════════════════════════════════════════════════╝${C.reset}\n`);
  console.log(`${C.dim}Org: ${org.name} (${org.id})${C.reset}`);
  console.log(`${C.dim}ATS: ${APP_URL}${C.reset}\n`);

  // Check which platforms are configured
  console.log(`${C.bold}── Platform credentials ──${C.reset}`);
  const configuredPlatforms: PlatformId[] = [];
  for (const p of PLATFORMS) {
    const ok = envConfigured(p.env);
    if (ok) configuredPlatforms.push(p.id);
    console.log(`  ${ok ? C.green + '✓' : C.red + '✗'}${C.reset} ${p.label.padEnd(18)} ${ok ? C.dim + 'Client ID configured' : C.yellow + 'Missing ' + p.env}${C.reset}`);
  }

  if (configuredPlatforms.length === 0) {
    console.log(`\n${C.yellow}⚠  No platform credentials configured yet.`);
    console.log(`   Add Client IDs to .env then re-run this script.${C.reset}\n`);
  }

  console.log('');

  const urlsToOpen: string[] = [];

  for (const recruiter of recruiters) {
    const rs     = recruiterSettings[recruiter.email] || {};
    const social = rs.social || {};

    const connectedCount   = PLATFORMS.filter(p => isConnected(social, p.id)).length;
    const allConnected     = connectedCount === PLATFORMS.length;

    console.log(`${C.bold}── ${recruiter.name} ${C.dim}(${recruiter.email})${C.reset}  ` +
      `${allConnected ? C.green + '✓ All connected' : C.yellow + `${connectedCount}/${PLATFORMS.length} connected`}${C.reset}`);

    if (rs.avatarUrl) {
      console.log(`   ${C.dim}Avatar: ${rs.avatarUrl}${C.reset}`);
    }

    console.log('');

    for (const platform of PLATFORMS) {
      const connected   = isConnected(social, platform.id);
      const configured  = configuredPlatforms.includes(platform.id);
      const url         = buildConnectUrl(org.id, recruiter.email, platform.id);

      if (connected) {
        const connectedAt = social[platform.id]?.connectedAt;
        console.log(`   ${C.green}✓${C.reset} ${platform.label.padEnd(18)} ${C.dim}Connected${connectedAt ? ' · ' + new Date(connectedAt).toLocaleDateString() : ''}${C.reset}`);
      } else if (!configured) {
        console.log(`   ${C.dim}○${C.reset} ${platform.label.padEnd(18)} ${C.dim}Skipped — credentials not in .env${C.reset}`);
      } else {
        console.log(`   ${C.red}○${C.reset} ${platform.label.padEnd(18)} ${C.cyan}${url}${C.reset}`);
        urlsToOpen.push(url);
      }
    }

    console.log('');
  }

  // Summary
  const totalSlots     = recruiters.length * PLATFORMS.length;
  const totalConnected = recruiters.reduce((sum, r) => {
    const social = (recruiterSettings[r.email]?.social) || {};
    return sum + PLATFORMS.filter(p => isConnected(social, p.id)).length;
  }, 0);
  const remaining = urlsToOpen.length;

  console.log(`${C.bold}── Summary ──${C.reset}`);
  console.log(`  ${C.green}${totalConnected}${C.reset} connected · ${C.yellow}${remaining}${C.reset} pending · ${totalSlots} total slots\n`);

  if (remaining > 0 && configuredPlatforms.length > 0) {
    console.log(`${C.bold}Connect links (open each in a browser where the recruiter is logged in):${C.reset}\n`);
    for (const url of urlsToOpen) {
      console.log(`  ${url}`);
    }
    console.log('');

    if (openBrowser) {
      console.log(`${C.yellow}Opening ${remaining} connect link(s) in browser...${C.reset}`);
      for (const url of urlsToOpen) {
        try {
          execSync(`open "${url}"`);
          await new Promise(r => setTimeout(r, 800)); // stagger slightly
        } catch {}
      }
    } else {
      console.log(`${C.dim}Tip: run with --open to auto-open all pending links in your browser.${C.reset}`);
      console.log(`${C.dim}     run with --email preeti@xgnmail.com to show one recruiter only.${C.reset}\n`);
    }
  } else if (remaining === 0 && totalConnected > 0) {
    console.log(`${C.green}🎉 All recruiters fully connected!${C.reset}\n`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
