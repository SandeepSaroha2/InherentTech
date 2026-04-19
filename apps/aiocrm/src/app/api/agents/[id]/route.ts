import { NextResponse } from 'next/server';

// Mock execution history
const MOCK_EXECUTIONS = [
  { id: 'exec_001', agentName: 'RecruiterIQ', event: 'job_order.created', status: 'completed', actionsCount: 3, tokensUsed: 1847, durationMs: 2340, createdAt: '2026-03-27T08:15:00Z', summary: 'Found 8 matching candidates for Senior Java Developer at TechCorp' },
  { id: 'exec_002', agentName: 'RecruiterIQ', event: 'candidate.created', status: 'completed', actionsCount: 2, tokensUsed: 1243, durationMs: 1890, createdAt: '2026-03-27T09:30:00Z', summary: 'Matched new candidate Priya Patel to 3 open positions' },
  { id: 'exec_003', agentName: 'RecruiterIQ', event: 'submission.rejected', status: 'pending_approval', actionsCount: 2, tokensUsed: 1567, durationMs: 2100, createdAt: '2026-03-27T10:00:00Z', summary: 'Found 5 alternative candidates after David Kim was rejected for DevOps role' },
  { id: 'exec_004', agentName: 'BenchIQ', event: 'placement.ending_soon', status: 'completed', actionsCount: 2, tokensUsed: 980, durationMs: 1450, createdAt: '2026-03-27T07:00:00Z', summary: 'Tom Wilson assignment ending Apr 30 — found 4 redeployment opportunities' },
  { id: 'exec_005', agentName: 'ClientIQ', event: 'lead.stage_changed', status: 'completed', actionsCount: 1, tokensUsed: 756, durationMs: 1120, createdAt: '2026-03-27T11:00:00Z', summary: 'TechCorp moved to NEGOTIATION — scheduled follow-up and prepared pricing' },
  { id: 'exec_006', agentName: 'ClientIQ', event: 'invoice.overdue', status: 'completed', actionsCount: 2, tokensUsed: 890, durationMs: 1680, createdAt: '2026-03-26T16:00:00Z', summary: '⚠️ Churn risk: DataSync invoice $12,400 overdue 15 days — alerted team' },
];

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const executions = MOCK_EXECUTIONS.filter(e =>
    e.agentName.toLowerCase().replace(/\s/g, '-').replace('iq', '-iq') === id ||
    id === 'all'
  );

  return NextResponse.json({
    agentId: id,
    executions: id === 'all' ? MOCK_EXECUTIONS : executions,
    pendingActions: MOCK_EXECUTIONS.filter(e => e.status === 'pending_approval').length,
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();

  return NextResponse.json({
    agentId: params.id,
    updated: true,
    changes: body,
    message: `Agent ${params.id} configuration updated`,
  });
}
