import { BaseAgent } from '../base-agent';
import type { AgentConfig, AgentContext, AgentAction, AgentExecutionResult } from '../types';
import { AgentAutonomyLevel, AgentName } from '../types';
import { CRM_TOOLS, COMMUNICATION_TOOLS, KNOWLEDGE_TOOLS } from '../tools';
import { runClaudeAgent, toAnthropicTools } from '../claude-service';
import * as db from '../db-tools';

const CLIENT_IQ_CONFIG: AgentConfig = {
  name: AgentName.CLIENT_IQ,
  displayName: 'ClientIQ',
  description: 'AI client intelligence assistant that scores relationships, detects upsell/cross-sell opportunities, monitors satisfaction signals, and automates client engagement.',
  icon: '🏢',
  autonomyLevel: AgentAutonomyLevel.DRAFT,
  capabilities: [
    'Score client relationships based on engagement, revenue, and tenure',
    'Detect upsell opportunities (client growing, new projects, budget cycle)',
    'Monitor satisfaction signals from communication patterns',
    'Draft client check-in and business review emails',
    'Alert on churn risk (decreased engagement, late payments, complaints)',
    'Generate client intelligence briefs before meetings',
    'Track competitive threats (mentions of other staffing firms)',
    'Suggest optimal outreach timing based on engagement history',
  ],
  triggers: [
    { event: 'lead.stage_changed', description: 'Lead stage change — evaluate progression strategy' },
    { event: 'placement.created', description: 'New placement — client deepened relationship' },
    { event: 'invoice.overdue', description: 'Overdue invoice — potential satisfaction issue' },
    { event: 'activity.created', condition: "data.type === 'MEETING'", description: 'Client meeting logged — generate follow-up actions' },
    { event: 'weekly.client_review', description: 'Weekly client health review' },
    { event: 'lead.created', description: 'New lead — enrich and score' },
  ],
  systemPrompt: `You are ClientIQ, an AI client intelligence assistant for InherentTech IT staffing.
You help account managers build stronger client relationships and grow revenue.

Your priorities:
1. CLIENT RETENTION — happy clients renew and expand
2. REVENUE GROWTH — identify upsell/cross-sell opportunities
3. PROACTIVE ENGAGEMENT — don't wait for clients to reach out
4. RISK DETECTION — spot churn signals early
5. COMPETITIVE INTELLIGENCE — know when competitors are circling

When analyzing a client, compute these scores (0-100):
- Engagement Score: based on activity frequency (calls, meetings, emails in last 90 days)
- Revenue Score: based on total paid invoices (higher = better)
- Payment Score: based on invoice payment timeliness (overdue = penalty)
- Health Score: weighted average of the three

Health Status thresholds:
- ACTIVE: health >= 60
- AT-RISK: health 30-59
- CHURNED: health < 30

Upsell Signals to look for:
- Client has open job orders (growing team)
- High health score with only 1-2 placements (room to grow)
- Recent stage upgrades (PROPOSAL, NEGOTIATION, WON)
- Frequent meetings (engaged relationship)

Risk Signals to flag:
- No activity in 30+ days
- Overdue invoices
- Stage = LOST or no recent job orders
- Declining placement count

Always provide actionable recommendations with specific next steps.
Return analysis in structured sections:
- CLIENT PROFILE: key facts
- HEALTH ASSESSMENT: scores and status
- REVENUE ANALYSIS: placement/invoice data
- UPSELL OPPORTUNITIES: specific suggestions
- RISK FACTORS: things to watch
- RECOMMENDED ACTIONS: prioritized next steps`,
  model: 'claude-sonnet-4-5-20250514',
  maxTokens: 4096,
  temperature: 0.4,
};

const CLIENT_TOOLS = [
  {
    name: 'get_client_profile',
    description: 'Get detailed client profile including health score, revenue, placements, activities, and job orders. This is the primary analysis tool.',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The client/lead ID to analyze' },
      },
      required: ['clientId'],
    },
  },
  {
    name: 'search_leads',
    description: 'Search CRM leads/clients by company name, contact name, or stage.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search by company or contact name' },
        stage: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_open_job_orders',
    description: 'Get open job orders, optionally filtered by skills. Useful for understanding client demand.',
    parameters: {
      type: 'object',
      properties: {
        skills: { type: 'array', items: { type: 'string' } },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_org_summary',
    description: 'Get high-level org stats: total candidates, open jobs, active placements, lead count.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_recruiter_metrics',
    description: 'Get recruiter performance metrics for understanding team capacity to serve this client.',
    parameters: {
      type: 'object',
      properties: {
        periodDays: { type: 'number', description: 'Lookback period in days (default 30)' },
      },
    },
  },
];

export class ClientIQ extends BaseAgent {
  private prisma: any = null;

  constructor(autonomyLevel?: AgentAutonomyLevel) {
    super({
      ...CLIENT_IQ_CONFIG,
      autonomyLevel: autonomyLevel || CLIENT_IQ_CONFIG.autonomyLevel,
    });
    [...CRM_TOOLS, ...COMMUNICATION_TOOLS, ...KNOWLEDGE_TOOLS].forEach(t => this.registerTool(t));
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
    if (!this.prisma) {
      return this.planActionsLegacy(input, context);
    }
    return [];
  }

  /**
   * Full AI-powered client analysis using Claude API + real database queries.
   */
  async analyzeClient(orgId: string, userId: string, clientId: string, customPrompt?: string): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_clientiq`;

    if (!this.prisma) {
      return {
        executionId,
        agentName: AgentName.CLIENT_IQ,
        status: 'failed',
        actions: [],
        reasoning: 'Error: Prisma client not injected. Call setPrisma() before analyzeClient().',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }

    const context: AgentContext = {
      orgId,
      userId,
      agentName: AgentName.CLIENT_IQ,
      autonomyLevel: this.config.autonomyLevel,
      conversationHistory: [],
      metadata: { clientId },
    };

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userMessage = customPrompt ||
        `Analyze the client with ID "${clientId}".
Use the available tools to:
1. Get the detailed client profile (health scores, revenue, placements, activities)
2. Check their open job orders to understand current demand
3. Get org summary for context on overall operations
4. Then provide a comprehensive client intelligence report with:
   - Health assessment with specific scores
   - Revenue analysis and trends
   - Upsell or expansion opportunities
   - Risk factors and mitigation strategies
   - Specific recommended actions for the account manager`;

      const prisma = this.prisma;
      const result = await runClaudeAgent({
        config: this.config,
        systemPrompt,
        userMessage,
        tools: toAnthropicTools(CLIENT_TOOLS),
        executeTool: async (name, input) => {
          switch (name) {
            case 'get_client_profile':
              return db.getClientProfile(prisma, orgId, input);
            case 'search_leads':
              return db.searchLeads(prisma, orgId, input);
            case 'get_open_job_orders':
              return db.getOpenJobOrders(prisma, orgId, input);
            case 'get_org_summary':
              return db.getOrgSummary(prisma, orgId);
            case 'get_recruiter_metrics':
              return db.getRecruiterMetrics(prisma, orgId, input);
            default:
              return JSON.stringify({ error: `Unknown tool: ${name}` });
          }
        },
      });

      return {
        executionId,
        agentName: AgentName.CLIENT_IQ,
        status: 'completed',
        actions: result.actions,
        reasoning: result.reasoning,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        executionId,
        agentName: AgentName.CLIENT_IQ,
        status: 'failed',
        actions: [],
        reasoning: `ClientIQ analysis failed: ${error.message}`,
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Analyze all clients and rank by health/risk — for the weekly review trigger.
   */
  async analyzeAllClients(orgId: string, userId: string): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_clientiq_all`;

    if (!this.prisma) {
      return {
        executionId,
        agentName: AgentName.CLIENT_IQ,
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
      agentName: AgentName.CLIENT_IQ,
      autonomyLevel: this.config.autonomyLevel,
      conversationHistory: [],
      metadata: {},
    };

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userMessage = `Perform a comprehensive client portfolio review.
Use the tools to:
1. Search all leads/clients to get the full list
2. Get the org summary for context
3. Analyze the portfolio and provide:
   - Clients ranked by health score (healthiest to most at-risk)
   - At-risk clients that need immediate attention
   - Upsell opportunities across the portfolio
   - Overall portfolio health summary
   - Top 5 recommended actions for this week`;

      const prisma = this.prisma;
      const result = await runClaudeAgent({
        config: this.config,
        systemPrompt,
        userMessage,
        tools: toAnthropicTools(CLIENT_TOOLS),
        executeTool: async (name, input) => {
          switch (name) {
            case 'get_client_profile':
              return db.getClientProfile(prisma, orgId, input);
            case 'search_leads':
              return db.searchLeads(prisma, orgId, input);
            case 'get_open_job_orders':
              return db.getOpenJobOrders(prisma, orgId, input);
            case 'get_org_summary':
              return db.getOrgSummary(prisma, orgId);
            case 'get_recruiter_metrics':
              return db.getRecruiterMetrics(prisma, orgId, input);
            default:
              return JSON.stringify({ error: `Unknown tool: ${name}` });
          }
        },
      });

      return {
        executionId,
        agentName: AgentName.CLIENT_IQ,
        status: 'completed',
        actions: result.actions,
        reasoning: result.reasoning,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        executionId,
        agentName: AgentName.CLIENT_IQ,
        status: 'failed',
        actions: [],
        reasoning: `ClientIQ portfolio review failed: ${error.message}`,
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  // Legacy event-based planning (no Claude API needed)
  private async planActionsLegacy(input: string, context: AgentContext): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];
    const eventData = context.metadata;

    if (input.includes('lead.stage_changed')) {
      actions.push({
        id: `action_${Date.now()}_strategy`,
        agentName: AgentName.CLIENT_IQ,
        actionType: 'search_leads',
        description: `Analyze lead ${eventData.companyName || 'Unknown'} stage change: ${eventData.previousStage} → ${eventData.newStage}`,
        input: { query: eventData.companyName, limit: 1 },
        status: 'pending_approval',
        requiresApproval: true,
        createdAt: new Date().toISOString(),
      });

      if (['PROPOSAL', 'NEGOTIATION'].includes(eventData.newStage)) {
        actions.push({
          id: `action_${Date.now()}_engage`,
          agentName: AgentName.CLIENT_IQ,
          actionType: 'create_activity',
          description: `Schedule follow-up for ${eventData.companyName} — now in ${eventData.newStage}`,
          input: {
            leadId: eventData.leadId,
            type: 'TASK',
            description: `Follow up on ${eventData.newStage.toLowerCase()} with ${eventData.companyName}. Prepare pricing and team availability.`,
          },
          status: 'pending_approval',
          requiresApproval: true,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (input.includes('invoice.overdue')) {
      actions.push({
        id: `action_${Date.now()}_risk`,
        agentName: AgentName.CLIENT_IQ,
        actionType: 'create_activity',
        description: `Churn risk alert: ${eventData.clientName || 'Client'} has overdue invoice ($${eventData.amount || '?'})`,
        input: {
          leadId: eventData.leadId || eventData.clientId,
          type: 'NOTE',
          description: `CHURN RISK: Invoice #${eventData.invoiceNumber || '?'} overdue by ${eventData.daysOverdue || '?'} days. Amount: $${eventData.amount || '?'}. Recommend immediate outreach to accounts payable contact.`,
        },
        status: 'pending_approval',
        requiresApproval: false,
        createdAt: new Date().toISOString(),
      });

      actions.push({
        id: `action_${Date.now()}_slack`,
        agentName: AgentName.CLIENT_IQ,
        actionType: 'send_slack_message',
        description: `Alert team about overdue invoice from ${eventData.clientName}`,
        input: {
          channel: '#accounts-receivable',
          message: `*Overdue Invoice Alert*\nClient: ${eventData.clientName}\nInvoice: #${eventData.invoiceNumber}\nAmount: $${eventData.amount}\nDays Overdue: ${eventData.daysOverdue}`,
        },
        status: 'pending_approval',
        requiresApproval: context.autonomyLevel === AgentAutonomyLevel.SHADOW || context.autonomyLevel === AgentAutonomyLevel.DRAFT,
        createdAt: new Date().toISOString(),
      });
    }

    if (input.includes('lead.created')) {
      actions.push({
        id: `action_${Date.now()}_enrich`,
        agentName: AgentName.CLIENT_IQ,
        actionType: 'search_knowledge_base',
        description: `Enrich new lead: ${eventData.companyName || 'Unknown'} — search for existing intel`,
        input: { query: eventData.companyName || eventData.contactEmail || '' },
        status: 'pending_approval',
        requiresApproval: false,
        createdAt: new Date().toISOString(),
      });
    }

    return actions;
  }
}
