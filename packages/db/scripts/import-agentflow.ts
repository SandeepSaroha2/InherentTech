/**
 * AgentFlow CRM → Unified Schema Migration Script
 * Migrates existing AgentFlow Supabase data (CRM + Outreach) into the unified schema
 *
 * Prerequisites:
 *   1. Set OLD_SUPABASE_URL env var pointing to old AgentFlow Supabase
 *   2. Set OLD_SUPABASE_KEY env var (service role key with full access)
 *   3. Set DATABASE_URL env var pointing to target unified PostgreSQL
 *   4. Run: npx tsx packages/db/scripts/import-agentflow.ts
 *
 * What it does:
 *   - Connects to old AgentFlow Supabase (via env variables)
 *   - Reads companies, contacts, leads, outreach_campaigns, outreach_messages
 *   - Transforms and inserts into new unified schema
 *   - Maps old enum values (lowercase) to new ones (UPPERCASE)
 *   - Logs progress and errors
 *   - Supports --dry-run flag
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');
const ORG_ID = process.env.MIGRATION_ORG_ID || '';

// Initialize old AgentFlow Supabase client
const oldSupabaseUrl = process.env.OLD_SUPABASE_URL;
const oldSupabaseKey = process.env.OLD_SUPABASE_KEY;

if (!oldSupabaseUrl || !oldSupabaseKey) {
  console.error('❌ Missing OLD_SUPABASE_URL or OLD_SUPABASE_KEY env vars');
  process.exit(1);
}

const oldSupabase = createClient(oldSupabaseUrl, oldSupabaseKey);

// ID mapping: old UUID → new UUID
const companyIdMap = new Map<string, string>();
const contactIdMap = new Map<string, string>();
const leadIdMap = new Map<string, string>();

function generateUUID(): string {
  return crypto.randomUUID();
}

function mapCompanyId(oldId: string): string {
  if (!companyIdMap.has(oldId)) {
    companyIdMap.set(oldId, generateUUID());
  }
  return companyIdMap.get(oldId)!;
}

function mapContactId(oldId: string): string {
  if (!contactIdMap.has(oldId)) {
    contactIdMap.set(oldId, generateUUID());
  }
  return contactIdMap.get(oldId)!;
}

function mapLeadId(oldId: string): string {
  if (!leadIdMap.has(oldId)) {
    leadIdMap.set(oldId, generateUUID());
  }
  return leadIdMap.get(oldId)!;
}

interface MigrationStats {
  table: string;
  total: number;
  migrated: number;
  skipped: number;
  errors: string[];
}

const stats: MigrationStats[] = [];

async function migrateCompanies(companies: any[]) {
  const stat: MigrationStats = { table: 'companies', total: companies.length, migrated: 0, skipped: 0, errors: [] };

  for (const company of companies) {
    try {
      const newId = mapCompanyId(company.id);

      if (!isDryRun) {
        await prisma.company.upsert({
          where: { id: newId },
          update: {},
          create: {
            id: newId,
            orgId: ORG_ID,
            name: company.name || '',
            domain: company.domain || null,
            industry: company.industry || null,
            size: company.size || null,
            location: company.location || null,
            website: company.website || null,
            linkedinUrl: company.linkedin_url || null,
            description: company.description || null,
            painPoints: company.pain_points || [],
            techStack: company.tech_stack || [],
            annualRevenue: company.annual_revenue || null,
          },
        });
      }
      stat.migrated++;
    } catch (err: any) {
      stat.errors.push(`Company ${company.id}: ${err.message}`);
      stat.skipped++;
    }
  }

  stats.push(stat);
  console.log(`🏢 Companies: ${stat.migrated}/${stat.total} migrated, ${stat.skipped} skipped`);
}

async function migrateContacts(contacts: any[]) {
  const stat: MigrationStats = { table: 'contacts', total: contacts.length, migrated: 0, skipped: 0, errors: [] };

  for (const contact of contacts) {
    try {
      const newId = mapContactId(contact.id);
      const newCompanyId = contact.company_id ? mapCompanyId(contact.company_id) : null;

      if (!isDryRun) {
        await prisma.contact.upsert({
          where: { id: newId },
          update: {},
          create: {
            id: newId,
            companyId: newCompanyId,
            firstName: contact.first_name || '',
            lastName: contact.last_name || null,
            email: contact.email || null,
            phone: contact.phone || null,
            title: contact.title || null,
            linkedinUrl: contact.linkedin_url || null,
            twitterHandle: contact.twitter_handle || null,
            isDecisionMaker: contact.is_decision_maker || false,
            notes: contact.notes || null,
          },
        });
      }
      stat.migrated++;
    } catch (err: any) {
      stat.errors.push(`Contact ${contact.id}: ${err.message}`);
      stat.skipped++;
    }
  }

  stats.push(stat);
  console.log(`👥 Contacts: ${stat.migrated}/${stat.total} migrated, ${stat.skipped} skipped`);
}

async function migrateLeads(leads: any[]) {
  const stat: MigrationStats = { table: 'leads', total: leads.length, migrated: 0, skipped: 0, errors: [] };

  for (const lead of leads) {
    try {
      const newId = mapLeadId(lead.id);
      const newCompanyId = lead.company_id ? mapCompanyId(lead.company_id) : null;
      const newContactId = lead.contact_id ? mapContactId(lead.contact_id) : null;

      if (!isDryRun) {
        await prisma.lead.upsert({
          where: { id: newId },
          update: {},
          create: {
            id: newId,
            orgId: ORG_ID,
            companyId: newCompanyId,
            contactId: newContactId,
            source: mapLeadSource(lead.source),
            sourceUrl: lead.source_url || null,
            stage: mapLeadStage(lead.stage),
            qualification: mapQualification(lead.qualification),
            score: lead.score || 0,
            painPoint: lead.pain_point || null,
            useCase: lead.use_case || null,
            budgetRange: lead.budget_range || null,
            urgency: lead.urgency || null,
            aiTalkingPoints: lead.ai_talking_points || [],
            aiRecommendedSolutions: lead.ai_recommended_solutions || [],
            aiRiskFactors: lead.ai_risk_factors || [],
            assignedTo: lead.assigned_to || null,
            tags: lead.tags || [],
            lastContactedAt: lead.last_contacted_at ? new Date(lead.last_contacted_at) : null,
            nextFollowUpAt: lead.next_follow_up_at ? new Date(lead.next_follow_up_at) : null,
          },
        });
      }
      stat.migrated++;
    } catch (err: any) {
      stat.errors.push(`Lead ${lead.id}: ${err.message}`);
      stat.skipped++;
    }
  }

  stats.push(stat);
  console.log(`🔗 Leads: ${stat.migrated}/${stat.total} migrated, ${stat.skipped} skipped`);
}

async function migrateOutreachMessages(messages: any[]) {
  const stat: MigrationStats = { table: 'outreach_messages', total: messages.length, migrated: 0, skipped: 0, errors: [] };

  for (const message of messages) {
    try {
      const newId = generateUUID();
      const newLeadId = message.lead_id ? mapLeadId(message.lead_id) : null;
      const newContactId = message.contact_id ? mapContactId(message.contact_id) : null;

      if (!isDryRun) {
        await prisma.outreachMessage.upsert({
          where: { id: newId },
          update: {},
          create: {
            id: newId,
            leadId: newLeadId,
            contactId: newContactId,
            channel: mapOutreachChannel(message.channel),
            status: mapOutreachStatus(message.status),
            subject: message.subject || null,
            body: message.body || '',
            templateId: message.template_id || null,
            sequenceStep: message.sequence_step || 1,
            scheduledAt: message.scheduled_at ? new Date(message.scheduled_at) : null,
            sentAt: message.sent_at ? new Date(message.sent_at) : null,
            openedAt: message.opened_at ? new Date(message.opened_at) : null,
            repliedAt: message.replied_at ? new Date(message.replied_at) : null,
            errorMessage: message.error_message || null,
            metadata: message.metadata || {},
          },
        });
      }
      stat.migrated++;
    } catch (err: any) {
      stat.errors.push(`OutreachMessage ${message.id}: ${err.message}`);
      stat.skipped++;
    }
  }

  stats.push(stat);
  console.log(`📨 Outreach Messages: ${stat.migrated}/${stat.total} migrated, ${stat.skipped} skipped`);
}

// Enum mappers: old (lowercase) → new (UPPERCASE)
function mapLeadSource(source: string): string {
  const map: Record<string, string> = {
    'linkedin': 'LINKEDIN',
    'google_jobs': 'GOOGLE_JOBS',
    'twitter': 'TWITTER',
    'upwork': 'UPWORK',
    'reddit': 'REDDIT',
    'facebook': 'FACEBOOK',
    'website': 'WEBSITE',
    'referral': 'REFERRAL',
    'manual': 'MANUAL',
  };
  return map[source?.toLowerCase()] || 'MANUAL';
}

function mapLeadStage(stage: string): string {
  const map: Record<string, string> = {
    'new': 'NEW',
    'contacted': 'CONTACTED',
    'qualified': 'QUALIFIED',
    'proposal': 'PROPOSAL',
    'negotiation': 'NEGOTIATION',
    'closed_won': 'CLOSED_WON',
    'closed_lost': 'CLOSED_LOST',
  };
  return map[stage?.toLowerCase()] || 'NEW';
}

function mapQualification(qualification: string): string {
  const map: Record<string, string> = {
    'unqualified': 'UNQUALIFIED',
    'cold': 'COLD',
    'warm': 'WARM',
    'hot': 'HOT',
    'disqualified': 'DISQUALIFIED',
  };
  return map[qualification?.toLowerCase()] || 'UNQUALIFIED';
}

function mapOutreachChannel(channel: string): string {
  const map: Record<string, string> = {
    'email': 'EMAIL',
    'sms': 'SMS',
    'voice': 'VOICE',
    'linkedin_dm': 'LINKEDIN_DM',
    'twitter_dm': 'TWITTER_DM',
  };
  return map[channel?.toLowerCase()] || 'EMAIL';
}

function mapOutreachStatus(status: string): string {
  const map: Record<string, string> = {
    'draft': 'DRAFT',
    'queued': 'QUEUED',
    'sent': 'SENT',
    'delivered': 'DELIVERED',
    'opened': 'OPENED',
    'clicked': 'CLICKED',
    'replied': 'REPLIED',
    'bounced': 'BOUNCED',
    'failed': 'FAILED',
  };
  return map[status?.toLowerCase()] || 'DRAFT';
}

async function main() {
  console.log('🚀 AgentFlow → Unified Schema Migration');
  console.log(isDryRun ? '⚠️  DRY RUN MODE — no data will be written' : '🔥 LIVE MODE — writing to database');
  console.log(`📍 Source: ${oldSupabaseUrl}`);
  console.log(`📍 Target org: ${ORG_ID}`);
  console.log('');

  try {
    // Fetch from old AgentFlow
    console.log('📥 Fetching from old AgentFlow Supabase...');

    const { data: companies, error: companiesErr } = await oldSupabase.from('companies').select('*');
    if (companiesErr) throw new Error(`Companies fetch failed: ${companiesErr.message}`);
    console.log(`  ✓ Companies: ${companies?.length || 0} records`);

    const { data: contacts, error: contactsErr } = await oldSupabase.from('contacts').select('*');
    if (contactsErr) throw new Error(`Contacts fetch failed: ${contactsErr.message}`);
    console.log(`  ✓ Contacts: ${contacts?.length || 0} records`);

    const { data: leads, error: leadsErr } = await oldSupabase.from('leads').select('*');
    if (leadsErr) throw new Error(`Leads fetch failed: ${leadsErr.message}`);
    console.log(`  ✓ Leads: ${leads?.length || 0} records`);

    const { data: messages, error: messagesErr } = await oldSupabase.from('outreach_messages').select('*');
    if (messagesErr) throw new Error(`Messages fetch failed: ${messagesErr.message}`);
    console.log(`  ✓ Outreach Messages: ${messages?.length || 0} records`);
    console.log('');

    // Migrate in order (companies first, then dependent tables)
    console.log('📤 Migrating to unified schema...');
    await migrateCompanies(companies || []);
    await migrateContacts(contacts || []);
    await migrateLeads(leads || []);
    await migrateOutreachMessages(messages || []);

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
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
