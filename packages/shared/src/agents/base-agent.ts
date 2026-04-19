import type { AgentConfig, AgentContext, AgentTool, AgentMessage, AgentAction, AgentExecutionResult, AgentAutonomyLevel } from './types';
import { AgentAutonomyLevel as Level } from './types';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected tools: Map<string, AgentTool> = new Map();

  constructor(config: AgentConfig) {
    this.config = config;
  }

  get name() { return this.config.name; }
  get displayName() { return this.config.displayName; }
  get autonomyLevel() { return this.config.autonomyLevel; }

  registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  protected abstract buildSystemPrompt(context: AgentContext): string;
  protected abstract planActions(input: string, context: AgentContext): Promise<AgentAction[]>;

  async execute(input: string, context: AgentContext): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      // Build the full prompt
      const systemPrompt = this.buildSystemPrompt(context);

      // Plan actions based on input
      const actions = await this.planActions(input, context);

      // Filter actions based on autonomy level
      const processedActions = await this.processActions(actions, context);

      return {
        executionId,
        agentName: this.config.name,
        status: processedActions.some(a => a.status === 'pending_approval') ? 'pending_approval' : 'completed',
        actions: processedActions,
        reasoning: `${this.displayName} analyzed the input and planned ${actions.length} action(s).`,
        tokensUsed: 0, // Updated by actual API call
        durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        executionId,
        agentName: this.config.name,
        status: 'failed',
        actions: [],
        reasoning: `Error: ${error.message}`,
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  private async processActions(actions: AgentAction[], context: AgentContext): Promise<AgentAction[]> {
    const results: AgentAction[] = [];

    for (const action of actions) {
      switch (context.autonomyLevel) {
        case Level.SHADOW:
          // Shadow mode — just record suggestions, never execute
          results.push({ ...action, status: 'pending_approval', requiresApproval: true });
          break;

        case Level.DRAFT:
          // Draft mode — all actions need approval
          results.push({ ...action, status: 'pending_approval', requiresApproval: true });
          break;

        case Level.ASSISTED:
          // Assisted — routine actions auto-execute, exceptions need approval
          if (action.requiresApproval) {
            results.push({ ...action, status: 'pending_approval' });
          } else {
            const result = await this.executeAction(action, context);
            results.push(result);
          }
          break;

        case Level.FULL_AUTO:
          // Full auto — execute everything, log for review
          const result = await this.executeAction(action, context);
          results.push(result);
          break;
      }
    }

    return results;
  }

  private async executeAction(action: AgentAction, context: AgentContext): Promise<AgentAction> {
    const tool = this.tools.get(action.actionType);
    if (!tool) {
      return { ...action, status: 'failed', result: { error: `Tool not found: ${action.actionType}` } };
    }

    try {
      const result = await tool.execute(action.input, context);
      return {
        ...action,
        status: result.success ? 'executed' : 'failed',
        executedAt: new Date().toISOString(),
        result: result.data,
      };
    } catch (error: any) {
      return { ...action, status: 'failed', result: { error: error.message } };
    }
  }

  // Check if an event should trigger this agent
  shouldTriggerOn(event: string, data: Record<string, any>): boolean {
    return this.config.triggers.some(t => {
      if (t.event !== event) return false;
      if (t.condition) {
        try {
          const fn = new Function('data', `return ${t.condition}`);
          return fn(data);
        } catch { return false; }
      }
      return true;
    });
  }

  getCapabilities(): string[] { return this.config.capabilities; }
  getConfig(): AgentConfig { return { ...this.config }; }
}
