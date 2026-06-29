// /api/oracle.js — Vercel Serverless Function
// Proxies AI requests so the API key never touches the browser.
//
// Supports two modes:
//   • Streaming (stream: true)  — Server-Sent Events, token-by-token, with
//     Claude Opus 4.8 extended thinking. The Oracle "speaks from the depths"
//     as the text materializes live in the client.
//   • Buffered (default)        — single JSON { text } response.
//
// Anthropic (Claude Opus 4.8) is preferred; Gemini is a non-streaming fallback.

const ANTHROPIC_MODEL = 'claude-opus-4-8';
const MAX_TOKENS = 3200;        // ceiling for thinking + visible response
const THINKING_BUDGET = 1600;   // private reasoning before the Oracle speaks

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, systemPrompt, stream = false, thinking = true, conversation = null } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  // Accept the canonical name first, then a few names this project has
  // used in the wild so an existing Vercel variable still works.
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
      return await streamAnthropic({ res, prompt, systemPrompt, thinking, anthropicKey, conversation });
    } catch (err) {
      console.error('Anthropic stream error:', err.message);
      // If we've already started writing the SSE body we can't fall back cleanly.
      if (res.headersSent) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
        return res.end();
      }
      // else fall through to buffered handling below
    }
  }

  // ── Buffered Anthropic ───────────────────────────────────────────────
  if (anthropicKey) {
    try {
      const text = await bufferedAnthropic({ prompt, systemPrompt, thinking, anthropicKey, conversation });
      return res.status(200).json({ text });
    } catch (err) {
      console.error('Anthropic error:', err.message);
      // Do NOT mask the real Anthropic failure behind Gemini. Surface it.
      return res.status(502).json({ error: `Anthropic: ${err.message}` });
    }
  }

  // ── Buffered Gemini — only when NO Anthropic key is configured ───────
  if (geminiKey) {
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n---\n\n${prompt}` : prompt;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
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
      return res.status(200).json({ text });
    } catch (err) {
      console.error('Gemini error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(500).json({
    error: 'No Anthropic key found. In Vercel → Settings → Environment Variables, set ANTHROPIC_API_KEY to your secret value (it begins with "sk-ant-"), scope it to Production, then redeploy.',
  });
}

// ─────────────────────────────────────────────────────────────────────
//  Anthropic helpers
// ─────────────────────────────────────────────────────────────────────

function buildBody({ prompt, systemPrompt, thinking, stream, conversation }) {
  const messages = (conversation && conversation.length > 0)
    ? [...conversation, { role: 'user', content: prompt }]
    : [{ role: 'user', content: prompt }];
  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt || '',
    messages,
  };
  if (thinking) {
    body.thinking = { type: 'adaptive' };
    body.output_config = { effort: 'high' };
  }
  if (stream) body.stream = true;
  return body;
}

async function bufferedAnthropic({ prompt, systemPrompt, thinking, anthropicKey, conversation }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(buildBody({ prompt, systemPrompt, thinking, stream: false, conversation })),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  // Only surface visible text blocks; thinking blocks stay in the Abyss.
  const text = data.content
    ?.filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n') || 'The Abyss returns silence.';
  return text;
}

async function streamAnthropic({ res, prompt, systemPrompt, thinking, anthropicKey, conversation }) {
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(buildBody({ prompt, systemPrompt, thinking, stream: true, conversation })),
  });

  if (!upstream.ok || !upstream.body) {
    const err = await upstream.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error: ${upstream.status}`);
  }

  // Open our own SSE channel to the browser.
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
      const dataLine = block.split('\n').find(l => l.startsWith('data:'));
      if (!dataLine) continue;
      const json = dataLine.slice(5).trim();
      if (!json || json === '[DONE]') continue;

      let evt;
      try { evt = JSON.parse(json); } catch { continue; }

      if (evt.type === 'content_block_start') {
        inThinking = evt.content_block?.type === 'thinking';
        if (inThinking) send('thinking', { active: true });
      } else if (evt.type === 'content_block_delta') {
        const d = evt.delta || {};
        if (d.type === 'text_delta' && d.text) {
          emitted = true;
          send('token', { text: d.text });
        }
        // thinking_delta / signature_delta intentionally ignored (stays private)
      } else if (evt.type === 'content_block_stop') {
        if (inThinking) send('thinking', { active: false });
        inThinking = false;
      } else if (evt.type === 'message_stop') {
        // handled after loop
      } else if (evt.type === 'error') {
        send('error', { error: evt.error?.message || 'stream error' });
      }
    }
  }

  if (!emitted) send('token', { text: 'The Abyss returns silence.' });
  send('done', { ok: true });
  return res.end();
}
