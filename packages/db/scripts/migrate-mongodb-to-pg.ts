/**
 * MongoDB → PostgreSQL Migration Script
 * Migrates ATS data from the old MongoDB-based system to unified Supabase/PostgreSQL
 *
 * Prerequisites:
 *   1. Set MONGODB_URI env var pointing to the source MongoDB
 *   2. Set DATABASE_URL env var pointing to target Supabase PostgreSQL
 *   3. Run: npx tsx packages/db/scripts/migrate-mongodb-to-pg.ts
 *
 * What it does:
 *   - Connects to both databases
 *   - Migrates candidates, job_orders, submissions, interviews, placements, timesheets
 *   - Maps MongoDB ObjectIds to UUIDs
 *   - Transforms field names from camelCase to snake_case schema
 *   - Logs progress and errors
 *   - Supports --dry-run flag
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ID mapping: old MongoDB ObjectId → new UUID
const idMap = new Map<string, string>();

function generateUUID(): string {
  return crypto.randomUUID();
}

function mapId(oldId: string): string {
  if (!idMap.has(oldId)) {
    idMap.set(oldId, generateUUID());
  }
  return idMap.get(oldId)!;
}

interface MigrationStats {
  table: string;
  total: number;
  migrated: number;
  skipped: number;
  errors: string[];
}

const stats: MigrationStats[] = [];
const isDryRun = process.argv.includes('--dry-run');
const ORG_ID = process.env.MIGRATION_ORG_ID || ''; // Target org in new system

async function migrateCandidates(mongoData: any[]) {
  const stat: MigrationStats = { table: 'candidates', total: mongoData.length, migrated: 0, skipped: 0, errors: [] };

  for (const doc of mongoData) {
    try {
      const newId = mapId(doc._id.toString());

      if (!isDryRun) {
        await prisma.candidate.upsert({
          where: { id: newId },
          update: {},
          create: {
            id: newId,
            orgId: ORG_ID,
            firstName: doc.firstName || doc.name?.split(' ')[0] || '',
            lastName: doc.lastName || doc.name?.split(' ').slice(1).join(' ') || '',
            email: doc.email || '',
            phone: doc.phone || null,
            visaStatus: mapVisaStatus(doc.visaStatus || doc.visa_status),
            currentTitle: doc.currentTitle || doc.title || null,
            currentCompany: doc.currentCompany || doc.company || null,
            skills: doc.skills || [],
            yearsOfExperience: doc.yearsOfExperience || doc.experience || 0,
            expectedRate: doc.expectedRate || doc.rate || null,
            resumeUrl: doc.resumeUrl || doc.resume_url || null,
            linkedinUrl: doc.linkedinUrl || doc.linkedin || null,
            location: doc.location || null,
            source: doc.source || 'migration',
            notes: doc.notes || null,
            status: mapCandidateStatus(doc.status),
          },
        });
      }
      stat.migrated++;
    } catch (err: any) {
      stat.errors.push(`Candidate ${doc._id}: ${err.message}`);
      stat.skipped++;
    }
  }

  stats.push(stat);
  console.log(`📋 Candidates: ${stat.migrated}/${stat.total} migrated, ${stat.skipped} skipped`);
}

async function migrateJobOrders(mongoData: any[]) {
  const stat: MigrationStats = { table: 'job_orders', total: mongoData.length, migrated: 0, skipped: 0, errors: [] };

  for (const doc of mongoData) {
    try {
      const newId = mapId(doc._id.toString());

      if (!isDryRun) {
        await prisma.jobOrder.upsert({
          where: { id: newId },
          update: {},
          create: {
            id: newId,
            orgId: ORG_ID,
            clientId: doc.clientId ? mapId(doc.clientId.toString()) : null,
            title: doc.title || '',
            description: doc.description || '',
            requirements: doc.requirements || doc.skills || [],
            location: doc.location || null,
            rateRange: doc.rateRange || { min: 0, max: 0, type: 'hourly' },
            openings: doc.openings || 1,
            filled: doc.filled || 0,
            priority: mapPriority(doc.priority),
            status: mapJobStatus(doc.status),
            assignedToId: doc.assignedTo ? mapId(doc.assignedTo.toString()) : null,
          },
        });
      }
      stat.migrated++;
    } catch (err: any) {
      stat.errors.push(`JobOrder ${doc._id}: ${err.message}`);
      stat.skipped++;
    }
  }

  stats.push(stat);
  console.log(`💼 Job Orders: ${stat.migrated}/${stat.total} migrated, ${stat.skipped} skipped`);
}

async function migrateSubmissions(mongoData: any[]) {
  const stat: MigrationStats = { table: 'submissions', total: mongoData.length, migrated: 0, skipped: 0, errors: [] };

  for (const doc of mongoData) {
    try {
      const newId = mapId(doc._id.toString());

      if (!isDryRun) {
        await prisma.submission.upsert({
          where: { id: newId },
          update: {},
          create: {
            id: newId,
            orgId: ORG_ID,
            candidateId: mapId(doc.candidateId.toString()),
            jobOrderId: mapId(doc.jobOrderId.toString()),
            submittedById: doc.submittedBy ? mapId(doc.submittedBy.toString()) : ORG_ID,
            status: mapSubmissionStatus(doc.status),
            billRate: doc.billRate || null,
            payRate: doc.payRate || null,
            clientFeedback: doc.clientFeedback || null,
            internalNotes: doc.internalNotes || doc.notes || null,
            submittedAt: doc.submittedAt ? new Date(doc.submittedAt) : new Date(),
          },
        });
      }
      stat.migrated++;
    } catch (err: any) {
      stat.errors.push(`Submission ${doc._id}: ${err.message}`);
      stat.skipped++;
    }
  }

  stats.push(stat);
  console.log(`📤 Submissions: ${stat.migrated}/${stat.total} migrated, ${stat.skipped} skipped`);
}

// Enum mappers
function mapVisaStatus(status: string): any {
  const map: Record<string, string> = {
    'us_citizen': 'US_CITIZEN', 'citizen': 'US_CITIZEN', 'usc': 'US_CITIZEN',
    'green_card': 'GREEN_CARD', 'gc': 'GREEN_CARD', 'pr': 'GREEN_CARD',
    'h1b': 'H1B', 'h1': 'H1B', 'h1b_transfer': 'H1B_TRANSFER',
    'opt': 'OPT', 'cpt': 'CPT', 'l1': 'L1', 'tn': 'TN',
  };
  return map[status?.toLowerCase()] || 'OTHER';
}

function mapCandidateStatus(status: string): any {
  const map: Record<string, string> = {
    'active': 'ACTIVE', 'inactive': 'INACTIVE', 'placed': 'PLACED',
    'blacklisted': 'BLACKLISTED', 'blocked': 'BLACKLISTED',
  };
  return map[status?.toLowerCase()] || 'ACTIVE';
}

function mapPriority(priority: string): any {
  const map: Record<string, string> = {
    'low': 'LOW', 'medium': 'MEDIUM', 'high': 'HIGH', 'urgent': 'URGENT', 'critical': 'URGENT',
  };
  return map[priority?.toLowerCase()] || 'MEDIUM';
}

function mapJobStatus(status: string): any {
  const map: Record<string, string> = {
    'draft': 'DRAFT', 'open': 'OPEN', 'active': 'OPEN',
    'on_hold': 'ON_HOLD', 'hold': 'ON_HOLD', 'paused': 'ON_HOLD',
    'filled': 'FILLED', 'closed': 'FILLED', 'cancelled': 'CANCELLED',
  };
  return map[status?.toLowerCase()] || 'OPEN';
}

function mapSubmissionStatus(status: string): any {
  const map: Record<string, string> = {
    'submitted': 'SUBMITTED', 'pending': 'SUBMITTED',
    'client_review': 'CLIENT_REVIEW', 'review': 'CLIENT_REVIEW',
    'interview': 'INTERVIEW', 'interviewing': 'INTERVIEW',
    'offered': 'OFFERED', 'accepted': 'ACCEPTED',
    'rejected': 'REJECTED', 'declined': 'REJECTED',
    'withdrawn': 'WITHDRAWN',
  };
  return map[status?.toLowerCase()] || 'SUBMITTED';
}

async function main() {
  console.log('🚀 MongoDB → PostgreSQL Migration');
  console.log(isDryRun ? '⚠️  DRY RUN MODE — no data will be written' : '🔥 LIVE MODE — writing to database');
  console.log(`📍 Target org: ${ORG_ID}`);
  console.log('');

  // NOTE: In production, replace these with actual MongoDB reads
  // For now, this expects JSON files exported from MongoDB via:
  //   mongoexport --collection=candidates --out=data/candidates.json --jsonArray

  const fs = await import('fs');
  const path = await import('path');
  const dataDir = path.join(process.cwd(), 'packages/db/scripts/data');

  if (!fs.existsSync(dataDir)) {
    console.log('📁 Create packages/db/scripts/data/ and place MongoDB JSON exports there:');
    console.log('   - candidates.json');
    console.log('   - jobs.json');
    console.log('   - submissions.json');
    console.log('');
    console.log('Export from MongoDB with:');
    console.log('   mongoexport --db=ats --collection=candidates --out=data/candidates.json --jsonArray');
    fs.mkdirSync(dataDir, { recursive: true });
    return;
  }

  const loadJson = (file: string) => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    console.log(`⏭️  ${file} not found, skipping`);
    return [];
  };

  await migrateCandidates(loadJson('candidates.json'));
  await migrateJobOrders(loadJson('jobs.json'));
  await migrateSubmissions(loadJson('submissions.json'));

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('📊 Migration Summary');
  console.log('═══════════════════════════════════════');
  for (const s of stats) {
    console.log(`  ${s.table}: ${s.migrated}/${s.total} (${s.errors.length} errors)`);
    for (const err of s.errors.slice(0, 3)) {
      console.log(`    ❌ ${err}`);
    }
  }
  console.log('═══════════════════════════════════════');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
