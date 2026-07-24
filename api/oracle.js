// /api/oracle.js — Vercel Serverless Function
// Accepts only typed Liber 333 reading requests, reconstructs the canonical
// Oracle prompt on the server, enforces public-access controls, and proxies
// the configured provider response.

import { randomUUID } from 'node:crypto';
import { applyOracleAccessHeaders, checkOracleAccess } from './_lib/oracleRateLimit.js';
import { buildOraclePromptFromRequest, validateOracleRequest } from '../src/features/oracle/oracleRequest.js';

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-1-20250805';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const MAX_TOKENS = 3200;
const THINKING_BUDGET = 1600;

function normalizeOrigin(value) {
  if (!value) return null;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, '');
}

function allowedOrigins() {
  return new Set(
    [
      process.env.PUBLIC_APP_ORIGIN,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      process.env.VERCEL_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ]
      .map(normalizeOrigin)
      .filter(Boolean)
  );
}

function applyResponseHeaders(req, res, requestId) {
  const origin = normalizeOrigin(req.headers?.origin);
  const allowed = allowedOrigins();

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Oracle-Request-Version', '1');
  res.setHeader('X-Oracle-Request-Id', requestId);

  if (origin && allowed.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  return !origin || allowed.has(origin);
}

function logOracleEvent(event, details = {}) {
  console.log(JSON.stringify({
    scope: 'liber333-oracle',
    event,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

function accessError(access) {
  if (access.code === 'oracle_disabled') {
    return 'The Oracle is temporarily veiled.';
  }
  if (access.code === 'oracle_rate_limit_unavailable') {
    return 'The Oracle cannot open safely at this moment.';
  }
  return access.retryAfter > 0
    ? `The Oracle rests between consultations. Try again in ${access.retryAfter} seconds.`
    : 'The Oracle rests between consultations. Try again shortly.';
}

export default async function handler(req, res) {
  const requestId = randomUUID();
  const originAllowed = applyResponseHeaders(req, res, requestId);

  if (!originAllowed) {
    logOracleEvent('rejected', { requestId, reason: 'origin_not_allowed' });
    return res.status(403).json({ error: 'Origin not allowed.', requestId });
  }

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.', requestId });

  const validation = validateOracleRequest(req.body || {});
  if (!validation.ok) {
    logOracleEvent('rejected', { requestId, reason: validation.code });
    return res.status(400).json({ error: validation.error, code: validation.code, requestId });
  }

  const { request } = validation;
  const access = await checkOracleAccess({ req });
  applyOracleAccessHeaders(res, access);

  if (access.degraded || access.internalError) {
    logOracleEvent('rate_limit_state', {
      requestId,
      operation: request.operation,
      mode: access.mode,
      degraded: access.degraded,
      error: access.internalError || undefined,
    });
  }

  if (!access.allowed) {
    logOracleEvent('rejected', {
      requestId,
      operation: request.operation,
      reason: access.code,
      rateLimitMode: access.mode,
      retryAfter: access.retryAfter,
    });
    return res.status(access.status).json({
      error: accessError(access),
      code: access.code,
      retryAfter: access.retryAfter,
      requestId,
    });
  }

  const { prompt, systemPrompt } = buildOraclePromptFromRequest(request);
  const stream = request.stream;
  const thinking = true;

  const anthropicKey =
    process.env.ANTHROPIC_API_KEY ||
    process.env.Liber333Oracle ||
    process.env.LIBER333_ORACLE ||
    process.env.LIBER_333_ORACLE ||
    process.env.CLAUDE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  logOracleEvent('accepted', {
    requestId,
    operation: request.operation,
    stream,
    rateLimitMode: access.mode,
  });

  if (stream && anthropicKey) {
    try {
      const result = await streamAnthropic({ res, prompt, systemPrompt, thinking, anthropicKey });
      logOracleEvent('completed', {
        requestId,
        operation: request.operation,
        provider: 'anthropic',
        model: ANTHROPIC_MODEL,
        stream: true,
      });
      return result;
    } catch (error) {
      logOracleEvent('provider_error', {
        requestId,
        operation: request.operation,
        provider: 'anthropic',
        stream: true,
        error: error.message,
      });
      if (res.headersSent) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: error.message, requestId })}\n\n`);
        return res.end();
      }
    }
  }

  if (anthropicKey) {
    try {
      const text = await bufferedAnthropic({ prompt, systemPrompt, thinking, anthropicKey });
      logOracleEvent('completed', {
        requestId,
        operation: request.operation,
        provider: 'anthropic',
        model: ANTHROPIC_MODEL,
        stream: false,
      });
      return res.status(200).json({ text, provider: 'anthropic', model: ANTHROPIC_MODEL, requestId });
    } catch (error) {
      logOracleEvent('provider_error', {
        requestId,
        operation: request.operation,
        provider: 'anthropic',
        stream: false,
        error: error.message,
      });
      return res.status(502).json({
        error: `Anthropic: ${error.message}`,
        provider: 'anthropic',
        model: ANTHROPIC_MODEL,
        requestId,
      });
    }
  }

  if (geminiKey) {
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n---\n\n${prompt}` : prompt;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { maxOutputTokens: MAX_TOKENS },
          }),
        }
      );
      if (!response.ok) {
        const providerError = await response.json().catch(() => ({}));
        throw new Error(providerError.error?.message || `Gemini API error: ${response.status}`);
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'The Abyss returns silence.';
      logOracleEvent('completed', {
        requestId,
        operation: request.operation,
        provider: 'gemini',
        model: GEMINI_MODEL,
        stream: false,
      });
      return res.status(200).json({ text, provider: 'gemini', model: GEMINI_MODEL, requestId });
    } catch (error) {
      logOracleEvent('provider_error', {
        requestId,
        operation: request.operation,
        provider: 'gemini',
        stream: false,
        error: error.message,
      });
      return res.status(502).json({
        error: `Gemini: ${error.message}`,
        provider: 'gemini',
        model: GEMINI_MODEL,
        requestId,
      });
    }
  }

  logOracleEvent('provider_unavailable', { requestId, operation: request.operation });
  return res.status(503).json({
    error: 'No Oracle provider is configured. Add ANTHROPIC_API_KEY or GEMINI_API_KEY in the deployment environment, then redeploy.',
    requestId,
  });
}

function buildBody({ prompt, systemPrompt, thinking, stream }) {
  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt || '',
    messages: [{ role: 'user', content: prompt }],
  };
  if (thinking) {
    body.thinking = { type: 'enabled', budget_tokens: THINKING_BUDGET };
  }
  if (stream) body.stream = true;
  return body;
}

async function bufferedAnthropic({ prompt, systemPrompt, thinking, anthropicKey }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(buildBody({ prompt, systemPrompt, thinking, stream: false })),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content
    ?.filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n') || 'The Abyss returns silence.';
}

async function streamAnthropic({ res, prompt, systemPrompt, thinking, anthropicKey }) {
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(buildBody({ prompt, systemPrompt, thinking, stream: true })),
  });

  if (!upstream.ok || !upstream.body) {
    const error = await upstream.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${upstream.status}`);
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let inThinking = false;
  let emitted = false;

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const block of events) {
      const dataLine = block.split('\n').find((line) => line.startsWith('data:'));
      if (!dataLine) continue;
      const json = dataLine.slice(5).trim();
      if (!json || json === '[DONE]') continue;

      let event;
      try {
        event = JSON.parse(json);
      } catch {
        continue;
      }

      if (event.type === 'content_block_start') {
        inThinking = event.content_block?.type === 'thinking';
        if (inThinking) send('thinking', { active: true });
      } else if (event.type === 'content_block_delta') {
        const delta = event.delta || {};
        if (delta.type === 'text_delta' && delta.text) {
          emitted = true;
          send('token', { text: delta.text });
        }
      } else if (event.type === 'content_block_stop') {
        if (inThinking) send('thinking', { active: false });
        inThinking = false;
      } else if (event.type === 'error') {
        send('error', { error: event.error?.message || 'Oracle stream error.' });
      }
    }
  }

  if (!emitted) send('token', { text: 'The Abyss returns silence.' });
  send('done', { ok: true, provider: 'anthropic', model: ANTHROPIC_MODEL });
  return res.end();
}
