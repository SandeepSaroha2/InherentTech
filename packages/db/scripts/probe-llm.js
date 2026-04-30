#!/usr/bin/env node
/**
 * Quick probe of whichever LLM backend is configured (LiteLLM or Ollama).
 * Confirms the env wiring and that we can get a real response.
 *
 *   node packages/db/scripts/probe-llm.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const LITELLM_URL    = (process.env.LITELLM_URL || 'https://llm.neurago.ai').replace(/\/$/, '');
const LITELLM_KEY    = process.env.LITELLM_API_KEY || '';
const LITELLM_MODEL  = process.env.LITELLM_MODEL || '';
const OLLAMA_URL     = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
const OLLAMA_MODEL   = process.env.OLLAMA_MODEL || 'llama3.2';
const USE_LITELLM    = !!(LITELLM_KEY && LITELLM_MODEL);

(async () => {
  console.log('=== LLM env state ===');
  console.log('  LITELLM_URL    :', LITELLM_URL);
  console.log('  LITELLM_API_KEY:', LITELLM_KEY ? `set (${LITELLM_KEY.length} chars)` : '(not set)');
  console.log('  LITELLM_MODEL  :', LITELLM_MODEL || '(not set)');
  console.log('  OLLAMA_URL     :', OLLAMA_URL);
  console.log('  OLLAMA_MODEL   :', OLLAMA_MODEL);
  console.log('  → USE_LITELLM =', USE_LITELLM);
  console.log('');

  if (USE_LITELLM) {
    // List models first
    console.log(`=== LiteLLM /v1/models ===`);
    const ms = await fetch(`${LITELLM_URL}/v1/models`, {
      headers: { 'Authorization': `Bearer ${LITELLM_KEY}` },
    });
    console.log('  status:', ms.status);
    const msBody = await ms.text();
    console.log('  body:', msBody.slice(0, 600));
    console.log('');

    // Test chat completion
    console.log(`=== LiteLLM /v1/chat/completions  (model=${LITELLM_MODEL}) ===`);
    const t0 = Date.now();
    const res = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LITELLM_KEY}` },
      body: JSON.stringify({
        model: LITELLM_MODEL,
        messages: [{ role: 'user', content: 'Reply with the JSON object {"ok": true}' }],
        stream: false,
        temperature: 0,
        max_tokens: 50,
        response_format: { type: 'json_object' },
      }),
    });
    const ms_elapsed = Date.now() - t0;
    console.log('  status:', res.status, ' elapsed:', ms_elapsed + 'ms');
    const body = await res.text();
    console.log('  body:', body.slice(0, 500));
  } else {
    console.log(`=== Ollama /api/version ===`);
    const v = await fetch(`${OLLAMA_URL}/api/version`).catch(e => ({ ok: false, statusText: e.message }));
    console.log('  status:', v.status || v.statusText);
    if (v.ok) console.log('  body:', (await v.text()).slice(0, 200));

    console.log(`\n=== Ollama /api/chat  (model=${OLLAMA_MODEL}) ===`);
    const t0 = Date.now();
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: 'user', content: 'Reply with the JSON object {"ok": true}' }],
        stream: false,
        format: 'json',
        options: { temperature: 0, num_predict: 50 },
      }),
    });
    const ms_elapsed = Date.now() - t0;
    console.log('  status:', res.status, ' elapsed:', ms_elapsed + 'ms');
    const body = await res.text();
    console.log('  body:', body.slice(0, 300));
  }
})().catch(e => { console.error('PROBE ERROR:', e.message); process.exit(1); });
