#!/usr/bin/env node
/**
 * Backfill: clean today's job orders by re-running the latest title/description
 * sanitizers on existing rows. Logic is kept in sync with email-poller-core.ts.
 *
 * Usage:
 *   node scripts/backfill-jobs.js --dry-run     # preview only
 *   node scripts/backfill-jobs.js               # apply
 *   node scripts/backfill-jobs.js --since=YYYY-MM-DD   # custom window (default: today)
 *   node scripts/backfill-jobs.js --use-ai-desc        # if description is still bad after sanitize, copy aiDescription instead
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args        = process.argv.slice(2);
const dryRun      = args.includes('--dry-run');
const useAiDesc   = args.includes('--use-ai-desc');
const sinceArg    = args.find(a => a.startsWith('--since='))?.split('=')[1];
const sinceDate   = sinceArg ? new Date(sinceArg) : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

// ─── Helpers (kept in sync with packages/db/src/email-poller-core.ts) ───────

function cleanJobTitle(subject, extractedTitle) {
  const cleaned = (subject || '')
    .replace(/^(?:Fwd|FW|RE|Re|FWD):\s*/gi, '')
    .replace(/^(?:NEW REQ|UPDATE|UPDATED|CLOSED|FRESH|HOT|URGENT|TOP)\s*[:|-]?\s*/gi, '')
    .replace(/^(?:NEW REQ|UPDATE|UPDATED|CLOSED|FRESH|HOT|URGENT|TOP)\s*[:|-]?\s*/gi, '')
    .replace(/^\([^)]+\)\s*[:|-]?\s*/g, '')
    .replace(/^\([^)]+\)\s*[:|-]?\s*/g, '')
    .replace(/\s*\(\d+\)\s*/g, ' ')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const fromTitle = (extractedTitle || '').trim();
  if (fromTitle && fromTitle.length > 5 && fromTitle.length < 200 && !/^(re|fwd?|fw):/i.test(fromTitle)) return fromTitle;
  return cleaned || subject;
}

function sanitizeJobDescription(rawBody, opts = {}) {
  let text = rawBody || '';

  // 0. MIME envelope cleanup
  text = text.replace(/^--[\w=+/-]{20,}(?:--)?\s*$/gim, '');
  text = text.replace(/^Content-(?:Type|Transfer-Encoding|Disposition|ID|Description):\s*.*$/gim, '');
  text = text.replace(/^MIME-Version:\s*.*$/gim, '');
  text = text.replace(/^charset\s*=\s*"[\w-]+"\s*$/gim, '');
  text = text.replace(/=\r?\n/g, '');
  text = text.replace(/=([0-9A-Fa-f]{2})/g, (_m, hex) => {
    const c = parseInt(hex, 16); return c >= 32 && c <= 126 ? String.fromCharCode(c) : ' ';
  });
  text = text.replace(/<\/?(?:[a-zA-Z][\w:-]*)(?:\s+[^>]*)?\/?>/g, '');
  text = text.replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'");

  // 0a. Long base64 image blobs
  text = text.replace(/^[A-Za-z0-9+/]{60,}=*$/gm, '');
  // 0b. Bare hyperlinks <https://...>
  text = text.replace(/<https?:\/\/[^>]+>/g, '');
  // 0c. Empty markdown markers
  text = text.replace(/^\s*\*+\s*\*+\s*$/gm, '');

  // 1. Forwarded-message dividers
  text = text.replace(/^-{2,}\s*Forwarded message\s*-{2,}.*$/gim, '');
  text = text.replace(/^-{5,}\s*Original Message\s*-{5,}.*$/gim, '');

  // 2. Email header lines (plain + markdown-wrapped)
  text = text.replace(/^[ \t>]*(?:[*_]+\s*)?(?:From|To|Cc|Bcc|Date|Sent|Reply-To|Return-Path|Subject|Message-ID|X-[A-Za-z-]+)(?:\s*[*_]+)?\s*:\s*.*$/gim, '');

  // 3. Visa/work-auth lines
  if (opts.redactVisa !== false) {
    text = text.replace(/^[ \t*•·\-]*(?:[*_]*(?:visa(?:\s*status|\s*requirement)?|work\s*auth(?:orization)?)\s*[:\-]\s*.*|usc\s*(?:\/|\s*(?:and|or|&)\s*)\s*gc(?:\s*(?:only|holders?))?.*|gc\s*(?:holders?\s*)?only.*|no\s*(?:third\s*party|opt|h-?1b?|c2c|w2).*|(?:w2|c2c)\s*(?:only|candidates?\s*only).*|(?:h-?1b?|opt|cpt|ead|tn|stem)\s*(?:status|holders?|candidates?\s*only).*|preferred\s*work\s*auth.*)[*_]*$/gim, '');
  }

  // 4. Sign-offs
  text = text.replace(/\n+(?:Thanks(?:\s*(?:&|and)\s*Regards)?|Best Regards|Kind Regards|Sincerely|Regards|Best,?|Looking Forward To Work With You|Cheers)[\s\S]*$/i, '\n');

  // 5. Unsubscribe
  text = text.replace(/(?:^|\n)(?:To unsubscribe|If you (?:wish|want|would like) to unsubscribe|click here to unsubscribe|If you feel you received)[\s\S]*$/i, '\n');

  // 6. Trailing email/LinkedIn/phone lines
  text = text.replace(/^[ \t]*[\w.+-]+@[\w-]+\.[\w.-]+[ \t]*$/gim, '');
  text = text.replace(/^[ \t]*https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+\/?[ \t]*$/gim, '');
  text = text.replace(/^[ \t]*\+?\d?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}[ \t]*$/gm, '');

  // 7. Disclaimer / confidentiality boilerplate
  text = text.replace(/(?:^|\n)\s*[*_]?Disclaimer\s*[*_]?\s*:[\s\S]*$/i, '\n');
  text = text.replace(/(?:^|\n)\s*Confidentiality (?:Notice|Statement)\s*:[\s\S]*$/i, '\n');

  // 8. InherentTech corporate footer
  text = text.replace(/^The harder you work, the luckier you get\s*$/gim, '');
  text = text.replace(/^Certifications & Awards:[\s\S]{0,400}?(?=\n\n|$)/gim, '');

  // 9. Bullet/divider lines
  text = text.replace(/^[*_=\-]{3,}\s*$/gm, '');

  // 10. Final whitespace collapse
  text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

const VISA_REQ_RE = /^(?:[*_]*\s*)?(?:visa|work\s*auth|usc(?:\s*\/\s*|\s+(?:and|or)\s+)?gc|us\s*citizen|green\s*card|h-?1b|opt|cpt|ead|tn\s*visa|w2\s*only|c2c\s*only|no\s*(?:third\s*party|h1b|opt))\b/i;

// ─── Main ───────────────────────────────────────────────────────────────────

(async () => {
  const org = await prisma.organization.findFirst({ select: { id: true } });

  const jobs = await prisma.jobOrder.findMany({
    where: { orgId: org.id, createdAt: { gte: sinceDate } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true, description: true, aiDescription: true, location: true, requirements: true },
  });

  // Pull matching inbox items so we can recover the original Subject for title cleanup
  const items = await prisma.recruiterInboxItem.findMany({
    where: { orgId: org.id, jobOrderId: { in: jobs.map(j => j.id) } },
    select: { jobOrderId: true, subject: true, extractedData: true },
  });
  const itemsByJobId = new Map(items.map(it => [it.jobOrderId, it]));

  console.log(`${dryRun ? '=== DRY RUN' : '=== APPLYING'} ${useAiDesc ? '(--use-ai-desc fallback ON)' : ''} ===`);
  console.log(`Window: ${sinceDate.toISOString()} → now    Jobs found: ${jobs.length}\n`);

  let changed = 0;
  for (const j of jobs) {
    const item            = itemsByJobId.get(j.id);
    const subject         = item?.subject || j.title;
    const extractedTitle  = item?.extractedData?.title;

    const newTitle        = cleanJobTitle(subject, extractedTitle);
    let   newDescription  = sanitizeJobDescription(j.description, { redactVisa: true });

    // If the sanitizer over-stripped (because corporate footer + Disclaimer
    // come BEFORE the forwarded job body, killing legitimate content) OR if
    // it under-stripped (still contains corporate boilerplate), fall back to
    // the AI-polished version which is short, clean, and structured.
    const aiClean = j.aiDescription && j.aiDescription.length > 200 && j.aiDescription.length < 8000;
    const sanitizedLooksBad =
      (newDescription.length > 20000) ||                                                  // still huge → MIME bled through
      (newDescription.length < 500 && (j.description?.length || 0) > 5000) ||              // over-stripped
      (/InherentTech|sksandeep846@gmail|Anthony Woodward|StevenDouglas|The harder you work/.test(newDescription)); // boilerplate
    if (useAiDesc && sanitizedLooksBad && aiClean) {
      newDescription = j.aiDescription;
    }

    const newLocation     = (j.location && j.location.trim()) || 'Not specified';
    const newReqs         = (j.requirements || [])
      .filter(r => r && r.trim().length > 0)
      .filter(r => !VISA_REQ_RE.test(r));

    const titleChanged = newTitle       !== j.title;
    const descChanged  = newDescription !== j.description;
    const locChanged   = newLocation    !== j.location;
    const reqsChanged  = newReqs.length !== j.requirements.length;
    const anyChange    = titleChanged || descChanged || locChanged || reqsChanged;

    const fallbackNote = (useAiDesc && sanitizedLooksBad && aiClean) ? ' [via aiDesc fallback]' : '';
    console.log(`Job ${j.id.slice(0,8)}:`);
    console.log(`  title:        ${titleChanged ? `"${(j.title||'').slice(0,50)}…" → "${newTitle.slice(0,60)}"` : `(unchanged) ${j.title?.slice(0,60)}`}`);
    console.log(`  description:  ${descChanged ? `${(j.description||'').length} → ${newDescription.length} chars  (-${(j.description||'').length - newDescription.length})${fallbackNote}` : `(unchanged) ${(j.description||'').length} chars`}`);
    console.log(`  location:     ${locChanged ? `"${j.location}" → "${newLocation}"` : `(unchanged) ${j.location}`}`);
    console.log(`  requirements: ${reqsChanged ? `${j.requirements.length} → ${newReqs.length} items (filtered ${j.requirements.length - newReqs.length} visa)` : `(unchanged) ${j.requirements.length} items`}`);
    console.log('');

    if (anyChange && !dryRun) {
      await prisma.jobOrder.update({
        where: { id: j.id },
        data: { title: newTitle, description: newDescription, location: newLocation, requirements: newReqs },
      });
      changed++;
    } else if (anyChange) {
      changed++;
    }
  }

  console.log(`${dryRun ? '✓ DRY RUN' : '✓ Backfill'} complete. ${changed} of ${jobs.length} ${dryRun ? 'would be updated' : 'updated'}.`);
  await prisma.$disconnect();
})();
