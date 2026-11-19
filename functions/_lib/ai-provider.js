// Pluggable AI provider layer: Cloudflare Workers AI (primary native binding),
// Pollinations.ai (optional API-keyed or free endpoint), and Google Gemini fallback.
import { InputError } from './site.js';

const CF_PRIMARY_MODEL = '@cf/mistralai/mistral-small-3.1-24b-instruct';
const CF_FALLBACK_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';

export function extractJsonObject(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') throw new SyntaxError('AI response is not JSON');
  const trimmed = raw.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch { /* fallback to balanced brace extraction */ }

  const start = trimmed.indexOf('{');
  if (start === -1) throw new SyntaxError('No JSON object found in AI output');
  let depth = 0, inStr = false, escaped = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const slice = trimmed.slice(start, i + 1);
        const parsed = JSON.parse(slice);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
        break;
      }
    }
  }
  throw new SyntaxError('Invalid JSON object in AI output');
}

export function hasConfiguredAiProvider(env = {}) {
  return Boolean(
    (env?.AI && typeof env.AI.run === 'function') ||
    env?.POLLINATIONS_API_KEY ||
    String(env?.POLLINATIONS_ENABLED || '').toLowerCase() === 'true' ||
    env?.GEMINI_API_KEY
  );
}

function providerOrder(env = {}) {
  const hasCf = Boolean(env?.AI && typeof env.AI.run === 'function');
  const hasPollinations = Boolean(
    env?.POLLINATIONS_API_KEY || String(env?.POLLINATIONS_ENABLED || '').toLowerCase() === 'true'
  );
  const hasGemini = Boolean(env?.GEMINI_API_KEY);
  const pref = String(env?.AI_PROVIDER || 'auto').toLowerCase();

  let order;
  if (pref === 'pollinations') order = ['pollinations', 'cloudflare', 'gemini'];
  else if (pref === 'gemini') order = ['gemini', 'cloudflare', 'pollinations'];
  else if (pref === 'cloudflare') order = ['cloudflare', 'pollinations', 'gemini'];
  else {
    order = env?.POLLINATIONS_API_KEY
      ? ['cloudflare', 'pollinations', 'gemini']
      : ['cloudflare', 'gemini', 'pollinations'];
  }

  const available = { cloudflare: hasCf, pollinations: hasPollinations, gemini: hasGemini };
  return order.filter(name => available[name]);
}

async function runCloudflareAi(env, { system, user, temperature, maxTokens }) {
  const primary = String(env?.CF_AI_MODEL || CF_PRIMARY_MODEL);
  const candidates = primary === CF_FALLBACK_MODEL ? [primary] : [primary, CF_FALLBACK_MODEL];
  let lastErr = null;
  for (const model of candidates) {
    try {
      let res;
      try {
        res = await env.AI.run(model, {
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' }
        });
      } catch (firstErr) {
        // Retry once without response_format only if that parameter/schema was rejected.
        if (!/response_format|schema|invalid|argument|unsupported|400/i.test(String(firstErr?.message || ''))) {
          throw firstErr;
        }
        res = await env.AI.run(model, {
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          temperature,
          max_tokens: maxTokens
        });
      }
      const raw = res?.response ?? res?.choices?.[0]?.message?.content ?? res;
      const data = extractJsonObject(raw);
      return { data, provider: 'cloudflare-ai', model };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Cloudflare AI unavailable');
}

async function runPollinations(env, { system, user, temperature, maxTokens }) {
  const hasKey = Boolean(env?.POLLINATIONS_API_KEY);
  const url = hasKey
    ? 'https://gen.pollinations.ai/v1/chat/completions'
    : 'https://text.pollinations.ai/openai';
  const model = String(env?.POLLINATIONS_MODEL || (hasKey ? 'openai' : 'openai-fast'));
  const headers = { 'Content-Type': 'application/json' };
  if (hasKey) headers.Authorization = 'Bearer ' + env.POLLINATIONS_API_KEY;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: { type: 'json_object' },
      temperature,
      max_tokens: maxTokens
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (res.status === 402 || res.status === 429) {
    throw new InputError('Pollinations-limiet bereikt; probeer over een minuut opnieuw of gebruik Cloudflare AI.', 429);
  }
  if (!res.ok) throw new Error('Pollinations HTTP ' + res.status);
  const payload = await res.json();
  const content = payload?.choices?.[0]?.message?.content;
  const data = extractJsonObject(content);
  return { data, provider: hasKey ? 'pollinations' : 'pollinations-free', model: payload?.model || model };
}

async function runGemini(env, { system, user, temperature }) {
  const model = /^[a-z0-9.-]+$/.test(env?.GEMINI_MODEL || '') ? env.GEMINI_MODEL : 'gemini-2.5-flash';
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: system + '\n\n' + user }] }],
        generationConfig: { responseMimeType: 'application/json', temperature }
      }),
      signal: AbortSignal.timeout(15000)
    }
  );
  if (!res.ok) throw new Error('Gemini unavailable (' + res.status + ')');
  const payload = await res.json();
  const textPart = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof textPart !== 'string' || textPart.length > 4000) {
    throw new InputError('Geen bruikbaar AI-antwoord', 422);
  }
  const data = extractJsonObject(textPart);
  return { data, provider: 'gemini', model };
}

export async function generateStructuredJson(env, { system, user, temperature = 0.1, maxTokens = 700 }) {
  const order = providerOrder(env);
  if (order.length === 0) {
    throw new InputError('AI nog niet geactiveerd. Handmatig beheer blijft mogelijk.', 503);
  }
  let lastError = null;
  for (const name of order) {
    try {
      if (name === 'cloudflare') return await runCloudflareAi(env, { system, user, temperature, maxTokens });
      if (name === 'pollinations') return await runPollinations(env, { system, user, temperature, maxTokens });
      if (name === 'gemini') return await runGemini(env, { system, user, temperature });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('AI provider unavailable');
}
