/**
 * Database Seed Script
 * Creates development data for all modules
 * Run: npm run db:seed (from packages/db or root)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Organization ───
  const org = await prisma.organization.upsert({
    where: { slug: 'inherenttech' },
    update: {},
    create: {
      name: 'InherentTech',
      slug: 'inherenttech',
      plan: 'enterprise',
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        defaultBillRate: 85,
        defaultPayRate: 55,
      },
    },
  });
  console.log(`✅ Organization: ${org.name}`);

  // ─── Users ───
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@inherenttech.com' },
      update: {},
      create: { orgId: org.id, email: 'admin@inherenttech.com', name: 'Admin User', role: 'OWNER' },
    }),
    prisma.user.upsert({
      where: { email: 'recruiter@inherenttech.com' },
      update: {},
      create: { orgId: org.id, email: 'recruiter@inherenttech.com', name: 'Sarah Recruiter', role: 'RECRUITER' },
    }),
    prisma.user.upsert({
      where: { email: 'teamlead@inherenttech.com' },
      update: {},
      create: { orgId: org.id, email: 'teamlead@inherenttech.com', name: 'Mike Lead', role: 'TEAM_LEAD' },
    }),
  ]);
  console.log(`✅ Users: ${users.length} created`);

  // ─── Projects (Non-billable defaults) ───
  const defaultProjects = ['Bench', 'Training', 'Internal Meeting', 'Holiday', 'PTO', 'Sick Leave'];
  for (const name of defaultProjects) {
    await prisma.project.upsert({
      where: { id: `default-${name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `default-${name.toLowerCase().replace(/\s/g, '-')}`,
        orgId: org.id,
        name,
        billable: false,
        status: 'active',
      },
    });
  }
  console.log(`✅ Projects: ${defaultProjects.length} non-billable defaults`);

  // ─── Sample Leads ───
  const leads = await Promise.all([
    prisma.lead.upsert({
      where: { id: 'seed-lead-1' },
      update: {},
      create: {
        id: 'seed-lead-1',
        orgId: org.id,
        companyName: 'TechCorp Solutions',
        contactName: 'Jennifer Smith',
        contactEmail: 'jsmith@techcorp.example.com',
        contactPhone: '+1-555-0101',
        stage: 'QUALIFIED',
        source: 'LinkedIn',
        assignedToId: users[1].id,
        value: 250000,
        notes: 'Looking for 5 Java developers for Q2 project',
      },
    }),
    prisma.lead.upsert({
      where: { id: 'seed-lead-2' },
      update: {},
      create: {
        id: 'seed-lead-2',
        orgId: org.id,
        companyName: 'FinanceHub Inc',
        contactName: 'Robert Chen',
        contactEmail: 'rchen@financehub.example.com',
        stage: 'PROPOSAL',
        source: 'Referral',
        assignedToId: users[0].id,
        value: 180000,
      },
    }),
  ]);
  console.log(`✅ Leads: ${leads.length} sample leads`);

  // ─── Sample Candidates ───
  const candidates = await Promise.all([
    prisma.candidate.upsert({
      where: { id: 'seed-cand-1' },
      update: {},
      create: {
        id: 'seed-cand-1',
        orgId: org.id,
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex.j@example.com',
        phone: '+1-555-0201',
        visaStatus: 'US_CITIZEN',
        currentTitle: 'Senior Java Developer',
        skills: ['Java', 'Spring Boot', 'AWS', 'Microservices'],
        yearsOfExperience: 8,
        expectedRate: 85,
        location: 'Dallas, TX',
        status: 'ACTIVE',
      },
    }),
    prisma.candidate.upsert({
      where: { id: 'seed-cand-2' },
      update: {},
      create: {
        id: 'seed-cand-2',
        orgId: org.id,
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.p@example.com',
        visaStatus: 'H1B',
        currentTitle: 'Full Stack Developer',
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
        yearsOfExperience: 5,
        expectedRate: 70,
        location: 'Austin, TX',
        status: 'ACTIVE',
      },
    }),
    prisma.candidate.upsert({
      where: { id: 'seed-cand-3' },
      update: {},
      create: {
        id: 'seed-cand-3',
        orgId: org.id,
        firstName: 'David',
        lastName: 'Kim',
        email: 'david.k@example.com',
        visaStatus: 'GREEN_CARD',
        currentTitle: 'DevOps Engineer',
        skills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Docker'],
        yearsOfExperience: 6,
        expectedRate: 90,
        location: 'Remote',
        status: 'ACTIVE',
      },
    }),
  ]);
  console.log(`✅ Candidates: ${candidates.length} sample candidates`);

  // ─── Sample Job Orders ───
  const jobs = await Promise.all([
    prisma.jobOrder.upsert({
      where: { id: 'seed-job-1' },
      update: {},
      create: {
        id: 'seed-job-1',
        orgId: org.id,
        clientId: leads[0].id,
        title: 'Senior Java Developer',
        description: 'Build microservices for cloud migration project',
        requirements: ['Java 17+', 'Spring Boot', 'AWS', '5+ years experience'],
        location: 'Dallas, TX (Hybrid)',
        rateRange: { min: 75, max: 95, type: 'hourly' },
        openings: 3,
        priority: 'HIGH',
        status: 'OPEN',
        assignedToId: users[1].id,
      },
    }),
  ]);
  console.log(`✅ Job Orders: ${jobs.length} sample jobs`);

  // ─── Sample AI Agents ───
  const agentNames = ['SCREENER', 'SCHEDULER', 'OUTREACH', 'ONBOARDING', 'PLACEMENT'] as const;
  for (const name of agentNames) {
    await prisma.agent.upsert({
      where: { id: `agent-${name.toLowerCase()}` },
      update: {},
      create: {
        id: `agent-${name.toLowerCase()}`,
        orgId: org.id,
        name,
        description: `AI ${name.charAt(0) + name.slice(1).toLowerCase()} Agent`,
        config: { model: 'claude-sonnet-4-20250514', maxTokens: 4096 },
        isActive: true,
      },
    });
  }
  console.log(`✅ AI Agents: ${agentNames.length} agents configured`);

  // ─── Sample Document Templates ───
  const templates = ['Offer Letter', 'NDA - Mutual', 'Right to Represent', 'Timesheet Approval', 'Client MSA'];
  for (const name of templates) {
    await prisma.documentTemplate.upsert({
      where: { id: `template-${name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `template-${name.toLowerCase().replace(/\s+/g, '-')}`,
        orgId: org.id,
        name,
        description: `Default ${name} template`,
        content: `<h1>${name}</h1><p>Template content goes here.</p>`,
        fields: [],
        category: name.includes('NDA') || name.includes('MSA') ? 'legal' : 'staffing',
        isActive: true,
        createdById: users[0].id,
      },
    });
  }
  console.log(`✅ Document Templates: ${templates.length} defaults`);

  // ─── Plans (SaaS Module 9) ───
  const plans = [
    {
      name: 'Free',
      tier: 'FREE' as const,
      description: 'Perfect for getting started',
      price: 0,
      annualPrice: null,
      currency: 'USD',
      maxUsers: 1,
      maxCandidates: 50,
      maxJobOrders: 5,
      maxDocuments: 25,
      maxEmailsMonth: 100,
      maxAgentRuns: 0,
      storageGb: 0.5,
      features: [] as any[],
      isActive: true,
    },
    {
      name: 'Starter',
      tier: 'STARTER' as const,
      description: 'For growing recruitment teams',
      price: 49,
      annualPrice: 470,
      currency: 'USD',
      maxUsers: 3,
      maxCandidates: 500,
      maxJobOrders: 25,
      maxDocuments: 200,
      maxEmailsMonth: 2000,
      maxAgentRuns: 50,
      storageGb: 5,
      features: ['AI_AGENTS', 'ECAFY_OUTREACH'] as any[],
      isActive: true,
    },
    {
      name: 'Professional',
      tier: 'PROFESSIONAL' as const,
      description: 'For established staffing firms',
      price: 149,
      annualPrice: 1430,
      currency: 'USD',
      maxUsers: 10,
      maxCandidates: 5000,
      maxJobOrders: 100,
      maxDocuments: 1000,
      maxEmailsMonth: 10000,
      maxAgentRuns: 500,
      storageGb: 25,
      features: [
        'AI_AGENTS',
        'ECAFY_OUTREACH',
        'KUDODOC_ESIGN',
        'JOB_BOARD',
        'ADVANCED_ANALYTICS',
        'API_ACCESS',
      ] as any[],
      isActive: true,
    },
    {
      name: 'Enterprise',
      tier: 'ENTERPRISE' as const,
      description: 'Custom solutions for large teams',
      price: 0,
      annualPrice: null,
      currency: 'USD',
      maxUsers: 999,
      maxCandidates: 999999,
      maxJobOrders: 999999,
      maxDocuments: 999999,
      maxEmailsMonth: 999999,
      maxAgentRuns: 999999,
      storageGb: 100,
      features: [
        'AI_AGENTS',
        'ECAFY_OUTREACH',
        'KUDODOC_ESIGN',
        'JOB_BOARD',
        'ADVANCED_ANALYTICS',
        'CUSTOM_BRANDING',
        'API_ACCESS',
        'SSO',
        'PRIORITY_SUPPORT',
        'UNLIMITED_USERS',
      ] as any[],
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: {},
      create: plan,
    });
  }
  console.log(`✅ Plans: ${plans.length} pricing tiers configured`);

  // ─── Trial Subscription for InherentTech Org ───
  const freePlan = await prisma.plan.findFirst({ where: { tier: 'FREE' } });
  if (freePlan) {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.subscription.upsert({
      where: { orgId: org.id },
      update: {},
      create: {
        orgId: org.id,
        planId: freePlan.id,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
    console.log(`✅ Subscription: Trial subscription created for ${org.name}`);
  }

  console.log('\n🎉 Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
