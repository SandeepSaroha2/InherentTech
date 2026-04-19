import { NextResponse } from 'next/server';
import {
  AgentOrchestrator,
  RecruiterIQ,
  BenchIQ,
  ClientIQ,
  AgentAutonomyLevel,
} from '@inherenttech/shared';
import type { OrchestratorEvent } from '@inherenttech/shared';

// Singleton orchestrator
let orchestrator: AgentOrchestrator | null = null;

function getOrchestrator(prisma?: any): AgentOrchestrator {
  if (!orchestrator) {
    orchestrator = new AgentOrchestrator();

    const recruiterIQ = new RecruiterIQ();
    const benchIQ = new BenchIQ();
    const clientIQ = new ClientIQ();

    if (prisma) {
      recruiterIQ.setPrisma(prisma);
      benchIQ.setPrisma(prisma);
      clientIQ.setPrisma(prisma);
    }

    orchestrator.registerAgent(recruiterIQ);
    orchestrator.registerAgent(benchIQ);
    orchestrator.registerAgent(clientIQ);
  }
  return orchestrator;
}

/**
 * POST /api/agents/actions
 * Body: { actionId, approved, feedback } — approve or reject a pending action
 * Body: { event, data, orgId, userId } — dispatch an event to all agents
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // --- Action approval/rejection ---
  if (body.actionId) {
    const { actionId, approved, feedback } = body;

    let prisma: any;
    try {
      const dbModule = await import('@inherenttech/db');
      prisma = dbModule.prisma;
    } catch {
      prisma = null;
    }

    const orch = getOrchestrator(prisma);
    const result = await orch.resolveAction(actionId, approved);

    if (!result) {
      return NextResponse.json(
        { error: `Action ${actionId} not found in pending queue` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      actionId,
      status: result.status,
      feedback: feedback || null,
      executedAt: result.executedAt || null,
      message: `Action ${actionId} has been ${result.status}`,
    });
  }

  // --- Event dispatch ---
  if (body.event) {
    const { event, data, orgId, userId } = body;

    if (!orgId || !userId) {
      return NextResponse.json(
        { error: 'orgId and userId are required for event dispatch' },
        { status: 400 }
      );
    }

    let prisma: any;
    try {
      const dbModule = await import('@inherenttech/db');
      prisma = dbModule.prisma;
    } catch {
      prisma = null;
    }

    const orch = getOrchestrator(prisma);

    const orchestratorEvent: OrchestratorEvent = {
      type: event,
      data: data || {},
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    };

    try {
      const results = await orch.dispatchEvent(orchestratorEvent);
      return NextResponse.json({
        event,
        agentsTriggered: results.length,
        results: results.map((r) => ({
          executionId: r.executionId,
          agentName: r.agentName,
          status: r.status,
          actionsCount: r.actions.length,
          reasoning: r.reasoning,
          tokensUsed: r.tokensUsed,
          durationMs: r.durationMs,
        })),
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: `Event dispatch failed: ${error.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Request must include either actionId (for approval) or event (for dispatch)' },
    { status: 400 }
  );
}

/**
 * GET /api/agents/actions
 * Return all pending actions across all agents, plus orchestrator stats.
 */
export async function GET() {
  let prisma: any;
  try {
    const dbModule = await import('@inherenttech/db');
    prisma = dbModule.prisma;
  } catch {
    prisma = null;
  }

  const orch = getOrchestrator(prisma);
  const pendingActions = orch.getPendingActions();
  const stats = orch.getStats();
  const recentLog = orch.getExecutionLog(20);

  return NextResponse.json({
    pendingActions,
    total: pendingActions.length,
    stats,
    recentExecutions: recentLog.map((r) => ({
      executionId: r.executionId,
      agentName: r.agentName,
      status: r.status,
      actionsCount: r.actions.length,
      tokensUsed: r.tokensUsed,
      durationMs: r.durationMs,
    })),
  });
}
