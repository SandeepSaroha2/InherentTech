/**
 * n8n Workflow Integration
 * Helpers for triggering and managing n8n workflows from the platform
 *
 * n8n is self-hosted at localhost:5678 (configured via N8N_BASE_URL env)
 */

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
}

interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  data?: any;
}

async function n8nFetch(path: string, options: RequestInit = {}) {
  const url = `${N8N_BASE_URL}/api/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`n8n API error ${res.status}: ${body}`);
  }

  return res.json();
}

// List all workflows
export async function listWorkflows(): Promise<N8nWorkflow[]> {
  const data = await n8nFetch('/workflows');
  return data.data || data;
}

// Get a specific workflow
export async function getWorkflow(id: string): Promise<N8nWorkflow> {
  return n8nFetch(`/workflows/${id}`);
}

// Activate a workflow
export async function activateWorkflow(id: string): Promise<void> {
  await n8nFetch(`/workflows/${id}/activate`, { method: 'POST' });
}

// Deactivate a workflow
export async function deactivateWorkflow(id: string): Promise<void> {
  await n8nFetch(`/workflows/${id}/deactivate`, { method: 'POST' });
}

// Trigger a webhook workflow
export async function triggerWebhook(webhookPath: string, data: any): Promise<any> {
  const url = `${N8N_BASE_URL}/webhook/${webhookPath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Get recent executions
export async function getExecutions(workflowId?: string, limit = 20): Promise<N8nExecution[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (workflowId) params.set('workflowId', workflowId);
  const data = await n8nFetch(`/executions?${params}`);
  return data.data || data;
}

// The 16 planned workflows for the platform
export const PLATFORM_WORKFLOWS = {
  // CRM Workflows
  LEAD_SCORING: 'lead-scoring',
  LEAD_NURTURE: 'lead-nurture-sequence',
  NEW_LEAD_ALERT: 'new-lead-slack-alert',

  // ATS Workflows
  RESUME_PARSER: 'resume-parser',
  CANDIDATE_MATCH: 'candidate-job-matcher',
  INTERVIEW_SCHEDULER: 'interview-scheduler',
  SUBMISSION_NOTIFY: 'submission-status-notify',

  // Outreach Workflows
  EMAIL_SEQUENCE: 'email-outreach-sequence',
  LINKEDIN_OUTREACH: 'linkedin-outreach',
  FOLLOW_UP_REMINDER: 'follow-up-reminder',

  // Operations Workflows
  TIMESHEET_REMINDER: 'weekly-timesheet-reminder',
  INVOICE_GENERATOR: 'invoice-generator',
  PLACEMENT_ONBOARD: 'placement-onboarding',

  // Documents Workflows
  SIGNATURE_REMINDER: 'signature-reminder',
  DOC_EXPIRY_ALERT: 'document-expiry-alert',

  // AI Workflows
  AI_AGENT_ORCHESTRATOR: 'ai-agent-orchestrator',
} as const;
