/**
 * GET /api/jobs/feed.xml
 *
 * Public XML job feed in Indeed/ZipRecruiter/SimplyHired format.
 * No authentication required — must be publicly accessible for job board crawlers.
 *
 * Submit this URL to:
 *   • Indeed:       https://ads.indeed.com/jobroll/xmlfeed (or their partner portal)
 *   • ZipRecruiter: email atsintegrations@ziprecruiter.com with the feed URL
 *   • SimplyHired:  https://www.simplyhired.com/post-jobs/xml-feed
 *   • Google Jobs:  automatic — just ensure /jobs/[id] pages have JSON-LD markup
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';
import { generateXmlFeed } from '@inherenttech/db';

export const dynamic = 'force-dynamic';

const ORG_ID      = process.env.DEFAULT_ORG_ID || process.env.ORG_ID || '';
const PUBLISHER   = process.env.PUBLISHER_NAME || 'InherentTech Staffing';
const JOB_BOARD   = process.env.JOB_BOARD_URL  || 'https://jobs.inherenttech.com';

export async function GET(_req: NextRequest) {
  try {
    const jobs = await prisma.jobOrder.findMany({
      where:   { status: 'OPEN', ...(ORG_ID ? { orgId: ORG_ID } : {}) },
      select: {
        id:           true,
        title:        true,
        description:  true,
        location:     true,
        requirements: true,
        rateRange:    true,
        openings:     true,
        createdAt:    true,
        jobNumber:    true,
        client:       { select: { companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const xml = generateXmlFeed(jobs as any, {
      publisherName: PUBLISHER,
      publisherUrl:  JOB_BOARD,
      jobBoardUrl:   JOB_BOARD,
    });

    return new NextResponse(xml, {
      status:  200,
      headers: {
        'Content-Type':  'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // cache 1hr
        'X-Robots-Tag':  'noindex',                             // don't index the feed itself
      },
    });
  } catch (error) {
    console.error('XML feed error:', error);
    return new NextResponse('<?xml version="1.0"?><error>Feed temporarily unavailable</error>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
