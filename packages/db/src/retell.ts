/**
 * Retell AI — outbound voice call client.
 * Docs: https://docs.retellai.com/api-references/create-phone-call
 */

const RETELL_BASE = 'https://api.retellai.com';

export interface RetellCallParams {
  toNumber: string;            // E.164 format: +15551234567
  fromNumber?: string;         // Your Retell phone number (defaults to env)
  agentId?: string;            // Retell agent ID (defaults to env)
  metadata?: Record<string, string>; // Passed to agent as context
  retellLlmDynamicVariables?: Record<string, string>; // Dynamic prompt vars
}

export interface RetellCallResult {
  callId: string;
  status: string;
  toNumber: string;
  fromNumber: string;
  agentId: string;
}

export async function createRetellCall(params: RetellCallParams): Promise<RetellCallResult> {
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) throw new Error('RETELL_API_KEY not configured');

  const fromNumber = params.fromNumber || process.env.RETELL_FROM_NUMBER;
  const agentId = params.agentId || process.env.RETELL_AGENT_ID;

  if (!fromNumber) throw new Error('RETELL_FROM_NUMBER not configured');
  if (!agentId)    throw new Error('RETELL_AGENT_ID not configured');

  const body: Record<string, unknown> = {
    from_number: fromNumber,
    to_number: params.toNumber,
    agent_id: agentId,
  };
  if (params.metadata) body['metadata'] = params.metadata;
  if (params.retellLlmDynamicVariables) body['retell_llm_dynamic_variables'] = params.retellLlmDynamicVariables;

  const res = await fetch(`${RETELL_BASE}/v2/create-phone-call`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Retell API error ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    call_id: string;
    call_status: string;
    to_number: string;
    from_number: string;
    agent_id: string;
  };

  return {
    callId: data.call_id,
    status: data.call_status,
    toNumber: data.to_number,
    fromNumber: data.from_number,
    agentId: data.agent_id,
  };
}

export async function getRetellCall(callId: string): Promise<{ status: string; transcript?: string; recordingUrl?: string }> {
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) throw new Error('RETELL_API_KEY not configured');

  const res = await fetch(`${RETELL_BASE}/v2/get-call/${callId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!res.ok) throw new Error(`Retell get-call error ${res.status}`);
  const data = await res.json() as { call_status: string; transcript?: string; recording_url?: string };

  return {
    status: data.call_status,
    transcript: data.transcript,
    recordingUrl: data.recording_url,
  };
}
