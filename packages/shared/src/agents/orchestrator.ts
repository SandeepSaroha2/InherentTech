import type { AgentContext, AgentExecutionResult, AgentAction } from './types';
import { BaseAgent } from './base-agent';

export interface OrchestratorEvent {
  type: string;        // 'candidate.created', 'lead.stage_changed', etc.
  data: Record<string, any>;
  orgId: string;
  userId: string;
  timestamp: string;
}

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private pendingActions: Map<string, AgentAction> = new Map();
  private executionLog: AgentExecutionResult[] = [];

  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.name, agent);
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  // Route an event to all agents that care about it
  async dispatchEvent(event: OrchestratorEvent): Promise<AgentExecutionResult[]> {
    const results: AgentExecutionResult[] = [];

    for (const agent of Array.from(this.agents.values())) {
      if (agent.shouldTriggerOn(event.type, event.data)) {
        const context: AgentContext = {
          orgId: event.orgId,
          userId: event.userId,
          agentName: agent.name as any,
          autonomyLevel: agent.autonomyLevel,
          conversationHistory: [],
          metadata: event.data,
        };

        const result = await agent.execute(
          `Event: ${event.type}\nData: ${JSON.stringify(event.data)}`,
          context
        );

        // Track pending approvals
        for (const action of result.actions) {
          if (action.status === 'pending_approval') {
            this.pendingActions.set(action.id, action);
          }
        }

        this.executionLog.push(result);
        results.push(result);
      }
    }

    return results;
  }

  // Direct execution of a specific agent
  async runAgent(agentName: string, input: string, context: AgentContext): Promise<AgentExecutionResult> {
    const agent = this.agents.get(agentName);
    if (!agent) throw new Error(`Agent not found: ${agentName}`);

    const result = await agent.execute(input, context);
    this.executionLog.push(result);

    for (const action of result.actions) {
      if (action.status === 'pending_approval') {
        this.pendingActions.set(action.id, action);
      }
    }

    return result;
  }

  // Approve or reject a pending action
  async resolveAction(actionId: string, approved: boolean): Promise<AgentAction | null> {
    const action = this.pendingActions.get(actionId);
    if (!action) return null;

    if (approved) {
      action.status = 'approved';
      // In real implementation, execute the action here
    } else {
      action.status = 'rejected';
    }

    this.pendingActions.delete(actionId);
    return action;
  }

  getPendingActions(): AgentAction[] {
    return Array.from(this.pendingActions.values());
  }

  getExecutionLog(limit = 50): AgentExecutionResult[] {
    return this.executionLog.slice(-limit);
  }

  getStats() {
    const total = this.executionLog.length;
    const completed = this.executionLog.filter(e => e.status === 'completed').length;
    const failed = this.executionLog.filter(e => e.status === 'failed').length;
    const pending = this.pendingActions.size;
    const totalTokens = this.executionLog.reduce((s, e) => s + e.tokensUsed, 0);

    return { total, completed, failed, pending, totalTokens, agents: this.agents.size };
  }
}
