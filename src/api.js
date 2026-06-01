// /src/api.js — Oracle API helper
// All AI calls go through /api/oracle (Vercel serverless function)
// instead of calling Anthropic/Gemini directly from the browser.

// ── Buffered request (single response) ──────────────────────────────
export async function fetchOracleInterpretation({ prompt, systemPrompt, signal }) {
  try {
    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemPrompt, stream: false }),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(err.error || err.details || `API returned ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    console.error('Oracle fetch error:', e);
    throw e;
  }
}

// ── Streaming request (Server-Sent Events) ──────────────────────────
// Calls onToken(textChunk) as the Oracle speaks, and onThinking(active)
// when Opus 4.8 enters/leaves its private reasoning. Resolves with the
// full assembled text. Falls back to the buffered endpoint if the
// browser/runtime can't read a streaming body.
export async function streamOracleInterpretation({
  prompt,
  systemPrompt,
  signal,
  onToken,
  onThinking,
}) {
  let response;
  try {
    response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemPrompt, stream: true }),
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    // Network-level failure — try buffered as a last resort.
    return fetchOracleInterpretation({ prompt, systemPrompt, signal });
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || err.details || `API returned ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  // If the server answered with plain JSON (e.g. Gemini fallback), buffer it.
  if (!contentType.includes('text/event-stream') || !response.body) {
    const data = await response.json().catch(() => null);
    const text = data?.text || 'The Abyss returns silence.';
    if (onToken) onToken(text);
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  const handleEvent = (block) => {
    const lines = block.split('\n');
    let event = 'message';
    let dataStr = '';
    for (const line of lines) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
    }
    if (!dataStr) return;
    let payload;
    try { payload = JSON.parse(dataStr); } catch { return; }

    if (event === 'token' && payload.text) {
      full += payload.text;
      if (onToken) onToken(payload.text);
    } else if (event === 'thinking') {
      if (onThinking) onThinking(!!payload.active);
    } else if (event === 'error') {
      throw new Error(payload.error || 'Oracle stream error');
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || '';
    for (const block of blocks) handleEvent(block);
  }
  if (buffer.trim()) handleEvent(buffer);

  return full || 'The Abyss returns silence.';
}
