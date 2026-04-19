/**
 * Agent Event Hooks (CRM)
 *
 * Call these from API routes to trigger AI agents on data changes.
 * The hooks check which agents are interested in the event and dispatch.
 *
 * Events are sent to:
 * 1. Platform agent orchestrator (/api/agents)
 * 2. n8n webhook for corresponding workflow
 */

const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:3000/api/agents';
const N8N_WEBHOOK_BASE = process.env.N8N_BASE_URL || 'http://localhost:5678';

export interface AgentEvent {
  type: string;
  data: Record<string, any>;
  orgId: string;
  userId: string;
  timestamp: string;
}

/**
 * Fire-and-forget event dispatch to agent system
 * Non-blocking: failures don't interrupt main operation
 */
export async function dispatchAgentEvent(event: AgentEvent): Promise<void> {
  try {
    // 1. Notify the platform agent orchestrator
    await fetch(AGENT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-org-id': event.orgId },
      body: JSON.stringify({
        event: event.type,
        input: JSON.stringify(event.data),
        agentId: 'all',
        timestamp: event.timestamp,
      }),
    }).catch(() => {}); // Non-blocking

    // 2. Trigger corresponding n8n workflow if exists
    const webhookMap: Record<string, string> = {
      'lead.created': 'new-lead-slack-alert',
      'lead.stage_changed': 'lead-scoring',
      'lead.nurture_started': 'lead-nurture-sequence',
    };

    const webhookPath = webhookMap[event.type];
    if (webhookPath) {
      await fetch(`${N8N_WEBHOOK_BASE}/webhook/${webhookPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(() => {}); // Non-blocking
    }
  } catch {
    // Agent dispatch is non-critical — never block the main operation
    // Log to console for debugging if needed
    console.warn(`Failed to dispatch agent event: ${event.type}`);
  }
}

/**
 * Convenience helpers for common CRM events
 * Each function creates an AgentEvent and dispatches it
 */
export const agentEvents = {
  /**
   * Triggered when a new lead is created
   */
  leadCreated: (
    leadData: {
      id: string;
      companyName: string;
      contactName: string | null;
      contactEmail: string | null;
      contactPhone?: string | null;
      source?: string | null;
      value?: unknown;
    },
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'lead.created',
      data: leadData,
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a lead moves to a new stage
   */
  leadStageChanged: (
    leadId: string,
    previousStage: string,
    newStage: string,
    leadData: Record<string, any>,
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'lead.stage_changed',
      data: {
        leadId,
        previousStage,
        newStage,
        companyName: leadData.companyName,
        contactName: leadData.contactName,
        contactEmail: leadData.contactEmail,
      },
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered to start lead nurture sequence
   */
  startLeadNurture: (
    leadData: {
      id: string;
      companyName: string;
      contactName: string | null;
      contactEmail: string | null;
      tier?: string;
    },
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'lead.nurture_started',
      data: leadData,
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a lead is scored by system
   */
  leadScored: (
    leadId: string,
    score: number,
    tier: string,
    companyName: string,
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'lead.scored',
      data: { leadId, score, tier, companyName },
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a lead is converted to a job order
   */
  leadConverted: (
    leadId: string,
    jobOrderId: string,
    companyName: string,
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'lead.converted',
      data: { leadId, jobOrderId, companyName },
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a lead is marked as lost
   */
  leadLost: (
    leadId: string,
    reason: string,
    companyName: string,
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'lead.lost',
      data: { leadId, reason, companyName },
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when an activity is logged on a lead
   */
  activityLogged: (
    leadId: string,
    activityType: string,
    summary: string,
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'lead.activity_logged',
      data: { leadId, activityType, summary },
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a lead is assigned to a team member
   */
  leadAssigned: (
    leadId: string,
    assignedToId: string,
    assignedToName: string,
    companyName: string,
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'lead.assigned',
      data: { leadId, assignedToId, assignedToName, companyName },
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),
};

/**
 * Export event types for reference
 */
export const LEAD_EVENTS = {
  CREATED: 'lead.created',
  STAGE_CHANGED: 'lead.stage_changed',
  NURTURE_STARTED: 'lead.nurture_started',
  SCORED: 'lead.scored',
  CONVERTED: 'lead.converted',
  LOST: 'lead.lost',
  ACTIVITY_LOGGED: 'lead.activity_logged',
  ASSIGNED: 'lead.assigned',
} as const;
