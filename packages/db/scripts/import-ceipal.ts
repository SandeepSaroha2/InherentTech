/**
 * Ceipal ATS Data Import Tool
 *
 * Imports candidates, jobs, submissions, and placements from Ceipal CSV exports.
 *
 * Usage:
 *   npx ts-node packages/db/scripts/import-ceipal.ts --dir ./ceipal-export [--dry-run] [--org-id <id>]
 *
 * Expected CSV files in the export directory:
 *   - candidates.csv
 *   - job_orders.csv (or jobs.csv)
 *   - submissions.csv
 *   - placements.csv
 *   - contacts.csv (optional - imports as leads to CRM)
 *
 * Features:
 *   - Duplicate detection by email and job reference
 *   - Automatic enum mapping from Ceipal values to Prisma enums
 *   - CSV parsing with quoted field support
 *   - Cross-referencing submissions to candidates and jobs
 *   - Per-row error handling with summary report
 *   - --dry-run mode for preview before commit
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================================================
// CSV PARSER
// ============================================================================

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line, idx) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || '').trim();
    });
    return row;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ============================================================================
// FIELD MAPPINGS
// ============================================================================

const VISA_MAP: Record<string, string> = {
  'US Citizen': 'US_CITIZEN',
  'Green Card': 'GREEN_CARD',
  'Permanent Resident': 'GREEN_CARD',
  'H1B': 'H1B',
  'H-1B': 'H1B',
  'H1B Transfer': 'H1B_TRANSFER',
  'H-1B Transfer': 'H1B_TRANSFER',
  'H4 EAD': 'OPT',
  'L1': 'L1',
  'L-1': 'L1',
  'L2 EAD': 'OPT',
  'OPT': 'OPT',
  'CPT': 'CPT',
  'TN': 'TN',
  'Canadian Citizen': 'OTHER',
  'Work Visa': 'OTHER',
  'Other': 'OTHER',
  'Citizen': 'US_CITIZEN',
  '': 'US_CITIZEN',
};

const CANDIDATE_STATUS_MAP: Record<string, string> = {
  'Active': 'ACTIVE',
  'Inactive': 'INACTIVE',
  'Placed': 'PLACED',
  'Do Not Use': 'INACTIVE',
  'On Assignment': 'PLACED',
  'Available': 'ACTIVE',
  '': 'ACTIVE',
};

const JOB_STATUS_MAP: Record<string, string> = {
  'Open': 'OPEN',
  'Active': 'OPEN',
  'Filled': 'FILLED',
  'Closed': 'FILLED',
  'On Hold': 'ON_HOLD',
  'Hold': 'ON_HOLD',
  'Draft': 'DRAFT',
  'Cancelled': 'CANCELLED',
  '': 'OPEN',
};

const JOB_PRIORITY_MAP: Record<string, string> = {
  'High': 'HIGH',
  'Urgent': 'URGENT',
  'Medium': 'MEDIUM',
  'Low': 'LOW',
  '': 'MEDIUM',
};

const SUBMISSION_STATUS_MAP: Record<string, string> = {
  'Submitted': 'SUBMITTED',
  'Client Review': 'CLIENT_REVIEW',
  'Under Review': 'CLIENT_REVIEW',
  'Interview': 'INTERVIEW',
  'Interviewing': 'INTERVIEW',
  'Offer': 'OFFERED',
  'Offered': 'OFFERED',
  'Accepted': 'ACCEPTED',
  'Placed': 'ACCEPTED',
  'Rejected': 'REJECTED',
  'Withdrawn': 'WITHDRAWN',
  '': 'SUBMITTED',
};

const PLACEMENT_STATUS_MAP: Record<string, string> = {
  'Active': 'ACTIVE',
  'On Hold': 'ON_HOLD',
  'Completed': 'COMPLETED',
  'Terminated': 'TERMINATED',
  'Ended': 'COMPLETED',
  '': 'ACTIVE',
};

// ============================================================================
// TYPES
// ============================================================================

interface ImportStats {
  candidates: { total: number; imported: number; skipped: number; errors: string[] };
  jobs: { total: number; imported: number; skipped: number; errors: string[] };
  submissions: { total: number; imported: number; skipped: number; errors: string[] };
  placements: { total: number; imported: number; skipped: number; errors: string[] };
  contacts: { total: number; imported: number; skipped: number; errors: string[] };
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

async function importCandidates(
  rows: Record<string, string>[],
  orgId: string,
  dryRun: boolean
): Promise<ImportStats['candidates']> {
  const stats = { total: rows.length, imported: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      const email = row['Email'] || row['email'] || row['EMAIL'] || '';
      if (!email || !email.includes('@')) {
        stats.skipped++;
        continue;
      }

      const emailLower = email.toLowerCase();
      const existing = await prisma.candidate.findFirst({
        where: { email: emailLower, orgId },
      });

      if (existing) {
        stats.skipped++;
        continue;
      }

      // Parse skills from comma or semicolon separated list
      const skillsStr = row['Skills'] || row['skills'] || '';
      const skills = skillsStr
        .split(/[,;]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const yearsExp = row['Experience (Years)'] || row['Years of Experience'] || row['experience'];
      const rate = row['Expected Rate'] || row['Rate'] || '';

      const data = {
        orgId,
        firstName: row['First Name'] || row['firstName'] || 'Unknown',
        lastName: row['Last Name'] || row['lastName'] || '',
        email: emailLower,
        phone: row['Phone'] || row['phone'] || null,
        currentTitle: row['Current Title'] || row['Title'] || null,
        skills,
        yearsOfExperience: yearsExp ? parseInt(yearsExp) : null,
        expectedRate: rate ? parseFloat(rate.toString().replace(/[$,]/g, '')) : null,
        location: [row['City'] || '', row['State'] || '']
          .filter(Boolean)
          .join(', ') || null,
        visaStatus: VISA_MAP[row['Visa Status'] || row['visa_status'] || ''] || 'US_CITIZEN',
        status: CANDIDATE_STATUS_MAP[row['Status'] || row['status'] || ''] || 'ACTIVE',
        linkedIn: row['LinkedIn'] || row['linkedin'] || null,
        source: row['Source'] || row['source'] || 'Ceipal Import',
        notes: row['Notes'] || row['notes'] || `Imported from Ceipal on ${new Date().toISOString().split('T')[0]}`,
      };

      if (!dryRun) {
        await prisma.candidate.create({ data: data as any });
      }
      stats.imported++;
    } catch (err: any) {
      stats.errors.push(`${row['Email'] || row['email'] || '?'}: ${err.message}`);
    }
  }

  return stats;
}

async function importJobOrders(
  rows: Record<string, string>[],
  orgId: string,
  dryRun: boolean
): Promise<ImportStats['jobs']> {
  const stats = { total: rows.length, imported: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      const jobRef = row['Job ID'] || row['Reference'] || row['job_id'] || '';
      if (!jobRef) {
        stats.skipped++;
        continue;
      }

      const existing = await prisma.job.findFirst({
        where: { referenceId: jobRef, orgId },
      });

      if (existing) {
        stats.skipped++;
        continue;
      }

      const skillsStr = row['Required Skills'] || row['skills'] || '';
      const skills = skillsStr
        .split(/[,;]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const data = {
        orgId,
        referenceId: jobRef,
        title: row['Job Title'] || row['title'] || 'Untitled Position',
        description: row['Job Description'] || row['description'] || '',
        location: row['Location'] || row['location'] || '',
        clientName: row['Client Name'] || row['company'] || '',
        billRate: row['Bill Rate'] || row['bill_rate'] ? parseFloat((row['Bill Rate'] || row['bill_rate']).toString().replace(/[$,]/g, '')) : null,
        payRate: row['Pay Rate'] || row['pay_rate'] ? parseFloat((row['Pay Rate'] || row['pay_rate']).toString().replace(/[$,]/g, '')) : null,
        duration: row['Duration'] || row['duration'] || 'TBD',
        skills,
        status: JOB_STATUS_MAP[row['Status'] || row['status'] || ''] || 'OPEN',
        priority: JOB_PRIORITY_MAP[row['Priority'] || row['priority'] || ''] || 'MEDIUM',
        yearsRequired: row['Years Required'] || row['years_required'] ? parseInt(row['Years Required'] || row['years_required']) : null,
        visaSponsorship: row['Visa Sponsorship'] === 'Yes' || row['visa_sponsorship'] === 'true',
        notes: row['Notes'] || row['notes'] || `Imported from Ceipal on ${new Date().toISOString().split('T')[0]}`,
      };

      if (!dryRun) {
        await prisma.job.create({ data: data as any });
      }
      stats.imported++;
    } catch (err: any) {
      stats.errors.push(`${row['Job ID'] || row['Reference'] || '?'}: ${err.message}`);
    }
  }

  return stats;
}

async function importSubmissions(
  rows: Record<string, string>[],
  orgId: string,
  dryRun: boolean
): Promise<ImportStats['submissions']> {
  const stats = { total: rows.length, imported: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      const candidateEmail = (row['Candidate Email'] || row['email'] || '').toLowerCase();
      const jobRef = row['Job ID'] || row['job_reference'] || '';

      if (!candidateEmail || !jobRef) {
        stats.skipped++;
        continue;
      }

      // Find candidate and job by email and reference
      const candidate = await prisma.candidate.findFirst({
        where: { email: candidateEmail, orgId },
      });

      const job = await prisma.job.findFirst({
        where: { referenceId: jobRef, orgId },
      });

      if (!candidate || !job) {
        stats.skipped++;
        continue;
      }

      // Check if submission already exists
      const existing = await prisma.submission.findFirst({
        where: {
          candidateId: candidate.id,
          jobId: job.id,
          orgId,
        },
      });

      if (existing) {
        stats.skipped++;
        continue;
      }

      const submittedDate = row['Submitted Date'] || row['submission_date'] || new Date().toISOString();
      const data = {
        orgId,
        candidateId: candidate.id,
        jobId: job.id,
        status: SUBMISSION_STATUS_MAP[row['Status'] || row['status'] || ''] || 'SUBMITTED',
        submittedAt: new Date(submittedDate),
        notes: row['Notes'] || row['notes'] || `Imported from Ceipal on ${new Date().toISOString().split('T')[0]}`,
      };

      if (!dryRun) {
        await prisma.submission.create({ data: data as any });
      }
      stats.imported++;
    } catch (err: any) {
      stats.errors.push(`${row['Candidate Email'] || '?'} -> ${row['Job ID'] || '?'}: ${err.message}`);
    }
  }

  return stats;
}

async function importPlacements(
  rows: Record<string, string>[],
  orgId: string,
  dryRun: boolean
): Promise<ImportStats['placements']> {
  const stats = { total: rows.length, imported: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      const candidateEmail = (row['Candidate Email'] || row['email'] || '').toLowerCase();
      const jobRef = row['Job ID'] || row['job_reference'] || '';

      if (!candidateEmail || !jobRef) {
        stats.skipped++;
        continue;
      }

      const candidate = await prisma.candidate.findFirst({
        where: { email: candidateEmail, orgId },
      });

      const job = await prisma.job.findFirst({
        where: { referenceId: jobRef, orgId },
      });

      if (!candidate || !job) {
        stats.skipped++;
        continue;
      }

      const existing = await prisma.placement.findFirst({
        where: {
          candidateId: candidate.id,
          jobId: job.id,
          orgId,
        },
      });

      if (existing) {
        stats.skipped++;
        continue;
      }

      const startDate = row['Start Date'] || row['start_date'] || new Date().toISOString();
      const billRate = row['Bill Rate'] || row['bill_rate'];
      const payRate = row['Pay Rate'] || row['pay_rate'];

      const data = {
        orgId,
        candidateId: candidate.id,
        jobId: job.id,
        status: PLACEMENT_STATUS_MAP[row['Status'] || row['status'] || ''] || 'ACTIVE',
        startDate: new Date(startDate),
        endDate: row['End Date'] || row['end_date'] ? new Date(row['End Date'] || row['end_date']) : null,
        billRate: billRate ? parseFloat(billRate.toString().replace(/[$,]/g, '')) : null,
        payRate: payRate ? parseFloat(payRate.toString().replace(/[$,]/g, '')) : null,
        notes: row['Notes'] || row['notes'] || `Imported from Ceipal on ${new Date().toISOString().split('T')[0]}`,
      };

      if (!dryRun) {
        await prisma.placement.create({ data: data as any });
      }
      stats.imported++;
    } catch (err: any) {
      stats.errors.push(`${row['Candidate Email'] || '?'} -> ${row['Job ID'] || '?'}: ${err.message}`);
    }
  }

  return stats;
}

async function importContacts(
  rows: Record<string, string>[],
  orgId: string,
  dryRun: boolean
): Promise<ImportStats['contacts']> {
  const stats = { total: rows.length, imported: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      const email = (row['Email'] || row['email'] || '').toLowerCase();
      if (!email || !email.includes('@')) {
        stats.skipped++;
        continue;
      }

      const existing = await prisma.lead.findFirst({
        where: { email, orgId },
      });

      if (existing) {
        stats.skipped++;
        continue;
      }

      const data = {
        orgId,
        firstName: row['First Name'] || row['firstName'] || 'Unknown',
        lastName: row['Last Name'] || row['lastName'] || '',
        email,
        company: row['Company'] || row['company'] || null,
        phone: row['Phone'] || row['phone'] || null,
        title: row['Title'] || row['title'] || null,
        source: 'Ceipal Import',
        notes: `Imported from Ceipal on ${new Date().toISOString().split('T')[0]}`,
      };

      if (!dryRun) {
        await prisma.lead.create({ data: data as any });
      }
      stats.imported++;
    } catch (err: any) {
      stats.errors.push(`${email || '?'}: ${err.message}`);
    }
  }

  return stats;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dirIdx = args.indexOf('--dir');
  const dir = dirIdx >= 0 ? args[dirIdx + 1] : './ceipal-export';
  const dryRun = args.includes('--dry-run');
  const orgIdIdx = args.indexOf('--org-id');
  const orgId = orgIdIdx >= 0 ? args[orgIdIdx + 1] : 'default';

  console.log('\n🔄 Ceipal Import Tool');
  console.log(`   Directory: ${dir}`);
  console.log(`   Org ID: ${orgId}`);
  console.log(`   Mode: ${dryRun ? '🏃 DRY RUN (no data written)' : '⚡ LIVE (data will be written)'}\n`);

  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    process.exit(1);
  }

  const stats: ImportStats = {
    candidates: { total: 0, imported: 0, skipped: 0, errors: [] },
    jobs: { total: 0, imported: 0, skipped: 0, errors: [] },
    submissions: { total: 0, imported: 0, skipped: 0, errors: [] },
    placements: { total: 0, imported: 0, skipped: 0, errors: [] },
    contacts: { total: 0, imported: 0, skipped: 0, errors: [] },
  };

  // Import candidates
  const candidatesFile = path.join(dir, 'candidates.csv');
  if (fs.existsSync(candidatesFile)) {
    console.log('📋 Importing candidates...');
    const rows = parseCSV(fs.readFileSync(candidatesFile, 'utf-8'));
    stats.candidates = await importCandidates(rows, orgId, dryRun);
    console.log(`   ✅ ${stats.candidates.imported} imported, ${stats.candidates.skipped} skipped, ${stats.candidates.errors.length} errors`);
    if (stats.candidates.errors.length > 0 && stats.candidates.errors.length <= 5) {
      stats.candidates.errors.forEach(e => console.log(`      ⚠️  ${e}`));
    }
  }

  // Import jobs
  const jobsFile = fs.existsSync(path.join(dir, 'job_orders.csv'))
    ? path.join(dir, 'job_orders.csv')
    : path.join(dir, 'jobs.csv');
  if (fs.existsSync(jobsFile)) {
    console.log('💼 Importing job orders...');
    const rows = parseCSV(fs.readFileSync(jobsFile, 'utf-8'));
    stats.jobs = await importJobOrders(rows, orgId, dryRun);
    console.log(`   ✅ ${stats.jobs.imported} imported, ${stats.jobs.skipped} skipped, ${stats.jobs.errors.length} errors`);
    if (stats.jobs.errors.length > 0 && stats.jobs.errors.length <= 5) {
      stats.jobs.errors.forEach(e => console.log(`      ⚠️  ${e}`));
    }
  }

  // Import submissions
  const submissionsFile = path.join(dir, 'submissions.csv');
  if (fs.existsSync(submissionsFile)) {
    console.log('📨 Importing submissions...');
    const rows = parseCSV(fs.readFileSync(submissionsFile, 'utf-8'));
    stats.submissions = await importSubmissions(rows, orgId, dryRun);
    console.log(`   ✅ ${stats.submissions.imported} imported, ${stats.submissions.skipped} skipped, ${stats.submissions.errors.length} errors`);
    if (stats.submissions.errors.length > 0 && stats.submissions.errors.length <= 5) {
      stats.submissions.errors.forEach(e => console.log(`      ⚠️  ${e}`));
    }
  }

  // Import placements
  const placementsFile = path.join(dir, 'placements.csv');
  if (fs.existsSync(placementsFile)) {
    console.log('🎯 Importing placements...');
    const rows = parseCSV(fs.readFileSync(placementsFile, 'utf-8'));
    stats.placements = await importPlacements(rows, orgId, dryRun);
    console.log(`   ✅ ${stats.placements.imported} imported, ${stats.placements.skipped} skipped, ${stats.placements.errors.length} errors`);
    if (stats.placements.errors.length > 0 && stats.placements.errors.length <= 5) {
      stats.placements.errors.forEach(e => console.log(`      ⚠️  ${e}`));
    }
  }

  // Import contacts (optional)
  const contactsFile = path.join(dir, 'contacts.csv');
  if (fs.existsSync(contactsFile)) {
    console.log('👥 Importing contacts...');
    const rows = parseCSV(fs.readFileSync(contactsFile, 'utf-8'));
    stats.contacts = await importContacts(rows, orgId, dryRun);
    console.log(`   ✅ ${stats.contacts.imported} imported, ${stats.contacts.skipped} skipped, ${stats.contacts.errors.length} errors`);
    if (stats.contacts.errors.length > 0 && stats.contacts.errors.length <= 5) {
      stats.contacts.errors.forEach(e => console.log(`      ⚠️  ${e}`));
    }
  }

  // Summary
  console.log('\n📊 Import Summary:');
  console.log('─'.repeat(60));
  for (const [entity, s] of Object.entries(stats)) {
    if (s.total > 0) {
      const pct = Math.round((s.imported / s.total) * 100);
      console.log(`   ${entity.padEnd(15)} ${s.imported.toString().padStart(3)}/${s.total.toString().padStart(3)} (${pct}%) imported, ${s.skipped} skipped, ${s.errors.length} errors`);
    }
  }
  console.log('─'.repeat(60));

  const totalImported = Object.values(stats).reduce((sum, s) => sum + s.imported, 0);
  console.log(`\n✅ Total records imported: ${totalImported}`);

  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN. No data was written to the database.');
    console.log('    Remove the --dry-run flag to import data.\n');
  } else {
    console.log('\n✨ Import complete! Data has been written to the database.\n');
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('\n❌ Import failed:', err.message);
  process.exit(1);
});
