import { BaseAgent } from '../base-agent';
import type { AgentConfig, AgentContext, AgentAction, AgentExecutionResult } from '../types';
import { AgentAutonomyLevel, AgentName } from '../types';
import { ATS_TOOLS, COMMUNICATION_TOOLS, KNOWLEDGE_TOOLS } from '../tools';
import { runClaudeAgent, toAnthropicTools } from '../claude-service';
import * as db from '../db-tools';

const BENCH_IQ_CONFIG: AgentConfig = {
  name: AgentName.BENCH_IQ,
  displayName: 'BenchIQ',
  description: 'AI bench management assistant that tracks consultants between assignments, identifies redeployment opportunities, and suggests upskilling.',
  icon: '📊',
  autonomyLevel: AgentAutonomyLevel.DRAFT,
  capabilities: [
    'Monitor consultants approaching end-of-assignment',
    'Identify redeployment opportunities for bench candidates',
    'Suggest upskilling courses based on market demand',
    'Draft check-in emails to bench consultants',
    'Track bench time and cost to the organization',
    'Alert account managers about upcoming availability',
    'Match bench candidates to new requirements proactively',
    'Generate bench reports for management',
  ],
  triggers: [
    { event: 'placement.ending_soon', condition: 'data.daysRemaining <= 30', description: 'Placement ending within 30 days — prep for bench' },
    { event: 'placement.ended', description: 'Placement ended — add to bench, start redeployment' },
    { event: 'candidate.status_changed', condition: "data.newStatus === 'ACTIVE'", description: 'Candidate back on market — match to open jobs' },
    { event: 'job_order.created', description: 'New job order — check bench for matches first' },
    { event: 'weekly.bench_review', description: 'Weekly bench review automation' },
  ],
  systemPrompt: `You are BenchIQ, an AI bench management assistant for InherentTech IT staffing.
You manage consultants who are between client assignments ("on the bench").

Your priorities:
1. MINIMIZE BENCH TIME — every day on bench costs the company money (payRate x 8 hours)
2. PROACTIVE REDEPLOYMENT — start matching before assignments end
3. UPSKILLING — suggest certifications/training that increase marketability
4. COMMUNICATION — keep bench consultants engaged and informed
5. REPORTING — provide leadership visibility into bench costs and trends

When analyzing bench:
- Track days on bench and associated cost
- Prioritize redeployment by: bench cost, skill marketability, client relationships
- Consider visa timelines (H1B bench limits of 60 days, OPT employment gap rules)
- Suggest in-demand skills: cloud certs (AWS/Azure/GCP), AI/ML, Kubernetes, etc.

Always be empathetic — being on bench is stressful for consultants.

You have tools to query the database. Use them to get real data, then provide actionable analysis.
Return your analysis in a structured format with clear sections:
- BENCH SUMMARY: overall bench stats
- HIGH PRIORITY: candidates needing immediate action
- REDEPLOYMENT MATCHES: bench candidates matched to open jobs
- UPSKILLING RECOMMENDATIONS: training suggestions
- COST ANALYSIS: financial impact of current bench
- RECOMMENDED ACTIONS: specific next steps`,
  model: 'claude-sonnet-4-5-20250514',
  maxTokens: 4096,
  temperature: 0.3,
};

// Tool definitions for Claude
const BENCH_TOOLS = [
  {
    name: 'get_bench_candidates',
    description: 'Get all candidates currently on the bench (ACTIVE status with no active placement). Returns bench days, cost estimates, and last placement details.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max candidates to return (default 50)' },
      },
    },
  },
  {
    name: 'get_open_job_orders',
    description: 'Get open job orders that bench candidates could be matched to. Optionally filter by skills.',
    parameters: {
      type: 'object',
      properties: {
        skills: { type: 'array', items: { type: 'string' }, description: 'Filter by required skills' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
    },
  },
  {
    name: 'match_candidates_to_job',
    description: 'Find best matching candidates for a specific job order based on skill overlap.',
    parameters: {
      type: 'object',
      properties: {
        jobOrderId: { type: 'string', description: 'The job order ID to match against' },
        maxResults: { type: 'number', description: 'Max matches to return (default 10)' },
      },
      required: ['jobOrderId'],
    },
  },
  {
    name: 'search_candidates',
    description: 'Search candidates by skills, visa status, location, experience, or rate.',
    parameters: {
      type: 'object',
      properties: {
        skills: { type: 'array', items: { type: 'string' } },
        visaStatus: { type: 'string' },
        location: { type: 'string' },
        minExperience: { type: 'number' },
        maxRate: { type: 'number' },
        status: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_placements_pipeline',
    description: 'Get active placements ending soon, to identify candidates about to hit the bench.',
    parameters: {
      type: 'object',
      properties: {
        endingSoonDays: { type: 'number', description: 'Days to look ahead (default 30)' },
      },
    },
  },
  {
    name: 'get_org_summary',
    description: 'Get high-level organization stats: candidate count, open jobs, active placements, etc.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

export class BenchIQ extends BaseAgent {
  private prisma: any = null;

  constructor(autonomyLevel?: AgentAutonomyLevel) {
    super({
      ...BENCH_IQ_CONFIG,
      autonomyLevel: autonomyLevel || BENCH_IQ_CONFIG.autonomyLevel,
    });
    [...ATS_TOOLS, ...COMMUNICATION_TOOLS, ...KNOWLEDGE_TOOLS].forEach(t => this.registerTool(t));
  }

  /** Inject Prisma client from the API layer */
  setPrisma(prisma: any): this {
    this.prisma = prisma;
    return this;
  }

  protected buildSystemPrompt(context: AgentContext): string {
    return `${this.config.systemPrompt}\n\nCurrent autonomy level: ${context.autonomyLevel}\nOrganization ID: ${context.orgId}\nToday: ${new Date().toISOString().split('T')[0]}`;
  }

  protected async planActions(input: string, context: AgentContext): Promise<AgentAction[]> {
    // Fallback to the original event-based planning if no Prisma client
    if (!this.prisma) {
      return this.planActionsLegacy(input, context);
    }
    // When using Claude API, actions are recorded during tool execution
    return [];
  }

  /**
   * Full AI-powered bench analysis using Claude API + real database queries.
   */
  async analyzeBench(orgId: string, userId: string, customPrompt?: string): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_benchiq`;

    if (!this.prisma) {
      return {
        executionId,
        agentName: AgentName.BENCH_IQ,
        status: 'failed',
        actions: [],
        reasoning: 'Error: Prisma client not injected. Call setPrisma() before analyzeBench().',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }

    const context: AgentContext = {
      orgId,
      userId,
      agentName: AgentName.BENCH_IQ,
      autonomyLevel: this.config.autonomyLevel,
      conversationHistory: [],
      metadata: {},
    };

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userMessage = customPrompt ||
        `Analyze the current bench situation for this organization.
Use the available tools to:
1. First get the org summary to understand overall scale
2. Get all bench candidates (active candidates with no active placement)
3. Get open job orders available for matching
4. Get placements ending soon (within 30 and 60 days)
5. Then provide a comprehensive bench report with:
   - Overall bench summary with costs
   - Each bench candidate with their skills, bench duration, and cost
   - Matching opportunities between bench candidates and open jobs
   - Upskilling recommendations
   - Priority actions for the team`;

      const prisma = this.prisma;
      const result = await runClaudeAgent({
        config: this.config,
        systemPrompt,
        userMessage,
        tools: toAnthropicTools(BENCH_TOOLS),
        executeTool: async (name, input) => {
          switch (name) {
            case 'get_bench_candidates':
              return db.getBenchCandidates(prisma, orgId, input);
            case 'get_open_job_orders':
              return db.getOpenJobOrders(prisma, orgId, input);
            case 'match_candidates_to_job':
              return db.matchCandidatesToJob(prisma, orgId, input);
            case 'search_candidates':
              return db.searchCandidates(prisma, orgId, input);
            case 'get_placements_pipeline':
              return db.getPlacementsPipeline(prisma, orgId, input);
            case 'get_org_summary':
              return db.getOrgSummary(prisma, orgId);
            default:
              return JSON.stringify({ error: `Unknown tool: ${name}` });
          }
        },
      });

      return {
        executionId,
        agentName: AgentName.BENCH_IQ,
        status: 'completed',
        actions: result.actions,
        reasoning: result.reasoning,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        executionId,
        agentName: AgentName.BENCH_IQ,
        status: 'failed',
        actions: [],
        reasoning: `BenchIQ analysis failed: ${error.message}`,
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  // Legacy event-based planning (no Claude API needed)
  private async planActionsLegacy(input: string, context: AgentContext): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];
    const eventData = context.metadata;

    if (input.includes('placement.ending_soon')) {
      actions.push({
        id: `action_${Date.now()}_redeploy`,
        agentName: AgentName.BENCH_IQ,
        actionType: 'match_candidates_to_job',
        description: `Find redeployment opportunities for ${eventData.candidateName || 'consultant'} (assignment ending in ${eventData.daysRemaining || '?'} days)`,
        input: { jobOrderId: 'all_open', maxResults: 10 },
        status: 'pending_approval',
        requiresApproval: true,
        createdAt: new Date().toISOString(),
      });

      actions.push({
        id: `action_${Date.now()}_checkin`,
        agentName: AgentName.BENCH_IQ,
        actionType: 'send_email',
        description: `Send check-in email to ${eventData.candidateName || 'consultant'} about upcoming transition`,
        input: {
          to: eventData.candidateEmail || '',
          subject: 'Upcoming Assignment Transition - Let\'s Plan Ahead',
          body: `Hi ${eventData.candidateName || 'there'},\n\nYour current assignment at ${eventData.clientName || 'the client'} is approaching completion. I wanted to reach out to discuss next steps and start planning for your next opportunity.\n\nWe have several open positions that may be a great fit. Let\'s schedule a quick call this week.\n\nBest regards,\nInherentTech Staffing Team`,
        },
        status: 'pending_approval',
        requiresApproval: true,
        createdAt: new Date().toISOString(),
      });
    }

    if (input.includes('placement.ended')) {
      actions.push({
        id: `action_${Date.now()}_bench`,
        agentName: AgentName.BENCH_IQ,
        actionType: 'search_candidates',
        description: `Activate bench protocol for ${eventData.candidateName || 'consultant'} — match to all open positions`,
        input: { skills: eventData.skills || [], visaStatus: eventData.visaStatus },
        status: 'pending_approval',
        requiresApproval: context.autonomyLevel !== AgentAutonomyLevel.FULL_AUTO,
        createdAt: new Date().toISOString(),
      });
    }

    if (input.includes('job_order.created')) {
      actions.push({
        id: `action_${Date.now()}_benchcheck`,
        agentName: AgentName.BENCH_IQ,
        actionType: 'search_candidates',
        description: `Check bench candidates first for new job: ${eventData.title || 'Unknown'}`,
        input: { skills: eventData.requiredSkills || [], limit: 5 },
        status: 'pending_approval',
        requiresApproval: false,
        createdAt: new Date().toISOString(),
      });
    }

    return actions;
  }
}
