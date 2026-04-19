/**
 * Agent LLM service — uses Ollama (local) via OpenAI-compatible API.
 * Replaces the previous Anthropic Claude implementation.
 *
 * Ollama endpoint: http://localhost:11434/v1/chat/completions
 * Model: configurable via OLLAMA_MODEL env var (default: llama3.2)
 */
import type { AgentConfig, AgentAction } from './types';

const OLLAMA_BASE = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OllamaTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

type OllamaMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: OllamaToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

interface OllamaToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface OllamaResponse {
  choices: Array<{
    finish_reason: string;
    message: {
      role: string;
      content: string | null;
      tool_calls?: OllamaToolCall[];
    };
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert our AgentTool definitions into Ollama/OpenAI tool format.
 * Kept as `toAnthropicTools` for backwards compatibility with existing callers.
 */
export function toAnthropicTools(
  tools: Array<{ name: string; description: string; parameters: Record<string, any> }>
): OllamaTool[] {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: {
        type: 'object' as const,
        properties: t.parameters.properties || {},
        required: t.parameters.required || [],
      },
    },
  }));
}

async function ollamaChat(
  messages: OllamaMessage[],
  tools: OllamaTool[],
  systemPrompt: string,
  config: AgentConfig
): Promise<OllamaResponse> {
  const allMessages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const body: Record<string, any> = {
    model: OLLAMA_MODEL,
    messages: allMessages,
    stream: false,
    options: {
      temperature: config.temperature ?? 0.3,
      num_predict: config.maxTokens ?? 2048,
    },
  };

  if (tools.length > 0) {
    body.tools = tools;
  }

  const res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama error ${res.status}: ${err}`);
  }

  return res.json() as Promise<OllamaResponse>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ClaudeAgentRequest {
  config: AgentConfig;
  systemPrompt: string;
  userMessage: string;
  tools: OllamaTool[];
  /** Callback to execute a tool and return its string result */
  executeTool: (name: string, input: Record<string, any>) => Promise<string>;
}

export interface ClaudeAgentResponse {
  reasoning: string;
  actions: AgentAction[];
  tokensUsed: number;
  rawResponse: any;
}

/**
 * Run one full agentic loop: send prompt → handle tool calls → collect final text.
 * Supports up to 5 rounds of tool use before forcing a final answer.
 */
export async function runClaudeAgent(req: ClaudeAgentRequest): Promise<ClaudeAgentResponse> {
  const actions: AgentAction[] = [];
  let totalTokens = 0;
  let finalText = '';

  const messages: OllamaMessage[] = [
    { role: 'user', content: req.userMessage },
  ];

  const MAX_ROUNDS = 5;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await ollamaChat(messages, req.tools, req.systemPrompt, req.config);

    totalTokens +=
      (response.usage?.prompt_tokens || 0) +
      (response.usage?.completion_tokens || 0);

    const choice = response.choices[0];
    if (!choice) break;

    const msg = choice.message;

    // Collect any text content
    if (msg.content) {
      finalText = msg.content;
    }

    // No tool calls — done
    if (!msg.tool_calls || msg.tool_calls.length === 0 || choice.finish_reason === 'stop') {
      break;
    }

    // Add assistant message with tool calls
    messages.push({
      role: 'assistant',
      content: msg.content ?? null,
      tool_calls: msg.tool_calls,
    });

    // Execute each tool and append results
    for (const toolCall of msg.tool_calls) {
      let result = '';
      try {
        const input = JSON.parse(toolCall.function.arguments || '{}');
        result = await req.executeTool(toolCall.function.name, input);

        actions.push({
          id: `action_${Date.now()}_${toolCall.id}`,
          agentName: req.config.name,
          actionType: toolCall.function.name,
          description: `Executed tool: ${toolCall.function.name}`,
          input,
          status: 'executed',
          requiresApproval: false,
          createdAt: new Date().toISOString(),
          executedAt: new Date().toISOString(),
          result,
        });
      } catch (err: any) {
        result = `Error: ${err.message}`;
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  return {
    reasoning: finalText,
    actions,
    tokensUsed: totalTokens,
    rawResponse: null,
  };
}
