/**
 * Database tool implementations for AI agents.
 *
 * Each function accepts a Prisma client instance (injected from the API layer)
 * and the org-scoped context so every query is tenant-safe.
 *
 * These are pure data-fetching helpers — no side-effects beyond reads,
 * except for explicit write tools (createActivity, createSubmission, etc.).
 */

// We type the prisma client loosely here so this package doesn't depend on @prisma/client directly.
// The API layer passes the real PrismaClient at runtime.
type PrismaClient = any;

// ---------------------------------------------------------------------------
// ATS / Candidate tools
// ---------------------------------------------------------------------------

export async function searchCandidates(
  prisma: PrismaClient,
  orgId: string,
  input: any
): Promise<string> {
  const where: any = { orgId };

  if (input.status) {
    where.status = input.status;
  }
  if (input.visaStatus) {
    where.visaStatus = input.visaStatus;
  }
  if (input.location) {
    where.location = { contains: input.location, mode: 'insensitive' };
  }
  if (input.minExperience) {
    where.yearsOfExperience = { gte: input.minExperience };
  }
  if (input.maxRate) {
    where.expectedRate = { lte: input.maxRate };
  }
  if (input.skills && input.skills.length > 0) {
    where.skills = { hasSome: input.skills };
  }

  const candidates = await prisma.candidate.findMany({
    where,
    take: input.limit || 20,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      visaStatus: true,
      currentTitle: true,
      skills: true,
      yearsOfExperience: true,
      expectedRate: true,
      location: true,
      status: true,
    },
  });

  return JSON.stringify({ count: candidates.length, candidates });
}

export async function getBenchCandidates(
  prisma: PrismaClient,
  orgId: string,
  input: any
): Promise<string> {
  // Bench candidates = ACTIVE status with no current active placement
  const candidates = await prisma.candidate.findMany({
    where: {
      orgId,
      status: 'ACTIVE',
      placements: {
        none: { status: 'ACTIVE' },
      },
    },
    take: input.limit || 50,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      visaStatus: true,
      currentTitle: true,
      skills: true,
      yearsOfExperience: true,
      expectedRate: true,
      location: true,
      placements: {
        where: { status: 'COMPLETED' },
        orderBy: { endDate: 'desc' },
        take: 1,
        select: { endDate: true, billRate: true, payRate: true, jobOrder: { select: { title: true, client: { select: { companyName: true } } } } },
      },
    },
  });

  // Compute bench days for each
  const now = new Date();
  const enriched = candidates.map((c: any) => {
    const lastPlacement = c.placements[0];
    const benchSince = lastPlacement?.endDate ? new Date(lastPlacement.endDate) : null;
    const benchDays = benchSince ? Math.floor((now.getTime() - benchSince.getTime()) / 86400000) : null;
    const dailyCost = c.expectedRate ? Number(c.expectedRate) * 8 : null;
    return {
      ...c,
      benchSince: benchSince?.toISOString() || 'unknown',
      benchDays,
      estimatedDailyCost: dailyCost,
      estimatedTotalBenchCost: dailyCost && benchDays ? dailyCost * benchDays : null,
      lastPlacement: lastPlacement
        ? { endDate: lastPlacement.endDate, billRate: lastPlacement.billRate, payRate: lastPlacement.payRate, jobTitle: lastPlacement.jobOrder?.title, client: lastPlacement.jobOrder?.client?.companyName }
        : null,
    };
  });

  const totalBenchCost = enriched.reduce((s: number, c: any) => s + (c.estimatedTotalBenchCost || 0), 0);

  return JSON.stringify({
    count: enriched.length,
    totalEstimatedBenchCost: totalBenchCost,
    candidates: enriched,
  });
}

export async function getOpenJobOrders(
  prisma: PrismaClient,
  orgId: string,
  input: any
): Promise<string> {
  const where: any = { orgId, status: 'OPEN' };
  if (input.skills && input.skills.length > 0) {
    where.requirements = { hasSome: input.skills };
  }

  const jobs = await prisma.jobOrder.findMany({
    where,
    take: input.limit || 20,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      requirements: true,
      location: true,
      rateRange: true,
      openings: true,
      filled: true,
      priority: true,
      status: true,
      client: { select: { id: true, companyName: true } },
      _count: { select: { submissions: true } },
    },
  });

  return JSON.stringify({ count: jobs.length, jobOrders: jobs });
}

export async function matchCandidatesToJob(
  prisma: PrismaClient,
  orgId: string,
  input: any
): Promise<string> {
  const job = await prisma.jobOrder.findFirst({
    where: { id: input.jobOrderId, orgId },
    include: { client: { select: { companyName: true } } },
  });
  if (!job) return JSON.stringify({ error: 'Job order not found' });

  // Find candidates whose skills overlap with job requirements
  const candidates = await prisma.candidate.findMany({
    where: {
      orgId,
      status: 'ACTIVE',
      skills: { hasSome: job.requirements },
    },
    take: input.maxResults || 10,
    orderBy: { yearsOfExperience: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      skills: true,
      yearsOfExperience: true,
      expectedRate: true,
      visaStatus: true,
      location: true,
      currentTitle: true,
    },
  });

  // Score each match
  const scored = candidates.map((c: any) => {
    const matchingSkills = c.skills.filter((s: string) =>
      job.requirements.some((r: string) => r.toLowerCase() === s.toLowerCase())
    );
    const skillScore = job.requirements.length > 0 ? (matchingSkills.length / job.requirements.length) * 100 : 0;
    return {
      ...c,
      matchingSkills,
      skillMatchPercent: Math.round(skillScore),
    };
  });

  scored.sort((a: any, b: any) => b.skillMatchPercent - a.skillMatchPercent);

  return JSON.stringify({
    job: { id: job.id, title: job.title, requirements: job.requirements, client: job.client?.companyName, rateRange: job.rateRange },
    matchCount: scored.length,
    matches: scored,
  });
}

// ---------------------------------------------------------------------------
// CRM / Lead tools
// ---------------------------------------------------------------------------

export async function searchLeads(
  prisma: PrismaClient,
  orgId: string,
  input: any
): Promise<string> {
  const where: any = { orgId };
  if (input.stage) where.stage = input.stage;
  if (input.query) {
    where.OR = [
      { companyName: { contains: input.query, mode: 'insensitive' } },
      { contactName: { contains: input.query, mode: 'insensitive' } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    take: input.limit || 10,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      contactEmail: true,
      stage: true,
      source: true,
      value: true,
      createdAt: true,
      _count: { select: { activities: true, jobOrders: true } },
    },
  });

  return JSON.stringify({ count: leads.length, leads });
}

export async function getClientProfile(
  prisma: PrismaClient,
  orgId: string,
  input: any
): Promise<string> {
  const lead = await prisma.lead.findFirst({
    where: { id: input.clientId, orgId },
    include: {
      activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      jobOrders: {
        include: {
          _count: { select: { submissions: true, placements: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      assignedTo: { select: { name: true, email: true } },
    },
  });
  if (!lead) return JSON.stringify({ error: 'Client not found' });

  // Get placements and revenue through job orders
  const jobOrderIds = lead.jobOrders.map((j: any) => j.id);
  const placements = jobOrderIds.length > 0
    ? await prisma.placement.findMany({
        where: { orgId, jobOrderId: { in: jobOrderIds } },
        include: { candidate: { select: { firstName: true, lastName: true } } },
      })
    : [];

  const invoices = jobOrderIds.length > 0
    ? await prisma.invoice.findMany({
        where: { orgId, placement: { jobOrderId: { in: jobOrderIds } } },
        select: { amount: true, status: true, dueDate: true, paidAt: true },
      })
    : [];

  const totalRevenue = invoices
    .filter((i: any) => i.status === 'PAID')
    .reduce((s: number, i: any) => s + Number(i.amount), 0);

  const overdueInvoices = invoices.filter((i: any) => i.status === 'OVERDUE');

  // Activity frequency
  const recentActivities = lead.activities.filter((a: any) => {
    const d = new Date(a.createdAt);
    const daysDiff = (Date.now() - d.getTime()) / 86400000;
    return daysDiff <= 90;
  });

  // Health scoring
  const engagementScore = Math.min(100, recentActivities.length * 10);
  const revenueScore = Math.min(100, totalRevenue / 500); // $50k = 100
  const paymentScore = overdueInvoices.length === 0 ? 100 : Math.max(0, 100 - overdueInvoices.length * 30);
  const healthScore = Math.round((engagementScore + revenueScore + paymentScore) / 3);

  let healthStatus: 'active' | 'at-risk' | 'churned' = 'active';
  if (healthScore < 30) healthStatus = 'churned';
  else if (healthScore < 60) healthStatus = 'at-risk';

  return JSON.stringify({
    client: {
      id: lead.id,
      companyName: lead.companyName,
      contactName: lead.contactName,
      contactEmail: lead.contactEmail,
      stage: lead.stage,
      source: lead.source,
      value: lead.value,
      assignedTo: lead.assignedTo,
    },
    healthScore,
    healthStatus,
    scoring: { engagementScore, revenueScore, paymentScore },
    revenue: { totalRevenue, invoiceCount: invoices.length, overdueCount: overdueInvoices.length },
    placements: { active: placements.filter((p: any) => p.status === 'ACTIVE').length, total: placements.length },
    jobOrders: lead.jobOrders.map((j: any) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      priority: j.priority,
      submissions: j._count.submissions,
      placements: j._count.placements,
    })),
    recentActivityCount: recentActivities.length,
    lastActivityDate: lead.activities[0]?.createdAt || null,
  });
}

// ---------------------------------------------------------------------------
// Recruiter performance tools
// ---------------------------------------------------------------------------

export async function getRecruiterMetrics(
  prisma: PrismaClient,
  orgId: string,
  input: any
): Promise<string> {
  const period = input.periodDays || 30;
  const since = new Date(Date.now() - period * 86400000);

  const where: any = { orgId, createdAt: { gte: since } };

  // If a specific recruiter, scope to their submissions
  const recruiterFilter = input.recruiterId ? { submittedById: input.recruiterId } : {};

  const submissions = await prisma.submission.findMany({
    where: { ...where, ...recruiterFilter },
    select: {
      id: true,
      status: true,
      billRate: true,
      payRate: true,
      submittedById: true,
      submittedBy: { select: { name: true, email: true } },
      candidate: { select: { firstName: true, lastName: true } },
      jobOrder: { select: { title: true, client: { select: { companyName: true } } } },
    },
  });

  const placements = await prisma.placement.findMany({
    where: { orgId, createdAt: { gte: since }, ...(input.recruiterId ? { assignedToId: input.recruiterId } : {}) },
    select: {
      id: true,
      billRate: true,
      payRate: true,
      status: true,
      assignedToId: true,
      candidate: { select: { firstName: true, lastName: true } },
      jobOrder: { select: { title: true } },
    },
  });

  // Group by recruiter
  const recruiterMap: Record<string, any> = {};
  for (const sub of submissions) {
    const rid = sub.submittedById;
    if (!recruiterMap[rid]) {
      recruiterMap[rid] = {
        recruiterId: rid,
        name: sub.submittedBy?.name || 'Unknown',
        email: sub.submittedBy?.email,
        submissions: 0,
        interviews: 0,
        offers: 0,
        placements: 0,
        rejections: 0,
        totalBillRate: 0,
        totalPayRate: 0,
      };
    }
    recruiterMap[rid].submissions++;
    if (sub.status === 'INTERVIEW') recruiterMap[rid].interviews++;
    if (sub.status === 'OFFERED' || sub.status === 'ACCEPTED') recruiterMap[rid].offers++;
    if (sub.status === 'REJECTED') recruiterMap[rid].rejections++;
    if (sub.billRate) recruiterMap[rid].totalBillRate += Number(sub.billRate);
    if (sub.payRate) recruiterMap[rid].totalPayRate += Number(sub.payRate);
  }

  for (const pl of placements) {
    const rid = pl.assignedToId;
    if (rid && recruiterMap[rid]) {
      recruiterMap[rid].placements++;
    }
  }

  const recruiters = Object.values(recruiterMap).map((r: any) => ({
    ...r,
    conversionRate: r.submissions > 0 ? Math.round((r.placements / r.submissions) * 100) : 0,
    avgMargin: r.submissions > 0 ? Math.round(((r.totalBillRate - r.totalPayRate) / r.submissions) * 100) / 100 : 0,
  }));

  recruiters.sort((a: any, b: any) => b.placements - a.placements);

  return JSON.stringify({
    period: `${period} days`,
    totalSubmissions: submissions.length,
    totalPlacements: placements.length,
    recruiters,
  });
}

export async function getPlacementsPipeline(
  prisma: PrismaClient,
  orgId: string,
  input: any
): Promise<string> {
  const days = input.endingSoonDays || 30;
  const cutoff = new Date(Date.now() + days * 86400000);

  const endingSoon = await prisma.placement.findMany({
    where: {
      orgId,
      status: 'ACTIVE',
      endDate: { lte: cutoff, gte: new Date() },
    },
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true, skills: true, visaStatus: true, expectedRate: true } },
      jobOrder: { select: { title: true, client: { select: { companyName: true } } } },
    },
    orderBy: { endDate: 'asc' },
  });

  const activePlacements = await prisma.placement.count({ where: { orgId, status: 'ACTIVE' } });

  return JSON.stringify({
    activePlacements,
    endingSoonCount: endingSoon.length,
    endingSoon: endingSoon.map((p: any) => ({
      id: p.id,
      candidate: `${p.candidate.firstName} ${p.candidate.lastName}`,
      candidateId: p.candidate.id,
      candidateSkills: p.candidate.skills,
      candidateVisa: p.candidate.visaStatus,
      jobTitle: p.jobOrder.title,
      client: p.jobOrder.client?.companyName,
      endDate: p.endDate,
      daysRemaining: Math.ceil((new Date(p.endDate).getTime() - Date.now()) / 86400000),
      billRate: p.billRate,
      payRate: p.payRate,
      margin: Number(p.billRate) - Number(p.payRate),
    })),
  });
}

// ---------------------------------------------------------------------------
// Write tools (create activity, create submission)
// ---------------------------------------------------------------------------

export async function createActivity(
  prisma: PrismaClient,
  orgId: string,
  userId: string,
  input: any
): Promise<string> {
  const activity = await prisma.activity.create({
    data: {
      orgId,
      leadId: input.leadId,
      userId,
      type: input.type as any,
      subject: input.description.substring(0, 100),
      description: input.description,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    },
  });
  return JSON.stringify({ success: true, activityId: activity.id });
}

export async function createSubmission(
  prisma: PrismaClient,
  orgId: string,
  userId: string,
  input: any
): Promise<string> {
  const submission = await prisma.submission.create({
    data: {
      orgId,
      candidateId: input.candidateId,
      jobOrderId: input.jobOrderId,
      submittedById: userId,
      billRate: input.billRate,
      payRate: input.payRate,
      internalNotes: input.notes,
    },
  });
  return JSON.stringify({ success: true, submissionId: submission.id });
}

export async function getOrgSummary(
  prisma: PrismaClient,
  orgId: string,
): Promise<string> {
  const [candidateCount, activeCandidates, openJobs, activePlacements, leadCount, recentActivities] = await Promise.all([
    prisma.candidate.count({ where: { orgId } }),
    prisma.candidate.count({ where: { orgId, status: 'ACTIVE' } }),
    prisma.jobOrder.count({ where: { orgId, status: 'OPEN' } }),
    prisma.placement.count({ where: { orgId, status: 'ACTIVE' } }),
    prisma.lead.count({ where: { orgId } }),
    prisma.activity.count({ where: { orgId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
  ]);

  return JSON.stringify({
    totalCandidates: candidateCount,
    activeCandidates,
    openJobOrders: openJobs,
    activePlacements,
    totalLeads: leadCount,
    activitiesLast7Days: recentActivities,
  });
}
