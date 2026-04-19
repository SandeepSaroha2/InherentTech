/**
 * KudoDoc Initial Setup Script
 * Creates default document templates for the KudoDoc digital signature module
 *
 * Prerequisites:
 *   1. Set DATABASE_URL env var pointing to Supabase PostgreSQL
 *   2. Run: npx tsx packages/db/scripts/import-kudodoc.ts
 *
 * What it does:
 *   - Creates default document templates for digital signatures
 *   - Sets up templates for: Offer Letters, NDAs, Right to Represent, Timesheets, MSAs
 *   - Defines field definitions for each template
 *   - Marks templates as active and ready for use
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORG_ID = process.env.MIGRATION_ORG_ID || '';

const defaultTemplates = [
  {
    name: 'Offer Letter',
    description: 'Standard employment offer letter for W2 or C2C placements',
    category: 'employment',
    fields: [
      { name: 'candidate_name', type: 'text', required: true },
      { name: 'position_title', type: 'text', required: true },
      { name: 'start_date', type: 'date', required: true },
      { name: 'salary_rate', type: 'number', required: true },
      { name: 'employment_type', type: 'select', options: ['W2', 'C2C', '1099'], required: true },
      { name: 'manager_name', type: 'text', required: false },
      { name: 'candidate_signature', type: 'signature', required: true },
      { name: 'company_signature', type: 'signature', required: true },
    ],
    content: '<h1>Offer of Employment</h1><p>Dear {{candidate_name}},</p><p>We are pleased to offer you the position of {{position_title}} starting {{start_date}} at a rate of ${{salary_rate}} ({{employment_type}}).</p><p>Please sign below to accept.</p>',
  },
  {
    name: 'NDA - Mutual',
    description: 'Mutual non-disclosure agreement for client engagements',
    category: 'legal',
    fields: [
      { name: 'party_a_name', type: 'text', required: true },
      { name: 'party_b_name', type: 'text', required: true },
      { name: 'effective_date', type: 'date', required: true },
      { name: 'term_months', type: 'number', required: true },
      { name: 'party_a_signature', type: 'signature', required: true },
      { name: 'party_b_signature', type: 'signature', required: true },
    ],
    content: '<h1>Mutual Non-Disclosure Agreement</h1><p>This NDA is entered between {{party_a_name}} and {{party_b_name}} effective {{effective_date}} for a period of {{term_months}} months.</p>',
  },
  {
    name: 'Right to Represent',
    description: 'Authorization for InherentTech to submit candidate to client',
    category: 'staffing',
    fields: [
      { name: 'candidate_name', type: 'text', required: true },
      { name: 'client_name', type: 'text', required: true },
      { name: 'position_title', type: 'text', required: true },
      { name: 'date', type: 'date', required: true },
      { name: 'candidate_signature', type: 'signature', required: true },
    ],
    content: '<h1>Right to Represent</h1><p>I, {{candidate_name}}, authorize InherentTech to submit my resume for the position of {{position_title}} at {{client_name}}.</p>',
  },
  {
    name: 'Timesheet Approval',
    description: 'Weekly timesheet approval form',
    category: 'operations',
    fields: [
      { name: 'consultant_name', type: 'text', required: true },
      { name: 'week_ending', type: 'date', required: true },
      { name: 'total_hours', type: 'number', required: true },
      { name: 'consultant_signature', type: 'signature', required: true },
      { name: 'manager_signature', type: 'signature', required: true },
    ],
    content: '<h1>Timesheet Approval</h1><p>Consultant: {{consultant_name}}<br/>Week Ending: {{week_ending}}<br/>Total Hours: {{total_hours}}</p>',
  },
  {
    name: 'Client MSA',
    description: 'Master Service Agreement for client engagements',
    category: 'legal',
    fields: [
      { name: 'client_name', type: 'text', required: true },
      { name: 'effective_date', type: 'date', required: true },
      { name: 'bill_rate', type: 'number', required: true },
      { name: 'payment_terms', type: 'select', options: ['Net 15', 'Net 30', 'Net 45', 'Net 60'], required: true },
      { name: 'client_signature', type: 'signature', required: true },
      { name: 'inherenttech_signature', type: 'signature', required: true },
    ],
    content: '<h1>Master Service Agreement</h1><p>This agreement between InherentTech and {{client_name}}, effective {{effective_date}}.</p>',
  },
];

async function main() {
  console.log('📄 KudoDoc — Creating default document templates...');
  console.log(`📍 Target org: ${ORG_ID}`);
  console.log('');

  let created = 0;

  for (const template of defaultTemplates) {
    try {
      const templateId = `template-${template.name.toLowerCase().replace(/\s+/g, '-')}`;

      await prisma.documentTemplate.upsert({
        where: { id: templateId },
        update: {
          fields: template.fields as any,
          content: template.content,
        },
        create: {
          id: templateId,
          orgId: ORG_ID,
          name: template.name,
          description: template.description,
          category: template.category,
          fields: template.fields as any,
          content: template.content,
          isActive: true,
          createdById: '', // Will be set to admin user ID during setup
        },
      });
      console.log(`  ✅ Template: ${template.name}`);
      created++;
    } catch (err: any) {
      console.log(`  ❌ ${template.name}: ${err.message}`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log(`🎉 ${created}/${defaultTemplates.length} templates created or updated!`);
  console.log('═══════════════════════════════════════');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
