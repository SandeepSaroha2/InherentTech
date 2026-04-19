/**
 * Server component layout for individual job pages.
 * Injects Google for Jobs JSON-LD structured data so Google's crawler
 * can index jobs in the Google Jobs carousel (free, no partnership needed).
 *
 * Validation: https://search.google.com/test/rich-results
 * Monitoring:  Google Search Console → Enhancements → Job postings
 */
import { prisma } from '@inherenttech/db';
import type { Metadata } from 'next';

const ORG_ID    = process.env.DEFAULT_ORG_ID || process.env.ORG_ID || '';
const JOB_BOARD = (process.env.JOB_BOARD_URL || 'https://jobs.inherenttech.com').replace(/\/$/, '');
const ORG_NAME  = process.env.PUBLISHER_NAME  || 'InherentTech Staffing';
const ORG_LOGO  = process.env.ORG_LOGO_URL    || `${JOB_BOARD}/logo.png`;

interface Props {
  children: React.ReactNode;
  params:   { id: string };
}

/** Dynamic metadata so each job page gets its own <title> and <meta description> */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await fetchJob(params.id);
  if (!job) return { title: 'Job Not Found' };

  const description = (job.description || '').replace(/\n/g, ' ').slice(0, 160);
  return {
    title:       `${job.title} — ${ORG_NAME}`,
    description,
    openGraph: {
      title:       `${job.title} | ${ORG_NAME}`,
      description,
      type:        'website',
      url:         `${JOB_BOARD}/jobs/${job.id}`,
    },
    twitter: {
      card:        'summary',
      title:       `${job.title} | ${ORG_NAME}`,
      description,
    },
  };
}

async function fetchJob(id: string) {
  try {
    return await prisma.jobOrder.findFirst({
      where: { id, status: 'OPEN', ...(ORG_ID ? { orgId: ORG_ID } : {}) },
      select: {
        id:           true,
        title:        true,
        description:  true,
        location:     true,
        requirements: true,
        rateRange:    true,
        openings:     true,
        filled:       true,
        createdAt:    true,
        client:       { select: { companyName: true } },
      },
    });
  } catch {
    return null;
  }
}

export default async function JobDetailLayout({ children, params }: Props) {
  const job = await fetchJob(params.id);

  if (!job) return <>{children}</>;

  const jobUrl   = `${JOB_BOARD}/jobs/${job.id}`;
  const rr       = job.rateRange as any;
  const isRemote = /remote/i.test(job.location || '');

  // Parse city/state/country from location string
  const locationParts = (job.location || '').split(',').map((s: string) => s.trim());
  const city  = locationParts[0] || '';
  const state = locationParts[1] || '';

  // Compute 60-day validity window (standard for contract roles)
  const validThrough = new Date(job.createdAt);
  validThrough.setDate(validThrough.getDate() + 60);

  const jsonLd: Record<string, any> = {
    '@context':     'https://schema.org/',
    '@type':        'JobPosting',
    title:          job.title,
    description:    job.description || '',
    datePosted:     job.createdAt.toISOString().split('T')[0],
    validThrough:   validThrough.toISOString(),
    directApply:    true,
    employmentType: 'CONTRACTOR',

    hiringOrganization: {
      '@type':  'Organization',
      name:     ORG_NAME,
      sameAs:   JOB_BOARD,
      logo:     ORG_LOGO,
    },

    jobLocation: isRemote
      ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'US' } }
      : {
          '@type': 'Place',
          address: {
            '@type':          'PostalAddress',
            addressLocality:  city,
            addressRegion:    state,
            addressCountry:   'US',
          },
        },

    identifier: {
      '@type': 'PropertyValue',
      name:    ORG_NAME,
      value:   job.id,
    },

    url: jobUrl,

    ...(job.requirements?.length && {
      skills: (job.requirements as string[]).join(', '),
    }),
  };

  // Remote job fields
  if (isRemote) {
    jsonLd.jobLocationType = 'TELECOMMUTE';
    jsonLd.applicantLocationRequirements = { '@type': 'Country', name: 'United States' };
  }

  // Salary / rate
  if (rr?.min && rr?.max) {
    jsonLd.baseSalary = {
      '@type':    'MonetaryAmount',
      currency:   'USD',
      value: {
        '@type':    'QuantitativeValue',
        minValue:   rr.min,
        maxValue:   rr.max,
        unitText:   'HOUR',
      },
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
