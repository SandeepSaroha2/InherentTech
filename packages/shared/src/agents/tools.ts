import type { AgentTool, AgentContext, AgentToolResult } from './types';

// Tool factory helpers
export function createTool(
  name: string,
  description: string,
  parameters: Record<string, any>,
  executeFn: (input: any, context: AgentContext) => Promise<AgentToolResult>
): AgentTool {
  return { name, description, parameters, execute: executeFn };
}

// ---- CRM Tools ----

export const searchLeadsTool = createTool(
  'search_leads',
  'Search CRM leads by company name, contact name, stage, or source',
  {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      stage: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] },
      limit: { type: 'number', default: 10 },
    },
  },
  async (input, context) => {
    // Placeholder — wired to actual DB in API layer
    return { success: true, data: { message: 'Lead search executed', query: input.query, results: [] } };
  }
);

export const updateLeadStageTool = createTool(
  'update_lead_stage',
  'Move a lead to a new pipeline stage',
  {
    type: 'object',
    properties: {
      leadId: { type: 'string' },
      newStage: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] },
      reason: { type: 'string' },
    },
    required: ['leadId', 'newStage'],
  },
  async (input, context) => {
    return { success: true, data: { message: `Lead ${input.leadId} moved to ${input.newStage}` } };
  }
);

export const createActivityTool = createTool(
  'create_activity',
  'Log an activity (call, email, meeting, note, task) against a lead',
  {
    type: 'object',
    properties: {
      leadId: { type: 'string' },
      type: { type: 'string', enum: ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK'] },
      description: { type: 'string' },
      scheduledAt: { type: 'string', format: 'date-time' },
    },
    required: ['leadId', 'type', 'description'],
  },
  async (input, context) => {
    return { success: true, data: { message: 'Activity created', activityId: `act_${Date.now()}` } };
  }
);

// ---- ATS Tools ----

export const searchCandidatesTool = createTool(
  'search_candidates',
  'Search ATS candidates by skills, visa status, location, experience, or rate range',
  {
    type: 'object',
    properties: {
      skills: { type: 'array', items: { type: 'string' } },
      visaStatus: { type: 'string' },
      location: { type: 'string' },
      minExperience: { type: 'number' },
      maxRate: { type: 'number' },
      limit: { type: 'number', default: 20 },
    },
  },
  async (input, context) => {
    return { success: true, data: { message: 'Candidate search executed', results: [] } };
  }
);

export const createSubmissionTool = createTool(
  'create_submission',
  'Submit a candidate to a job order',
  {
    type: 'object',
    properties: {
      candidateId: { type: 'string' },
      jobOrderId: { type: 'string' },
      billRate: { type: 'number' },
      payRate: { type: 'number' },
      notes: { type: 'string' },
    },
    required: ['candidateId', 'jobOrderId', 'billRate', 'payRate'],
  },
  async (input, context) => {
    return { success: true, data: { message: 'Submission created', submissionId: `sub_${Date.now()}` } };
  }
);

export const matchCandidatesToJobTool = createTool(
  'match_candidates_to_job',
  'Find best matching candidates for a specific job order based on skills, experience, visa, and rate',
  {
    type: 'object',
    properties: {
      jobOrderId: { type: 'string' },
      maxResults: { type: 'number', default: 10 },
    },
    required: ['jobOrderId'],
  },
  async (input, context) => {
    return { success: true, data: { message: 'Matching completed', matches: [] } };
  }
);

// ---- Communication Tools ----

export const sendEmailTool = createTool(
  'send_email',
  'Send an email to a contact, candidate, or client',
  {
    type: 'object',
    properties: {
      to: { type: 'string' },
      subject: { type: 'string' },
      body: { type: 'string' },
      cc: { type: 'array', items: { type: 'string' } },
    },
    required: ['to', 'subject', 'body'],
  },
  async (input, context) => {
    return { success: true, data: { message: `Email queued to ${input.to}`, emailId: `em_${Date.now()}` } };
  }
);

export const sendSlackMessageTool = createTool(
  'send_slack_message',
  'Send a notification to a Slack channel',
  {
    type: 'object',
    properties: {
      channel: { type: 'string' },
      message: { type: 'string' },
    },
    required: ['channel', 'message'],
  },
  async (input, context) => {
    return { success: true, data: { message: 'Slack message sent' } };
  }
);

// ---- Knowledge Tools ----

export const searchKnowledgeBaseTool = createTool(
  'search_knowledge_base',
  'Search the organization knowledge base for relevant information',
  {
    type: 'object',
    properties: {
      query: { type: 'string' },
      sourceType: { type: 'string', enum: ['manual', 'scraped', 'generated'] },
      limit: { type: 'number', default: 5 },
    },
    required: ['query'],
  },
  async (input, context) => {
    return { success: true, data: { message: 'KB search executed', results: [] } };
  }
);

// Export all tools grouped by category
export const CRM_TOOLS = [searchLeadsTool, updateLeadStageTool, createActivityTool];
export const ATS_TOOLS = [searchCandidatesTool, createSubmissionTool, matchCandidatesToJobTool];
export const COMMUNICATION_TOOLS = [sendEmailTool, sendSlackMessageTool];
export const KNOWLEDGE_TOOLS = [searchKnowledgeBaseTool];
export const ALL_TOOLS = [...CRM_TOOLS, ...ATS_TOOLS, ...COMMUNICATION_TOOLS, ...KNOWLEDGE_TOOLS];
