// Agent autonomy levels — 4-stage onboarding
export enum AgentAutonomyLevel {
  SHADOW = 'SHADOW',       // Observes only, suggests in sidebar
  DRAFT = 'DRAFT',         // Drafts actions, human must approve every one
  ASSISTED = 'ASSISTED',   // Executes routine actions, flags exceptions for human
  FULL_AUTO = 'FULL_AUTO', // Fully autonomous, human reviews periodically
}

export enum AgentName {
  RECRUITER_IQ = 'RECRUITER_IQ',
  BENCH_IQ = 'BENCH_IQ',
  CLIENT_IQ = 'CLIENT_IQ',
  COMPLIANCE_IQ = 'COMPLIANCE_IQ',
  BILLING_IQ = 'BILLING_IQ',
}

export interface AgentConfig {
  name: AgentName;
  displayName: string;
  description: string;
  icon: string;
  autonomyLevel: AgentAutonomyLevel;
  capabilities: string[];
  triggers: AgentTrigger[];
  systemPrompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AgentTrigger {
  event: string;          // e.g. 'candidate.created', 'lead.stage_changed'
  condition?: string;     // optional JS expression
  description: string;
}

export interface AgentContext {
  orgId: string;
  userId: string;
  agentName: AgentName;
  autonomyLevel: AgentAutonomyLevel;
  conversationHistory: AgentMessage[];
  metadata: Record<string, any>;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
  toolInput?: Record<string, any>;
  toolOutput?: any;
  timestamp: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;  // JSON Schema
  execute: (input: any, context: AgentContext) => Promise<AgentToolResult>;
}

export interface AgentToolResult {
  success: boolean;
  data: any;
  error?: string;
}

export interface AgentAction {
  id: string;
  agentName: AgentName;
  actionType: string;       // 'send_email', 'create_submission', 'update_lead', etc.
  description: string;
  input: Record<string, any>;
  status: 'pending_approval' | 'approved' | 'rejected' | 'executed' | 'failed';
  requiresApproval: boolean;
  createdAt: string;
  executedAt?: string;
  result?: any;
}

export interface AgentExecutionResult {
  executionId: string;
  agentName: AgentName;
  status: 'completed' | 'failed' | 'pending_approval';
  actions: AgentAction[];
  reasoning: string;
  tokensUsed: number;
  durationMs: number;
}
