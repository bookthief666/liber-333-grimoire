// /api/oracle.js — Vercel Serverless Function
// Proxies AI requests so provider keys never reach the browser.
//
// Supports:
//   • Streaming Anthropic responses over Server-Sent Events.
//   • Buffered Anthropic responses.
//   • Buffered Gemini fallback only when no Anthropic key is configured.

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-1-20250805';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const MAX_TOKENS = 3200;
const THINKING_BUDGET = 1600;
const MAX_PROMPT_CHARS = 24000;
const MAX_SYSTEM_CHARS = 12000;

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

function applyResponseHeaders(req, res) {
  const origin = normalizeOrigin(req.headers?.origin);
  const allowed = allowedOrigins();

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (origin && allowed.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  return !origin || allowed.has(origin);
}

function validateRequestBody(body) {
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  const systemPrompt = typeof body?.systemPrompt === 'string' ? body.systemPrompt.trim() : '';

  if (!prompt) return { error: 'Missing prompt.' };
  if (prompt.length > MAX_PROMPT_CHARS) {
    return { error: `Prompt exceeds the ${MAX_PROMPT_CHARS.toLocaleString()} character limit.` };
  }
  if (systemPrompt.length > MAX_SYSTEM_CHARS) {
    return { error: `System prompt exceeds the ${MAX_SYSTEM_CHARS.toLocaleString()} character limit.` };
  }

  return {
    prompt,
    systemPrompt,
    stream: body?.stream === true,
    thinking: body?.thinking !== false,
  };
}

export default async function handler(req, res) {
  const originAllowed = applyResponseHeaders(req, res);

  if (!originAllowed) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const validated = validateRequestBody(req.body || {});
  if (validated.error) return res.status(400).json({ error: validated.error });

  const { prompt, systemPrompt, stream, thinking } = validated;

  // Accept the canonical name first, then legacy names previously used by this project.
  const anthropicKey =
    process.env.ANTHROPIC_API_KEY ||
    process.env.Liber333Oracle ||
    process.env.LIBER333_ORACLE ||
    process.env.LIBER_333_ORACLE ||
    process.env.CLAUDE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // ── Streaming path (Anthropic only) ──────────────────────────────────
  if (stream && anthropicKey) {
    try {
      return await streamAnthropic({ res, prompt, systemPrompt, thinking, anthropicKey });
    } catch (err) {
      console.error('Anthropic stream error:', err.message);
      if (res.headersSent) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
        return res.end();
      }
      // If the stream failed before headers were sent, retry through the buffered path below.
    }
  }

  // ── Buffered Anthropic ───────────────────────────────────────────────
  if (anthropicKey) {
    try {
      const text = await bufferedAnthropic({ prompt, systemPrompt, thinking, anthropicKey });
      return res.status(200).json({ text, provider: 'anthropic', model: ANTHROPIC_MODEL });
    } catch (err) {
      console.error('Anthropic error:', err.message);
      return res.status(502).json({
        error: `Anthropic: ${err.message}`,
        provider: 'anthropic',
        model: ANTHROPIC_MODEL,
      });
    }
  }

  // ── Buffered Gemini — only when no Anthropic key is configured ──────
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
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'The Abyss returns silence.';
      return res.status(200).json({ text, provider: 'gemini', model: GEMINI_MODEL });
    } catch (err) {
      console.error('Gemini error:', err.message);
      return res.status(502).json({
        error: `Gemini: ${err.message}`,
        provider: 'gemini',
        model: GEMINI_MODEL,
      });
    }
  }

  return res.status(503).json({
    error: 'No Oracle provider is configured. Add ANTHROPIC_API_KEY or GEMINI_API_KEY in the deployment environment, then redeploy.',
  });
}

// ─────────────────────────────────────────────────────────────────────
// Anthropic helpers
// ─────────────────────────────────────────────────────────────────────

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
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  // Only surface visible text blocks; thinking blocks remain private.
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
    const err = await upstream.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error: ${upstream.status}`);
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
        // thinking_delta and signature_delta are intentionally ignored.
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
