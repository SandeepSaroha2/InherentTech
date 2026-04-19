/**
 * Cross-App Integration Layer
 *
 * Defines how the 5 apps communicate with each other.
 * In production, these are internal API calls between services.
 * In the monorepo, they share the same database via Prisma.
 */

export interface CrossAppEvent {
  source: 'aiocrm' | 'ats' | 'kudodoc' | 'jobplatform' | 'web';
  target: 'aiocrm' | 'ats' | 'kudodoc' | 'jobplatform' | 'web';
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

// Event type definitions for cross-app communication
export const CROSS_APP_EVENTS = {
  // ATS → KudoDoc
  PLACEMENT_ONBOARD: 'ats.placement.onboard',           // Trigger onboarding docs
  SUBMISSION_ACCEPTED: 'ats.submission.accepted',        // Generate offer letter

  // ATS → JobPlatform
  JOB_PUBLISHED: 'ats.job.published',                    // Show on public board
  JOB_UNPUBLISHED: 'ats.job.unpublished',               // Remove from board
  JOB_FILLED: 'ats.job.filled',                          // Mark as filled on board

  // JobPlatform → ATS
  APPLICATION_RECEIVED: 'jobplatform.application.received', // New candidate/submission

  // AIOCRM → ATS
  LEAD_CONVERTED: 'aiocrm.lead.converted',               // New client → create org contact
  CLIENT_JOB_REQUEST: 'aiocrm.client.job_request',       // Client wants to fill a position

  // ATS → AIOCRM
  PLACEMENT_CREATED: 'ats.placement.created',             // Track revenue in CRM
  INVOICE_PAID: 'ats.invoice.paid',                       // Update CRM payment records

  // KudoDoc → ATS
  DOCUMENT_SIGNED: 'kudodoc.document.signed',             // All docs signed → clear onboarding
  SIGNATURE_DECLINED: 'kudodoc.signature.declined',       // Alert recruiter

  // KudoDoc → AIOCRM
  CONTRACT_SIGNED: 'kudodoc.contract.signed',             // Client contract executed

  // Any → Web (analytics)
  METRIC_UPDATE: 'any.metric.update',                     // Dashboard KPI update
} as const;

export type CrossAppEventType = typeof CROSS_APP_EVENTS[keyof typeof CROSS_APP_EVENTS];

// Dispatch a cross-app event (fire-and-forget)
export async function dispatchCrossAppEvent(event: CrossAppEvent): Promise<void> {
  // In monorepo, this writes directly to DB or triggers n8n webhook
  // In microservices, this would be a message queue (Redis, SQS, etc.)
  console.log(`[CrossApp] ${event.source} → ${event.target}: ${event.event}`, event.data);

  // TODO: In production, dispatch via:
  // 1. Database event table for audit
  // 2. n8n webhook for automation
  // 3. WebSocket for real-time UI updates
}

// Helper to build events
export function createCrossAppEvent(
  source: CrossAppEvent['source'],
  target: CrossAppEvent['target'],
  event: string,
  data: Record<string, any>
): CrossAppEvent {
  return { source, target, event, data, timestamp: new Date().toISOString() };
}
