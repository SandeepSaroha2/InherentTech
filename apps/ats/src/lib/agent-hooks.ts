/**
 * Agent Event Hooks (ATS)
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
      'candidate.created': 'candidate-job-matcher',
      'candidate.resume_parsed': 'resume-parser',
      'job_order.created': 'candidate-job-matcher',
      'submission.status_changed': 'submission-status-notify',
      'interview.scheduled': 'interview-scheduler',
      'placement.created': 'placement-onboarding',
      'placement.ending_soon': 'follow-up-reminder',
      'timesheet.submitted': 'weekly-timesheet-reminder',
      'timesheet.approved': 'invoice-generator',
      'invoice.created': 'invoice-generator',
      'invoice.overdue': 'follow-up-reminder',
      'document.signature_requested': 'signature-reminder',
      'document.expiring': 'document-expiry-alert',
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
 * Convenience helpers for common ATS events
 * Each function creates an AgentEvent and dispatches it
 */
export const agentEvents = {
  /**
   * Triggered when a new candidate is created
   */
  candidateCreated: (
    candidateData: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      currentTitle?: string;
      currentCompany?: string;
      skills?: string[];
      yearsOfExperience?: number;
    },
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'candidate.created',
      data: candidateData,
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a resume is parsed
   */
  resumeParsed: (
    candidateId: string,
    parsedData: {
      firstName: string;
      lastName: string;
      skills: string[];
      yearsOfExperience?: number;
      currentTitle?: string;
      currentCompany?: string;
      education?: any[];
      workHistory?: any[];
      confidence: string;
    },
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'candidate.resume_parsed',
      data: { candidateId, ...parsedData },
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a new job order is created
   */
  jobOrderCreated: (
    jobData: {
      id: string;
      clientId: string;
      title: string;
      description: string | null;
      requirements: string[];
      location: string | null;
      rateRange?: unknown;
      openings: number;
      priority: string;
    },
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'job_order.created',
      data: jobData,
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when submission status changes
   */
  submissionStatusChanged: (
    submissionId: string,
    newStatus: string,
    previousStatus: string,
    submissionData: {
      candidateId: string;
      candidateName: string;
      candidateEmail: string;
      jobOrderId: string;
      jobTitle: string;
      companyName: string;
    },
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'submission.status_changed',
      data: {
        submissionId,
        newStatus,
        previousStatus,
        ...submissionData,
      },
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when an interview is scheduled
   */
  interviewScheduled: (
    interviewData: {
      id: string;
      candidateId: string;
      candidateName: string;
      candidateEmail: string;
      jobOrderId: string;
      jobTitle: string;
      scheduledDate: string;
      scheduledTime: string;
      interviewerName: string;
      interviewerEmail: string;
      interviewType: string;
    },
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'interview.scheduled',
      data: interviewData,
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a placement is created
   */
  placementCreated: (
    placementData: {
      id: string;
      candidateId: string;
      candidateName: string;
      jobOrderId: string;
      jobTitle: string;
      companyName: string;
      startDate: string;
      billRate: number;
      payRate: number;
      duration?: string;
    },
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'placement.created',
      data: placementData,
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a placement is ending soon
   */
  placementEndingSoon: (
    placementData: {
      id: string;
      candidateId: string;
      candidateName: string;
      candidateEmail: string;
      jobOrderId: string;
      jobTitle: string;
      companyName: string;
      endDate: string;
    },
    daysRemaining: number,
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'placement.ending_soon',
      data: { ...placementData, daysRemaining },
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a timesheet is submitted
   */
  timesheetSubmitted: (
    timesheetData: {
      id: string;
      placementId: string;
      candidateId: string;
      candidateName: string;
      candidateEmail: string;
      jobTitle: string;
      weekEnding: string;
      totalHours: number;
      status: string;
    },
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'timesheet.submitted',
      data: timesheetData,
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a timesheet is approved
   */
  timesheetApproved: (
    timesheetData: {
      id: string;
      placementId: string;
      candidateId: string;
      candidateName: string;
      jobTitle: string;
      weekEnding: string;
      totalHours: number;
      billRate: number;
      payRate: number;
    },
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'timesheet.approved',
      data: timesheetData,
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when an invoice is created
   */
  invoiceCreated: (
    invoiceData: {
      id: string;
      invoiceNumber: string;
      clientId: string;
      clientName: string;
      clientEmail: string;
      amount: number;
      dueDate: string;
      items: any[];
    },
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'invoice.created',
      data: invoiceData,
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when an invoice becomes overdue
   */
  invoiceOverdue: (
    invoiceData: {
      id: string;
      invoiceNumber: string;
      clientId: string;
      clientName: string;
      clientEmail: string;
      amount: number;
      dueDate: string;
    },
    daysOverdue: number,
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'invoice.overdue',
      data: { ...invoiceData, daysOverdue },
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a document signature is requested
   */
  documentSignatureRequested: (
    documentData: {
      id: string;
      documentType: string;
      recipientId: string;
      recipientName: string;
      recipientEmail: string;
      description: string;
    },
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'document.signature_requested',
      data: documentData,
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),

  /**
   * Triggered when a document is about to expire
   */
  documentExpiring: (
    documentData: {
      id: string;
      documentType: string;
      recipientId: string;
      recipientName: string;
      recipientEmail: string;
      expiryDate: string;
    },
    daysUntilExpiry: number,
    orgId: string,
    userId: string
  ) =>
    dispatchAgentEvent({
      type: 'document.expiring',
      data: { ...documentData, daysUntilExpiry },
      orgId,
      userId,
      timestamp: new Date().toISOString(),
    }),
};

/**
 * Export event types for reference
 */
export const ATS_EVENTS = {
  CANDIDATE_CREATED: 'candidate.created',
  RESUME_PARSED: 'candidate.resume_parsed',
  JOB_ORDER_CREATED: 'job_order.created',
  SUBMISSION_STATUS_CHANGED: 'submission.status_changed',
  INTERVIEW_SCHEDULED: 'interview.scheduled',
  PLACEMENT_CREATED: 'placement.created',
  PLACEMENT_ENDING_SOON: 'placement.ending_soon',
  TIMESHEET_SUBMITTED: 'timesheet.submitted',
  TIMESHEET_APPROVED: 'timesheet.approved',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_OVERDUE: 'invoice.overdue',
  DOCUMENT_SIGNATURE_REQUESTED: 'document.signature_requested',
  DOCUMENT_EXPIRING: 'document.expiring',
} as const;
