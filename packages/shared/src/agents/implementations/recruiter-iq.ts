import { BaseAgent } from '../base-agent';
import type { AgentConfig, AgentContext, AgentAction, AgentExecutionResult } from '../types';
import { AgentAutonomyLevel, AgentName } from '../types';
import { ATS_TOOLS, COMMUNICATION_TOOLS, KNOWLEDGE_TOOLS } from '../tools';
import { runClaudeAgent, toAnthropicTools } from '../claude-service';
import * as db from '../db-tools';

const RECRUITER_IQ_CONFIG: AgentConfig = {
  name: AgentName.RECRUITER_IQ,
  displayName: 'RecruiterIQ',
  description: 'AI recruiting assistant that sources candidates, matches them to job orders, parses resumes, and automates outreach.',
  icon: '🎯',
  autonomyLevel: AgentAutonomyLevel.DRAFT,
  capabilities: [
    'Parse and analyze resumes (PDF, DOCX, TXT)',
    'Match candidates to job orders by skills, experience, visa, and rate',
    'Score candidate-job fit with detailed reasoning',
    'Draft personalized outreach emails to candidates',
    'Auto-create submissions for high-confidence matches',
    'Monitor new job orders and suggest candidate matches',
    'Track candidate availability and follow up on bench candidates',
    'Identify skill gaps and suggest upskilling paths',
  ],
  triggers: [
    { event: 'job_order.created', description: 'New job order — find matching candidates' },
    { event: 'candidate.created', description: 'New candidate — match to open jobs' },
    { event: 'candidate.resume_parsed', description: 'Resume parsed — score and categorize' },
    { event: 'submission.rejected', description: 'Submission rejected — find alternative candidates' },
    { event: 'placement.ending_soon', description: 'Placement ending — prep for redeployment' },
  ],
  systemPrompt: `You are RecruiterIQ, an AI recruiting assistant for InherentTech IT staffing.
Your goal is to match the best candidates to job orders efficiently.

You specialize in:
- IT staffing (Java, Python, React, DevOps, Cloud, Data Engineering, QA, etc.)
- Understanding visa requirements (H1B, OPT, CPT, Green Card, US Citizen, TN, L1)
- Bill rate / pay rate / margin optimization (target 30-40% margin)
- Candidate experience and skills assessment
- Personalized outreach that gets responses

When matching candidates to jobs, score on these factors:
1. Skills Match (40% weight): required vs nice-to-have skills overlap
2. Experience Level (20%): years of experience vs job requirement
3. Visa Eligibility (15%): candidate visa works for the role location/client
4. Rate Compatibility (15%): candidate expected rate vs job budget (bill rate - margin)
5. Location Fit (10%): remote/onsite/hybrid compatibility

Confidence Score (0-100):
- 90-100: Strong match, auto-submit worthy
- 70-89: Good match, review recommended
- 50-69: Partial match, some gaps
- Below 50: Weak match, significant gaps

When generating outreach messages:
- Personalize to the candidate's skills and experience
- Mention specific technologies that match
- Include key job details (title, client type, location, rate range)
- Keep it concise and professional

Return analysis in structured sections:
- OVERVIEW: summary of what was analyzed
- TOP MATCHES: ranked candidate-job matches with scores
- SKILL GAP ANALYSIS: what's missing and how to fill it
- MARKET INSIGHTS: rate trends, in-demand skills
- RECOMMENDED ACTIONS: next steps for the recruiting team`,
  model: 'claude-sonnet-4-5-20250514',
  maxTokens: 4096,
  temperature: 0.3,
};

const RECRUITER_TOOLS = [
  {
    name: 'search_candidates',
    description: 'Search candidates by skills, visa status, location, experience, rate, or status.',
    parameters: {
      type: 'object',
      properties: {
        skills: { type: 'array', items: { type: 'string' }, description: 'Skills to search for' },
        visaStatus: { type: 'string', description: 'Filter by visa type' },
        location: { type: 'string', description: 'Filter by location' },
        minExperience: { type: 'number', description: 'Minimum years of experience' },
        maxRate: { type: 'number', description: 'Maximum hourly rate' },
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'PLACED', 'BLACKLISTED'] },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
    },
  },
  {
    name: 'get_open_job_orders',
    description: 'Get all open job orders. Filter by required skills if needed.',
    parameters: {
      type: 'object',
      properties: {
        skills: { type: 'array', items: { type: 'string' } },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'match_candidates_to_job',
    description: 'Find best matching candidates for a specific job order based on skill overlap scoring.',
    parameters: {
      type: 'object',
      properties: {
        jobOrderId: { type: 'string', description: 'Job order ID to match candidates against' },
        maxResults: { type: 'number', description: 'Max matches to return' },
      },
      required: ['jobOrderId'],
    },
  },
  {
    name: 'get_bench_candidates',
    description: 'Get candidates currently on the bench (available for placement). Includes bench duration and cost data.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_recruiter_metrics',
    description: 'Get recruiter performance metrics: submissions, placements, conversion rate, margins.',
    parameters: {
      type: 'object',
      properties: {
        recruiterId: { type: 'string', description: 'Specific recruiter ID (omit for all recruiters)' },
        periodDays: { type: 'number', description: 'Lookback period in days (default 30)' },
      },
    },
  },
  {
    name: 'get_placements_pipeline',
    description: 'Get active placements and those ending soon.',
    parameters: {
      type: 'object',
      properties: {
        endingSoonDays: { type: 'number' },
      },
    },
  },
  {
    name: 'get_org_summary',
    description: 'Get high-level organization stats for context.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

export class RecruiterIQ extends BaseAgent {
  private prisma: any = null;

  constructor(autonomyLevel?: AgentAutonomyLevel) {
    super({
      ...RECRUITER_IQ_CONFIG,
      autonomyLevel: autonomyLevel || RECRUITER_IQ_CONFIG.autonomyLevel,
    });
    [...ATS_TOOLS, ...COMMUNICATION_TOOLS, ...KNOWLEDGE_TOOLS].forEach(t => this.registerTool(t));
  }

  /** Inject Prisma client from the API layer */
  setPrisma(prisma: any): this {
    this.prisma = prisma;
    return this;
  }

  protected buildSystemPrompt(context: AgentContext): string {
    return `${this.config.systemPrompt}

Current autonomy level: ${context.autonomyLevel}
Organization ID: ${context.orgId}
Today: ${new Date().toISOString().split('T')[0]}
${context.autonomyLevel === 'SHADOW' ? '\nSHADOW MODE: Only observe and suggest. Do NOT take any actions.' : ''}
${context.autonomyLevel === 'DRAFT' ? '\nDRAFT MODE: Plan actions but mark ALL as requiring human approval.' : ''}`;
  }

  protected async planActions(input: string, context: AgentContext): Promise<AgentAction[]> {
    if (!this.prisma) {
      return this.planActionsLegacy(input, context);
    }
    return [];
  }

  /**
   * Full AI-powered recruitment analysis using Claude API + real database queries.
   */
  async analyzeRecruitment(orgId: string, userId: string, customPrompt?: string): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_recruiteriq`;

    if (!this.prisma) {
      return {
        executionId,
        agentName: AgentName.RECRUITER_IQ,
        status: 'failed',
        actions: [],
        reasoning: 'Error: Prisma client not injected. Call setPrisma() before analyzeRecruitment().',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }

    const context: AgentContext = {
      orgId,
      userId,
      agentName: AgentName.RECRUITER_IQ,
      autonomyLevel: this.config.autonomyLevel,
      conversationHistory: [],
      metadata: {},
    };

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userMessage = customPrompt ||
        `Perform a comprehensive recruitment intelligence analysis.
Use the available tools to:
1. Get the org summary for overall context
2. Get all open job orders to understand current demand
3. Search for active candidates to understand supply
4. Get bench candidates (available for immediate placement)
5. Get recruiter performance metrics for the last 30 days
6. Get placements pipeline to see what's ending soon
7. For the highest-priority open jobs, find matching candidates

Then provide a full recruitment intelligence report with:
- Market overview: supply vs demand for key skills
- Top priority job orders and best candidate matches (with match scores)
- Recruiter performance rankings and coaching suggestions
- Pipeline forecast (placements ending, bench candidates available)
- Rate intelligence: average bill rates, pay rates, margins by skill area
- Specific recommended actions for the recruiting team`;

      const prisma = this.prisma;
      const result = await runClaudeAgent({
        config: this.config,
        systemPrompt,
        userMessage,
        tools: toAnthropicTools(RECRUITER_TOOLS),
        executeTool: async (name, input) => {
          switch (name) {
            case 'search_candidates':
              return db.searchCandidates(prisma, orgId, input);
            case 'get_open_job_orders':
              return db.getOpenJobOrders(prisma, orgId, input);
            case 'match_candidates_to_job':
              return db.matchCandidatesToJob(prisma, orgId, input);
            case 'get_bench_candidates':
              return db.getBenchCandidates(prisma, orgId, input);
            case 'get_recruiter_metrics':
              return db.getRecruiterMetrics(prisma, orgId, input);
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
        agentName: AgentName.RECRUITER_IQ,
        status: 'completed',
        actions: result.actions,
        reasoning: result.reasoning,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        executionId,
        agentName: AgentName.RECRUITER_IQ,
        status: 'failed',
        actions: [],
        reasoning: `RecruiterIQ analysis failed: ${error.message}`,
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Match candidates to a specific job order using AI analysis.
   */
  async matchForJob(orgId: string, userId: string, jobOrderId: string): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_recruiteriq_match`;

    if (!this.prisma) {
      return {
        executionId,
        agentName: AgentName.RECRUITER_IQ,
        status: 'failed',
        actions: [],
        reasoning: 'Error: Prisma client not injected.',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }

    const context: AgentContext = {
      orgId,
      userId,
      agentName: AgentName.RECRUITER_IQ,
      autonomyLevel: this.config.autonomyLevel,
      conversationHistory: [],
      metadata: { jobOrderId },
    };

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userMessage = `Find the best candidates for job order "${jobOrderId}".
Use the tools to:
1. Match candidates to this specific job order
2. Also check bench candidates for immediate availability
3. For each match, provide:
   - Confidence score (0-100) with breakdown
   - Matching skills and missing skills
   - Rate compatibility assessment
   - Visa eligibility check
   - Draft outreach message for top 3 candidates
4. Rank candidates from best to worst match`;

      const prisma = this.prisma;
      const result = await runClaudeAgent({
        config: this.config,
        systemPrompt,
        userMessage,
        tools: toAnthropicTools(RECRUITER_TOOLS),
        executeTool: async (name, input) => {
          switch (name) {
            case 'search_candidates':
              return db.searchCandidates(prisma, orgId, input);
            case 'get_open_job_orders':
              return db.getOpenJobOrders(prisma, orgId, input);
            case 'match_candidates_to_job':
              return db.matchCandidatesToJob(prisma, orgId, input);
            case 'get_bench_candidates':
              return db.getBenchCandidates(prisma, orgId, input);
            case 'get_recruiter_metrics':
              return db.getRecruiterMetrics(prisma, orgId, input);
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
        agentName: AgentName.RECRUITER_IQ,
        status: 'completed',
        actions: result.actions,
        reasoning: result.reasoning,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        executionId,
        agentName: AgentName.RECRUITER_IQ,
        status: 'failed',
        actions: [],
        reasoning: `RecruiterIQ matching failed: ${error.message}`,
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  // Legacy event-based planning
  private async planActionsLegacy(input: string, context: AgentContext): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];
    const eventData = context.metadata;

    if (input.includes('job_order.created') || input.includes('new job order')) {
      actions.push({
        id: `action_${Date.now()}_match`,
        agentName: AgentName.RECRUITER_IQ,
        actionType: 'match_candidates_to_job',
        description: `Find matching candidates for job: ${eventData.title || 'Unknown'}`,
        input: { jobOrderId: eventData.id, maxResults: 15 },
        status: 'pending_approval',
        requiresApproval: context.autonomyLevel !== AgentAutonomyLevel.FULL_AUTO,
        createdAt: new Date().toISOString(),
      });
    }

    if (input.includes('candidate.created') || input.includes('new candidate')) {
      actions.push({
        id: `action_${Date.now()}_search`,
        agentName: AgentName.RECRUITER_IQ,
        actionType: 'search_candidates',
        description: `Analyze new candidate: ${eventData.firstName || ''} ${eventData.lastName || ''} and match to open positions`,
        input: { skills: eventData.skills || [], visaStatus: eventData.visaStatus },
        status: 'pending_approval',
        requiresApproval: true,
        createdAt: new Date().toISOString(),
      });
    }

    if (input.includes('resume_parsed')) {
      actions.push({
        id: `action_${Date.now()}_score`,
        agentName: AgentName.RECRUITER_IQ,
        actionType: 'search_candidates',
        description: `Score parsed resume and find matching jobs for candidate`,
        input: { skills: eventData.skills || [], minExperience: eventData.experience },
        status: 'pending_approval',
        requiresApproval: context.autonomyLevel !== AgentAutonomyLevel.FULL_AUTO,
        createdAt: new Date().toISOString(),
      });
    }

    if (input.includes('submission.rejected')) {
      actions.push({
        id: `action_${Date.now()}_alt`,
        agentName: AgentName.RECRUITER_IQ,
        actionType: 'match_candidates_to_job',
        description: `Find alternative candidates after rejection for job: ${eventData.jobTitle || 'Unknown'}`,
        input: { jobOrderId: eventData.jobOrderId, maxResults: 10 },
        status: 'pending_approval',
        requiresApproval: true,
        createdAt: new Date().toISOString(),
      });
    }

    return actions;
  }
}
