import { NextResponse } from 'next/server';
import { RecruiterIQ, BenchIQ, ClientIQ } from '@inherenttech/shared';

// Agent registry with configs
const AGENTS = [
  {
    id: 'recruiter-iq',
    name: 'RECRUITER_IQ',
    displayName: 'RecruiterIQ',
    description: 'AI recruiting assistant that sources candidates, matches them to job orders, and automates outreach.',
    icon: '🎯',
    autonomyLevel: 'DRAFT',
    status: 'active',
    capabilities: [
      'Parse and analyze resumes',
      'Match candidates to job orders',
      'Score candidate-job fit',
      'Draft outreach emails',
      'Auto-create submissions',
      'Monitor new job orders',
      'Track candidate availability',
    ],
    triggers: ['job_order.created', 'candidate.created', 'candidate.resume_parsed', 'submission.rejected', 'placement.ending_soon'],
    stats: { totalExecutions: 342, successRate: 94.2, avgResponseTime: 2.3, actionsThisWeek: 47 },
  },
  {
    id: 'bench-iq',
    name: 'BENCH_IQ',
    displayName: 'BenchIQ',
    description: 'AI bench management assistant that tracks consultants between assignments and identifies redeployment opportunities.',
    icon: '📊',
    autonomyLevel: 'DRAFT',
    status: 'active',
    capabilities: [
      'Monitor end-of-assignment dates',
      'Find redeployment opportunities',
      'Suggest upskilling courses',
      'Draft check-in emails',
      'Track bench costs',
      'Alert on availability',
      'Generate bench reports',
    ],
    triggers: ['placement.ending_soon', 'placement.ended', 'candidate.status_changed', 'job_order.created', 'weekly.bench_review'],
    stats: { totalExecutions: 156, successRate: 97.1, avgResponseTime: 1.8, actionsThisWeek: 23 },
  },
  {
    id: 'client-iq',
    name: 'CLIENT_IQ',
    displayName: 'ClientIQ',
    description: 'AI client intelligence assistant that scores relationships, detects upsell opportunities, and monitors satisfaction.',
    icon: '🏢',
    autonomyLevel: 'DRAFT',
    status: 'active',
    capabilities: [
      'Score client relationships',
      'Detect upsell opportunities',
      'Monitor satisfaction signals',
      'Draft engagement emails',
      'Alert on churn risk',
      'Generate client briefs',
      'Track competitive threats',
    ],
    triggers: ['lead.stage_changed', 'placement.created', 'invoice.overdue', 'activity.created', 'weekly.client_review', 'lead.created'],
    stats: { totalExecutions: 89, successRate: 91.8, avgResponseTime: 3.1, actionsThisWeek: 12 },
  },
  {
    id: 'compliance-iq',
    name: 'COMPLIANCE_IQ',
    displayName: 'ComplianceIQ',
    description: 'Monitors visa deadlines, document expirations, and regulatory compliance across all placements.',
    icon: '🛡️',
    autonomyLevel: 'SHADOW',
    status: 'inactive',
    capabilities: [
      'Track visa expiration dates',
      'Monitor document compliance',
      'Alert on regulatory deadlines',
      'Generate compliance reports',
    ],
    triggers: ['placement.created', 'document.expiring', 'weekly.compliance_review'],
    stats: { totalExecutions: 0, successRate: 0, avgResponseTime: 0, actionsThisWeek: 0 },
  },
  {
    id: 'billing-iq',
    name: 'BILLING_IQ',
    displayName: 'BillingIQ',
    description: 'Automates timesheet reminders, invoice generation, and payment follow-ups.',
    icon: '💰',
    autonomyLevel: 'SHADOW',
    status: 'inactive',
    capabilities: [
      'Send timesheet reminders',
      'Auto-generate invoices',
      'Track payment status',
      'Flag billing discrepancies',
    ],
    triggers: ['timesheet.due', 'timesheet.approved', 'invoice.overdue', 'weekly.billing_review'],
    stats: { totalExecutions: 0, successRate: 0, avgResponseTime: 0, actionsThisWeek: 0 },
  },
];

export async function GET() {
  return NextResponse.json({ agents: AGENTS });
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { agentId, action, input, event, orgId, userId, clientId, jobOrderId } = body;

  const agentDef = AGENTS.find(a => a.id === agentId);
  if (!agentDef) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  // Check for ANTHROPIC_API_KEY
  if (!process.env.ANTHROPIC_API_KEY) {
    // Return a simulated response when no API key is configured
    return NextResponse.json({
      execution: {
        id: `exec_${Date.now()}`,
        agentId,
        agentName: agentDef.displayName,
        input: input || event,
        status: 'completed',
        actions: [],
        reasoning: `[Demo Mode] ${agentDef.displayName} would analyze the data using AI, but ANTHROPIC_API_KEY is not configured. Set the environment variable to enable real AI analysis.`,
        tokensUsed: 0,
        durationMs: 0,
        createdAt: new Date().toISOString(),
      },
    });
  }

  // Dynamically import prisma to avoid build-time issues
  let prisma: any;
  try {
    const dbModule = await import('@inherenttech/db');
    prisma = dbModule.prisma;
  } catch {
    prisma = null;
  }

  const effectiveOrgId = orgId || 'default-org';
  const effectiveUserId = userId || 'system';

  try {
    let result: any;

    switch (agentId) {
      case 'recruiter-iq': {
        const agent = new RecruiterIQ();
        if (prisma) agent.setPrisma(prisma);
        if (action === 'match' && jobOrderId) {
          result = await agent.matchForJob(effectiveOrgId, effectiveUserId, jobOrderId);
        } else {
          result = await agent.analyzeRecruitment(effectiveOrgId, effectiveUserId, input);
        }
        break;
      }
      case 'bench-iq': {
        const agent = new BenchIQ();
        if (prisma) agent.setPrisma(prisma);
        result = await agent.analyzeBench(effectiveOrgId, effectiveUserId, input);
        break;
      }
      case 'client-iq': {
        const agent = new ClientIQ();
        if (prisma) agent.setPrisma(prisma);
        if (clientId) {
          result = await agent.analyzeClient(effectiveOrgId, effectiveUserId, clientId, input);
        } else if (action === 'review-all') {
          result = await agent.analyzeAllClients(effectiveOrgId, effectiveUserId);
        } else {
          result = await agent.analyzeAllClients(effectiveOrgId, effectiveUserId);
        }
        break;
      }
      default:
        return NextResponse.json({ error: `Agent ${agentId} is not yet implemented` }, { status: 501 });
    }

    return NextResponse.json({
      execution: {
        id: result.executionId,
        agentId,
        agentName: agentDef.displayName,
        status: result.status,
        actions: result.actions,
        reasoning: result.reasoning,
        tokensUsed: result.tokensUsed,
        durationMs: result.durationMs,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: `Agent execution failed: ${error.message}`,
        execution: {
          id: `exec_${Date.now()}_error`,
          agentId,
          agentName: agentDef.displayName,
          status: 'failed',
          actions: [],
          reasoning: `Error: ${error.message}`,
          tokensUsed: 0,
          durationMs: 0,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
